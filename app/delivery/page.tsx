// app/delivery/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Truck,
  MapPin,
  Navigation,
  CheckCircle,
  Clock,
  Phone,
  User,
  Home,
  LogOut,
  Menu,
  X,
  Compass,
  Package,
  DollarSign,
  Star,
  UserCheck,
  Award,
  Zap,
  Shield
} from 'lucide-react';

// Importar Leaflet dinamicamente (sem SSR)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

import 'leaflet/dist/leaflet.css';

type DeliveryOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  customer_lat: number;
  customer_lng: number;
  items: any[];
  total_amount: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  delivery_time: string;
};

type DeliveryAgent = {
  id: string;
  full_name: string;
  phone: string;
  vehicle: string;
  vehicle_plate: string;
  is_available: boolean;
  total_deliveries: number;
  rating: number;
};

export default function DeliveryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [agent, setAgent] = useState<DeliveryAgent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryProgress, setDeliveryProgress] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: agentData, error: agentError } = await supabase
          .from('delivery_agents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (agentError || !agentData) {
          console.error('Entregador não encontrado:', agentError);
          router.push('/dashboard');
          return;
        }

        setAgent(agentData);

        // 🔥 CORRIGIDO: Buscar pedidos com status 'delivering'
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'delivering')  // ← 'delivering' em vez de 'out_for_delivery'
          .order('created_at', { ascending: true });

        if (ordersError) {
          console.error('Erro ao buscar pedidos:', ordersError);
        } else {
          setOrders(ordersData || []);
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setCurrentLocation(loc);
              updateAgentLocation(loc);
            },
            (error) => {
              console.error('Erro GPS:', error);
              setCurrentLocation({ lat: -8.839, lng: 13.289 });
            }
          );

          const id = navigator.geolocation.watchPosition(
            (position) => {
              const loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setCurrentLocation(loc);
              updateAgentLocation(loc);
            },
            (error) => console.error('Erro GPS watch:', error),
            { 
              enableHighAccuracy: true, 
              maximumAge: 5000,
              timeout: 30000 
            }
          );

          setWatchId(id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro:', error);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [router]);

  const updateAgentLocation = async (location: { lat: number; lng: number }) => {
    if (!agent) return;

    await supabase
      .from('delivery_agents')
      .update({
        current_lat: location.lat,
        current_lng: location.lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent.id);
  };

  useEffect(() => {
    if (activeOrder && currentLocation) {
      const start = [currentLocation.lat, currentLocation.lng] as [number, number];
      const end = [activeOrder.customer_lat, activeOrder.customer_lng] as [number, number];
      
      const steps = 20;
      const routePoints: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        routePoints.push([
          start[0] + (end[0] - start[0]) * t,
          start[1] + (end[1] - start[1]) * t,
        ]);
      }
      setRoute(routePoints);
      setDeliveryProgress(0);
    }
  }, [activeOrder, currentLocation]);

  const startDelivery = (order: DeliveryOrder) => {
    setActiveOrder(order);
    setSelectedOrderId(order.id);
  };

  const completeDelivery = async () => {
    if (!activeOrder || !agent) return;

    try {
      // 🔥 Atualizar status para 'delivered'
      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeOrder.id);

      await supabase.from('order_logs').insert({
        order_id: activeOrder.id,
        status: 'delivered',
        description: 'Pedido entregue com sucesso',
        location_lat: currentLocation?.lat || 0,
        location_lng: currentLocation?.lng || 0
      });

      await supabase
        .from('delivery_agents')
        .update({
          active_order_id: null,
          is_available: true,
          total_deliveries: (agent.total_deliveries || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      alert('✅ Entrega concluída com sucesso!');
      setActiveOrder(null);
      setSelectedOrderId(null);
      setOrders(prev => prev.filter(o => o.id !== activeOrder.id));
      
      setAgent(prev => prev ? {
        ...prev,
        is_available: true,
        total_deliveries: (prev.total_deliveries || 0) + 1
      } : null);

    } catch (error) {
      console.error('Erro ao concluir entrega:', error);
      alert('❌ Erro ao concluir entrega. Tente novamente.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(value);
  };

  const totalDeliveries = agent?.total_deliveries || 0;
  const rating = agent?.rating || 0;
  const availableOrders = orders.length;
  const hasActiveOrder = activeOrder !== null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* Header */}
      <header className="bg-[#2d6a4f] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full animate-pulse">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">30 Express</span>
                <span className="block text-[10px] text-[#a7c957]">Entregador</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-white/90 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <UserCheck className="w-4 h-4 text-[#a7c957]" />
                <span>{agent?.full_name}</span>
              </div>
              <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition">
                <Home className="w-5 h-5 text-white" />
              </Link>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={Package} 
            label="Pedidos Disponíveis" 
            value={availableOrders} 
            color="bg-blue-50 text-blue-600"
            iconColor="text-blue-500"
          />
          <StatCard 
            icon={Clock} 
            label="Em Andamento" 
            value={hasActiveOrder ? '1' : '0'} 
            color="bg-orange-50 text-orange-600"
            iconColor="text-orange-500"
          />
          <StatCard 
            icon={Star} 
            label="Avaliação" 
            value={rating.toFixed(1)} 
            color="bg-yellow-50 text-yellow-600"
            iconColor="text-yellow-500"
          />
          <StatCard 
            icon={Truck} 
            label="Status" 
            value={hasActiveOrder ? 'Em Rota' : 'Disponível'} 
            color={hasActiveOrder ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}
            iconColor={hasActiveOrder ? 'text-green-500' : 'text-gray-400'}
            pulse={hasActiveOrder}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pedidos */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="font-bold text-[#2d6a4f] flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5" />
                Pedidos para Entrega
                {availableOrders > 0 && (
                  <span className="ml-auto bg-[#f4a261] text-white text-xs px-2 py-1 rounded-full">
                    {availableOrders} disponíveis
                  </span>
                )}
              </h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4 animate-bounce">🚚</div>
                  <p className="text-gray-500 font-medium">Nenhum pedido disponível</p>
                  <p className="text-sm text-gray-400 mt-1">Aguarde novos pedidos</p>
                  <div className="mt-4 p-3 bg-[#f5f0eb] rounded-xl">
                    <p className="text-xs text-gray-400">🔄 Atualizando em tempo real...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                        selectedOrderId === order.id
                          ? 'border-[#2d6a4f] bg-[#f0f7f0] shadow-md scale-[1.02]'
                          : 'border-gray-100 hover:border-[#a7c957] hover:shadow-md hover:-translate-y-0.5'
                      }`}
                      onClick={() => startDelivery(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">{order.order_number || order.id?.slice(0, 8)}</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              🚚 Em Rota
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{order.customer_name || 'Cliente'}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[180px]">{order.delivery_address}</span>
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-bold text-[#2d6a4f]">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.items?.length || 0} itens
                          </p>
                        </div>
                      </div>
                      {selectedOrderId === order.id && (
                        <div className="mt-3 pt-3 border-t border-[#2d6a4f]/20 flex items-center justify-between">
                          <span className="text-xs text-[#2d6a4f] flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Pedido selecionado
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status do Entregador - Interativo */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#2d6a4f]" />
                Meu Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Entregador
                  </span>
                  <span className="font-medium">{agent?.full_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Veículo
                  </span>
                  <span className="font-medium">{agent?.vehicle} {agent?.vehicle_plate}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${agent?.is_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    Status
                  </span>
                  <span className={`font-medium ${agent?.is_available ? 'text-green-600' : 'text-red-600'}`}>
                    {agent?.is_available ? '🟢 Disponível' : '🔴 Em entrega'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Entregas
                  </span>
                  <span className="font-medium">{agent?.total_deliveries || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#f4a261] text-[#f4a261]" />
                    Avaliação
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    {agent?.rating?.toFixed(1) || '0.0'}
                    <span className="text-xs text-gray-400">⭐</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 h-[500px] lg:h-[600px] relative">
              {currentLocation ? (
                <MapContainer
                  center={[currentLocation.lat, currentLocation.lng]}
                  zoom={14}
                  style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  
                  <Marker position={[currentLocation.lat, currentLocation.lng]}>
                    <Popup>
                      <div className="text-center">
                        <Truck className="w-6 h-6 text-[#2d6a4f] mx-auto animate-bounce" />
                        <p className="font-medium">📍 Sua localização</p>
                        <p className="text-sm text-gray-500">{agent?.full_name}</p>
                        <p className="text-xs text-gray-400">Atualizado agora</p>
                      </div>
                    </Popup>
                  </Marker>

                  {activeOrder && (
                    <Marker position={[activeOrder.customer_lat, activeOrder.customer_lng]}>
                      <Popup>
                        <div className="text-center">
                          <User className="w-6 h-6 text-blue-600 mx-auto" />
                          <p className="font-medium">{activeOrder.customer_name}</p>
                          <p className="text-sm text-gray-500">{activeOrder.delivery_address}</p>
                          <p className="text-xs text-gray-400">{activeOrder.customer_phone}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {route.length > 0 && (
                    <Polyline
                      positions={route}
                      color="#2d6a4f"
                      weight={4}
                      opacity={0.7}
                      dashArray="10, 10"
                    />
                  )}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6a4f] mx-auto"></div>
                    <p className="mt-4 text-gray-500">Carregando mapa...</p>
                  </div>
                </div>
              )}

              {/* Overlay de Informações */}
              {activeOrder && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg animate-slide-up">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="font-medium text-[#2d6a4f]">
                          {activeOrder.customer_name || 'Cliente'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {activeOrder.delivery_address}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {activeOrder.customer_phone || '-'}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {activeOrder.items?.length || 0} itens
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-[#2d6a4f] text-lg">
                        {formatCurrency(activeOrder.total_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Taxa: {formatCurrency(activeOrder.delivery_fee || 0)}
                      </p>
                      <button
                        onClick={completeDelivery}
                        className="mt-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium text-sm flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Concluir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controles de Navegação */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button 
                className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!activeOrder}
                onClick={() => {
                  if (activeOrder && currentLocation) {
                    const url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${activeOrder.customer_lat},${activeOrder.customer_lng}`;
                    window.open(url, '_blank');
                  } else {
                    alert('Selecione um pedido primeiro!');
                  }
                }}
              >
                <Navigation className="w-4 h-4" />
                {activeOrder ? 'Iniciar Navegação' : 'Selecione um Pedido'}
              </button>
              <button 
                className="flex-1 py-3 bg-[#a7c957] text-white rounded-xl hover:bg-[#8fb84a] transition font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const loc = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude,
                        };
                        setCurrentLocation(loc);
                        updateAgentLocation(loc);
                        alert('✅ Localização atualizada!');
                      },
                      (error) => {
                        console.error('Erro:', error);
                        alert('❌ Erro ao obter localização');
                      }
                    );
                  }
                }}
              >
                <Compass className="w-4 h-4" />
                Atualizar Localização
              </button>
            </div>

            {/* Dica Rápida */}
            <div className="mt-3 p-3 bg-[#f0f7f0] rounded-xl border border-[#a7c957]/30">
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2d6a4f]" />
                <span>💡 Dica: Mantenha o GPS ligado para atualizações em tempo real da sua localização.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTE STAT CARD ============

function StatCard({ icon: Icon, label, value, color, iconColor, pulse }: any) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 transition-all hover:shadow-xl hover:-translate-y-0.5 ${pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}