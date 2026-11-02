// app/delivery/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Compass,
  Package,
  Star,
  UserCheck,
  Award,
  Shield,
  Bell,
} from 'lucide-react';

// ============================================================
// LEAFLET DINÂMICO
// ============================================================
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

// ============================================================
// TIPOS
// ============================================================
type DeliveryOrder = {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  total_amount: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  delivery_agent_id: string | null;
};

type DeliveryAgent = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle: string | null;
  vehicle_plate: string | null;
  status: string;
  is_available: boolean;
  total_deliveries: number;
  rating: number;
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function DeliveryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [agent, setAgent] = useState<DeliveryAgent | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // ============================================================
  // FUNÇÃO: ATUALIZAR LOCALIZAÇÃO DO ENTREGADOR
  // (Declarada ANTES do useEffect que a usa)
  // ============================================================
  const updateAgentLocation = useCallback(
    async (agentId: string, location: { lat: number; lng: number }) => {
      await supabase
        .from('delivery_agents')
        .update({
          current_lat: location.lat,
          current_lng: location.lng,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);
    },
    []
  );

  // ============================================================
  // BUSCAR PEDIDOS DO ENTREGADOR LOGADO
  // ============================================================
  const fetchMyOrders = useCallback(async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_agent_id', agentId)
        .in('status', ['in_transit', 'ready', 'confirmed', 'delivering'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      setOrders(data || []);

      const active = (data || []).find(
        (o) => o.status === 'in_transit' || o.status === 'delivering'
      );
      if (active) {
        setActiveOrder(active);
        setSelectedOrderId(active.id);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    }
  }, []);

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================
  useEffect(() => {
    let cancelled = false;

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

        if (!cancelled) {
          setAgent(agentData);
          await fetchMyOrders(agentData.id);
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              if (!cancelled) {
                setCurrentLocation(loc);
                updateAgentLocation(agentData.id, loc);
              }
            },
            () => {
              if (!cancelled) setCurrentLocation({ lat: -8.839, lng: 13.289 });
            }
          );
        }

        if (!cancelled) setLoading(false);
      } catch (error) {
        console.error('Erro:', error);
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [router, fetchMyOrders, updateAgentLocation]);

  // ============================================================
  // REALTIME: NOTIFICAÇÃO DE NOVOS PEDIDOS
  // ============================================================
  useEffect(() => {
    if (!agent) return;

    const channel = supabase
      .channel('novos-pedidos-entregador')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `delivery_agent_id=eq.${agent.id}`,
        },
        (payload) => {
          console.log('🔔 Pedido atualizado:', payload);

          const updated = payload.new as DeliveryOrder;

          if (updated.status === 'in_transit' || updated.status === 'delivering') {
            setNotification(
              `🚚 Novo pedido atribuído: #${updated.id.slice(0, 8).toUpperCase()}`
            );
            setTimeout(() => setNotification(null), 8000);
          }

          fetchMyOrders(agent.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent, fetchMyOrders]);

  // ============================================================
  // ROTA (setState dentro de função async para evitar erro)
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const buildRoute = async () => {
      if (
        activeOrder &&
        currentLocation &&
        activeOrder.delivery_lat &&
        activeOrder.delivery_lng
      ) {
        const start = [currentLocation.lat, currentLocation.lng] as [number, number];
        const end = [activeOrder.delivery_lat, activeOrder.delivery_lng] as [number, number];
        const steps = 20;
        const points: [number, number][] = [];
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          points.push([
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
          ]);
        }
        if (!cancelled) setRoute(points);
      }
    };

    buildRoute();

    return () => {
      cancelled = true;
    };
  }, [activeOrder, currentLocation]);

  // ============================================================
  // CONCLUIR ENTREGA
  // ============================================================
  const completeDelivery = async () => {
    if (!activeOrder || !agent) return;

    try {
      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeOrder.id);

      await supabase
        .from('delivery_agents')
        .update({
          active_order_id: null,
          is_available: true,
          total_deliveries: (agent.total_deliveries || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agent.id);

      alert('✅ Entrega concluída com sucesso!');
      setActiveOrder(null);
      setSelectedOrderId(null);
      setOrders((prev) => prev.filter((o) => o.id !== activeOrder.id));
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              is_available: true,
              total_deliveries: (prev.total_deliveries || 0) + 1,
            }
          : null
      );
    } catch (error) {
      console.error('Erro ao concluir entrega:', error);
      alert('❌ Erro ao concluir entrega. Tente novamente.');
    }
  };

  // ============================================================
  // FORMATADORES
  // ============================================================
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);

  // ============================================================
  // LOADING
  // ============================================================
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* NOTIFICAÇÃO FLUTUANTE */}
      {notification && (
        <div className="fixed top-20 right-4 z-[100] bg-[#2d6a4f] text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <Bell className="w-6 h-6 animate-bounce" />
          <div>
            <p className="font-bold text-sm">Novo Pedido!</p>
            <p className="text-xs text-white/90">{notification}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#2d6a4f] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
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
                onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Package} label="Meus Pedidos" value={orders.length} color="bg-blue-50 text-blue-600" iconColor="text-blue-500" />
          <StatCard icon={Clock} label="Em Andamento" value={activeOrder ? '1' : '0'} color="bg-orange-50 text-orange-600" iconColor="text-orange-500" />
          <StatCard icon={Star} label="Avaliação" value={(agent?.rating || 0).toFixed(1)} color="bg-yellow-50 text-yellow-600" iconColor="text-yellow-500" />
          <StatCard
            icon={Truck}
            label="Status"
            value={activeOrder ? 'Em Rota' : 'Disponível'}
            color={activeOrder ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}
            iconColor={activeOrder ? 'text-green-500' : 'text-gray-400'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pedidos */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="font-bold text-[#2d6a4f] flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5" />
                Meus Pedidos
                {orders.length > 0 && (
                  <span className="ml-auto bg-[#f4a261] text-white text-xs px-2 py-1 rounded-full">
                    {orders.length}
                  </span>
                )}
              </h2>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4 animate-bounce">🚚</div>
                  <p className="text-gray-500 font-medium">Nenhum pedido atribuído</p>
                  <p className="text-sm text-gray-400 mt-1">Aguarde novos pedidos</p>
                  <div className="mt-4 p-3 bg-[#f5f0eb] rounded-xl">
                    <p className="text-xs text-gray-400">🔄 Escutando em tempo real...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedOrderId === order.id
                          ? 'border-[#2d6a4f] bg-[#f0f7f0] shadow-md'
                          : 'border-gray-100 hover:border-[#a7c957]'
                      }`}
                      onClick={() => {
                        setActiveOrder(order);
                        setSelectedOrderId(order.id);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            #{order.id?.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{order.customer_name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[180px]">{order.delivery_address}</span>
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-bold text-[#2d6a4f]">{formatCurrency(order.total_amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meu Status */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#2d6a4f]" />
                Meu Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1"><User className="w-4 h-4" /> Nome</span>
                  <span className="font-medium">{agent?.full_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1"><Truck className="w-4 h-4" /> Veículo</span>
                  <span className="font-medium">{agent?.vehicle || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-[#f8f6f4] rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1"><Award className="w-4 h-4" /> Entregas</span>
                  <span className="font-medium">{agent?.total_deliveries || 0}</span>
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
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[currentLocation.lat, currentLocation.lng]}>
                    <Popup>Sua localização</Popup>
                  </Marker>
                  {activeOrder && activeOrder.delivery_lat && activeOrder.delivery_lng && (
                    <Marker position={[activeOrder.delivery_lat, activeOrder.delivery_lng]}>
                      <Popup>{activeOrder.customer_name}</Popup>
                    </Marker>
                  )}
                  {route.length > 0 && (
                    <Polyline positions={route} color="#2d6a4f" weight={4} opacity={0.7} dashArray="10, 10" />
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

              {activeOrder && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-[#2d6a4f]">{activeOrder.customer_name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {activeOrder.delivery_address}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {activeOrder.customer_phone}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-[#2d6a4f] text-lg">{formatCurrency(activeOrder.total_amount)}</p>
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

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={!activeOrder}
                onClick={() => {
                  if (activeOrder && currentLocation && activeOrder.delivery_lat && activeOrder.delivery_lng) {
                    const url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${activeOrder.delivery_lat},${activeOrder.delivery_lng}`;
                    window.open(url, '_blank');
                  }
                }}
              >
                <Navigation className="w-4 h-4" />
                Iniciar Navegação
              </button>
              <button
                className="flex-1 py-3 bg-[#a7c957] text-white rounded-xl hover:bg-[#8fb84a] transition font-medium flex items-center justify-center gap-2"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                      const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      };
                      setCurrentLocation(loc);
                      if (agent) updateAgentLocation(agent.id, loc);
                      alert('✅ Localização atualizada!');
                    });
                  }
                }}
              >
                <Compass className="w-4 h-4" />
                Atualizar Localização
              </button>
            </div>

            <div className="mt-3 p-3 bg-[#f0f7f0] rounded-xl border border-[#a7c957]/30">
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2d6a4f]" />
                <span>💡 Mantenha o GPS ligado para atualizações em tempo real.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 transition-all hover:shadow-xl">
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