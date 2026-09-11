// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  User,
  Package,
  Clock,
  MapPin,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  Gift,
  Star,
  Phone,
  Mail,
  Edit3,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Menu,
  X,
  Home,
  History,
  UserCircle,
  Bell,
  Shield,
  Award,
  TrendingUp,
  Wallet,
  ClipboardList,
  MessageCircle,
  HelpCircle,
  Leaf
} from 'lucide-react';

// Tipos
type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address: string;
  delivery_fee: number;
  items: OrderItem[];
  estimated_delivery: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
};

type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  avatar_url?: string;
  created_at: string;
  favorite_categories?: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'favorites'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Dados mockados para demonstração
  const mockOrders: Order[] = [
    {
      id: 'ORD-2026-001',
      created_at: '2026-07-30T14:30:00',
      total_amount: 3850,
      status: 'delivered',
      delivery_address: 'Rua das Flores, 123, Luanda',
      delivery_fee: 350,
      items: [
        { id: '1', product_name: 'Peito de Frango Fresco', quantity: 2, price: 2500 },
        { id: '2', product_name: 'Alface Americana', quantity: 3, price: 300 },
        { id: '3', product_name: 'Pão Integral Artesanal', quantity: 1, price: 650 },
      ],
      estimated_delivery: '2026-07-30T15:30:00',
    },
    {
      id: 'ORD-2026-002',
      created_at: '2026-07-29T09:15:00',
      total_amount: 2150,
      status: 'out_for_delivery',
      delivery_address: 'Av. 4 de Fevereiro, 45, Luanda',
      delivery_fee: 250,
      items: [
        { id: '4', product_name: 'Abacate Orgânico', quantity: 3, price: 450 },
        { id: '5', product_name: 'Chá Verde Orgânico', quantity: 1, price: 1800 },
      ],
      estimated_delivery: '2026-07-30T16:00:00',
    },
    {
      id: 'ORD-2026-003',
      created_at: '2026-07-28T19:45:00',
      total_amount: 5600,
      status: 'preparing',
      delivery_address: 'Rua do Mercado, 88, Luanda',
      delivery_fee: 400,
      items: [
        { id: '6', product_name: 'Alcatra (Carne Bovina)', quantity: 1, price: 5600 },
        { id: '7', product_name: 'Cenoura Orgânica', quantity: 2, price: 280 },
        { id: '8', product_name: 'Ovos Caipiras', quantity: 1, price: 1200 },
      ],
      estimated_delivery: '2026-07-30T17:30:00',
    },
    {
      id: 'ORD-2026-004',
      created_at: '2026-07-27T11:30:00',
      total_amount: 4800,
      status: 'confirmed',
      delivery_address: 'Bairro Popular, Casa 12, Luanda',
      delivery_fee: 300,
      items: [
        { id: '9', product_name: 'Queijo Minas Frescal', quantity: 2, price: 1800 },
        { id: '10', product_name: 'Suco Natural de Laranja', quantity: 3, price: 380 },
        { id: '11', product_name: 'Pão Francês', quantity: 1, price: 600 },
      ],
      estimated_delivery: '2026-07-30T18:00:00',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar usuário logado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/login');
          return;
        }

        setUser(user);

        // Buscar perfil do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        } else {
          // Criar perfil se não existir
          const newProfile = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            phone: user.user_metadata?.phone || '',
            address: user.user_metadata?.address || '',
            created_at: new Date().toISOString(),
            favorite_categories: ['frutas', 'verduras', 'carnes'],
          };
          setProfile(newProfile);
          
          // Tentar salvar no Supabase
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);
          
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
          }
        }

        // Buscar pedidos (usando mock por enquanto)
        setOrders(mockOrders);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getStatusConfig = (status: Order['status']) => {
    const configs = {
      pending: { label: 'Pendente', color: 'bg-yellow-500', icon: AlertCircle, textColor: 'text-yellow-600' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle, textColor: 'text-blue-600' },
      preparing: { label: 'Preparando', color: 'bg-indigo-500', icon: Clock, textColor: 'text-indigo-600' },
      out_for_delivery: { label: 'Saiu para Entrega', color: 'bg-orange-500', icon: Truck, textColor: 'text-orange-600' },
      delivered: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle, textColor: 'text-green-600' },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle, textColor: 'text-red-600' },
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* Header do Dashboard */}
      <header className="bg-[#2d6a4f] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">30 Express</span>
                <span className="block text-[10px] text-[#a7c957] font-medium">
                  Olá, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'} 👋
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {/* Notificações */}
              <button className="relative p-2 hover:bg-white/10 rounded-full transition">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Botão Voltar para Loja */}
              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition text-sm border border-white/20"
              >
                <Home className="w-4 h-4" />
                Loja
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
              </button>

              {/* Menu Mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-full transition"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#2d6a4f] to-[#a7c957] rounded-full mx-auto flex items-center justify-center text-3xl text-white mb-3">
                  {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <h3 className="font-semibold text-gray-800">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 bg-[#f5f0eb] px-3 py-1 rounded-full text-xs">
                  <Award className="w-3 h-3 text-[#f4a261]" />
                  <span className="text-gray-600">Cliente Premium</span>
                </div>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'overview', icon: Home, label: 'Visão Geral' },
                  { id: 'orders', icon: Package, label: 'Meus Pedidos' },
                  { id: 'profile', icon: User, label: 'Meu Perfil' },
                  { id: 'favorites', icon: Heart, label: 'Favoritos' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      activeTab === item.id
                        ? 'bg-[#2d6a4f] text-white shadow-md'
                        : 'text-gray-600 hover:bg-[#f5f0eb]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-[#f5f0eb] rounded-xl transition"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Continuar Comprando</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 min-w-0">
            {activeTab === 'overview' && (
              <OverviewTab 
                user={user}
                profile={profile}
                orders={orders}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusConfig={getStatusConfig}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersTab 
                orders={orders}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusConfig={getStatusConfig}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab 
                profile={profile}
                user={user}
                setProfile={setProfile}
                showProfileEdit={showProfileEdit}
                setShowProfileEdit={setShowProfileEdit}
                formatDate={formatDate}
              />
            )}
            {activeTab === 'favorites' && (
              <FavoritesTab />
            )}
          </main>
        </div>
      </div>

      {/* Menu Mobile - Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6 animate-slide-right">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-[#2d6a4f]">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2d6a4f] to-[#a7c957] rounded-full mx-auto flex items-center justify-center text-2xl text-white mb-2">
                {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <h3 className="font-semibold text-gray-800">
                {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
              </h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'overview', icon: Home, label: 'Visão Geral' },
                { id: 'orders', icon: Package, label: 'Meus Pedidos' },
                { id: 'profile', icon: User, label: 'Meu Perfil' },
                { id: 'favorites', icon: Heart, label: 'Favoritos' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    activeTab === item.id
                      ? 'bg-[#2d6a4f] text-white'
                      : 'text-gray-600 hover:bg-[#f5f0eb]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ TAB: VISÃO GERAL ============
function OverviewTab({ user, profile, orders, formatDate, formatCurrency, getStatusConfig }: any) {
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o: Order) => o.status === 'delivered').length;
  const pendingOrders = orders.filter((o: Order) => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const totalSpent = orders.reduce((sum: number, o: Order) => sum + o.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Boas-vindas */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Bem-vindo de volta, {profile?.full_name?.split(' ')[0] || 'Cliente'}! 
          <span className="text-2xl">🌿</span>
        </h2>
        <p className="text-gray-500 mt-1">
          Aqui você acompanha seus pedidos, gerencia seu perfil e muito mais.
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total de Pedidos"
          value={totalOrders}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Entregues"
          value={deliveredOrders}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Clock}
          label="Em Andamento"
          value={pendingOrders}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          icon={Wallet}
          label="Total Gasto"
          value={formatCurrency(totalSpent)}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Últimos Pedidos */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#2d6a4f]" />
            Últimos Pedidos
          </h3>
          <button
            onClick={() => {
              const ordersTab = document.querySelector('[data-tab="orders"]');
              if (ordersTab) (ordersTab as HTMLElement).click();
            }}
            className="text-sm text-[#2d6a4f] hover:text-[#a7c957] transition flex items-center gap-1"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Você ainda não fez nenhum pedido</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition"
            >
              Fazer Primeiro Pedido
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order: Order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-[#f8f6f4] rounded-xl hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${status.color} bg-opacity-20`}>
                      <StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)} • {order.items.length} itens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#2d6a4f]">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color} text-white`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dicas Rápidas e Promoções */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] rounded-2xl p-6 text-white">
          <div className="flex items-start gap-3">
            <Gift className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Programa de Fidelidade</h4>
              <p className="text-sm text-white/80 mt-1">
                Acumule pontos a cada compra e ganhe descontos exclusivos!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <Leaf className="w-6 h-6 text-[#2d6a4f] flex-shrink-0" />
            <div>
              <h4 className="font-bold text-gray-800">Produtos Naturais</h4>
              <p className="text-sm text-gray-500 mt-1">
                Todos os nossos produtos são selecionados com cuidado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Estatística
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
      <div className={`inline-flex p-3 rounded-full ${color} mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

// ============ TAB: PEDIDOS ============
function OrdersTab({ orders, formatDate, formatCurrency, getStatusConfig }: any) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter((order: Order) => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && order.status !== 'delivered' && order.status !== 'cancelled') ||
      order.status === filter;
    
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item: OrderItem) => 
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <Package className="w-6 h-6" />
            Meus Pedidos
            <span className="text-sm font-normal text-gray-400">
              ({filteredOrders.length} pedidos)
            </span>
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'delivered', 'cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === f
                    ? 'bg-[#2d6a4f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Em Andamento' : f === 'delivered' ? 'Entregues' : 'Cancelados'}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por pedido ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Nenhum pedido encontrado</p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Tente buscar com outros termos
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: Order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              return (
                <div
                  key={order.id}
                  className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${status.color} bg-opacity-20`}>
                        <StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800">{order.id}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} text-white`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                        <div className="mt-2 space-y-1">
                          {order.items.map((item: OrderItem) => (
                            <p key={item.id} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-4 h-4 bg-[#f5f0eb] rounded-full flex items-center justify-center text-xs">
                                {item.quantity}x
                              </span>
                              {item.product_name}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-xl font-bold text-[#2d6a4f]">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Taxa: {formatCurrency(order.delivery_fee)}
                      </p>
                      <button className="mt-2 text-sm text-[#2d6a4f] hover:text-[#a7c957] transition font-medium">
                        Ver Detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ TAB: PERFIL ============
function ProfileTab({ profile, user, setProfile, showProfileEdit, setShowProfileEdit, formatDate }: any) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    neighborhood: profile?.neighborhood || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedProfile = { ...profile, ...formData };
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          neighborhood: formData.neighborhood,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
        return;
      }

      setProfile(updatedProfile);
      setShowProfileEdit(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar perfil.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <User className="w-6 h-6" />
            Meu Perfil
          </h2>
          <button
            onClick={() => setShowProfileEdit(!showProfileEdit)}
            className="flex items-center gap-2 px-4 py-2 bg-[#f5f0eb] text-[#2d6a4f] rounded-full hover:bg-[#2d6a4f] hover:text-white transition"
          >
            <Edit3 className="w-4 h-4" />
            {showProfileEdit ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {showProfileEdit ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                placeholder="+244 936 953 381"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                placeholder="Rua, Número, Bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                placeholder="Bairro"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium"
            >
              Salvar Alterações
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <ProfileItem icon={User} label="Nome" value={profile?.full_name || 'Não informado'} />
            <ProfileItem icon={Mail} label="Email" value={user?.email} />
            <ProfileItem icon={Phone} label="Telefone" value={profile?.phone || 'Não informado'} />
            
            {profile?.neighborhood && (
              <ProfileItem icon={MapPin} label="Bairro" value={profile.neighborhood} />
            )}
            <ProfileItem 
              icon={Calendar} 
              label="Cliente desde" 
              value={formatDate(profile?.created_at || Date.now())} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de Item do Perfil
function ProfileItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#f8f6f4] rounded-xl">
      <Icon className="w-5 h-5 text-[#2d6a4f]" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

// ============ TAB: FAVORITOS ============
function FavoritesTab() {
  const [favorites, setFavorites] = useState([
    {
      id: '1',
      name: 'Abacate Orgânico',
      price: 450,
      image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
      category: 'frutas',
      is_organic: true,
    },
    {
      id: '3',
      name: 'Alcatra (Carne Bovina)',
      price: 5600,
      image_url: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400',
      category: 'carnes',
      is_organic: true,
    },
    {
      id: '8',
      name: 'Chá Verde Orgânico',
      price: 1800,
      image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400',
      category: 'chas',
      is_organic: true,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <Heart className="w-6 h-6 fill-[#f4a261] text-[#f4a261]" />
            Meus Favoritos
            <span className="text-sm font-normal text-gray-400">
              ({favorites.length} produtos)
            </span>
          </h2>
          <Link
            href="/"
            className="text-sm text-[#2d6a4f] hover:text-[#a7c957] transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❤️</div>
            <p className="text-gray-500">Você ainda não tem produtos favoritos</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition"
            >
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((product) => (
              <div
                key={product.id}
                className="bg-[#f8f6f4] rounded-xl p-4 hover:shadow-md transition group"
              >
                <div className="relative h-40 bg-[#e8f0e8] rounded-lg overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {product.is_organic && (
                    <span className="absolute top-2 left-2 bg-[#2d6a4f] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Leaf className="w-3 h-3" />
                      Orgânico
                    </span>
                  )}
                  <button className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition shadow-md">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-[#a7c957] font-medium capitalize">{product.category}</p>
                  <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-[#2d6a4f]">
                      {new Intl.NumberFormat('pt-AO', {
                        style: 'currency',
                        currency: 'AOA',
                        minimumFractionDigits: 0,
                      }).format(product.price)}
                    </span>
                    <button className="px-4 py-1.5 bg-[#a7c957] text-white rounded-full text-sm hover:bg-[#8fb84a] transition">
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}