// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  User, Package, Clock, MapPin, ShoppingBag, LogOut,
  Truck, CheckCircle, XCircle, AlertCircle, Calendar, Wallet,
  ClipboardList, UserCircle, Award, Menu, X,
  Phone, Mail, Edit3, Search, MapPinHouse, Home,
  ArrowRight, RotateCcw, ExternalLink, Sparkles, TrendingUp,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

type Order = {
  id: string;
  client_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  status: OrderStatus;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
};

type UserProfile = {
  id: string;
  full_name?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  created_at: string;
};

type StatusConfig = {
  label: string;
  color: string;
  textColor: string;
  icon: React.ElementType;
  step: number;
};

// ============================================================
// CONFIGURAÇÃO DE STATUS
// ============================================================
const STATUS_MAP: Record<OrderStatus, StatusConfig> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', textColor: 'text-yellow-600', icon: AlertCircle, step: 1 },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', textColor: 'text-blue-600', icon: CheckCircle, step: 2 },
  preparing: { label: 'Preparando', color: 'bg-indigo-500', textColor: 'text-indigo-600', icon: Package, step: 3 },
  ready: { label: 'Pronto', color: 'bg-purple-500', textColor: 'text-purple-600', icon: CheckCircle, step: 4 },
  in_transit: { label: 'Em Rota', color: 'bg-orange-500', textColor: 'text-orange-600', icon: Truck, step: 5 },
  delivered: { label: 'Entregue', color: 'bg-green-500', textColor: 'text-green-600', icon: CheckCircle, step: 6 },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-600', icon: XCircle, step: 0 },
};

// ============================================================
// HELPERS
// ============================================================
const formatOrderNumber = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // ============================================================
  // BUSCAR DADOS
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          router.push('/login');
          return;
        }
        if (!cancelled) setUser({ id: authUser.id, email: authUser.email || '' });

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (!cancelled) setProfile(profileData);

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`*, items:order_items(*)`)
          .eq('client_id', authUser.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Erro ao buscar pedidos:', ordersError);
          if (!cancelled) setOrders([]);
        } else {
          if (!cancelled) setOrders(ordersData || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ============================================================
  // LOGOUT E ATUALIZAR PERFIL
  // ============================================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleUpdateProfile = async (formData: Partial<UserProfile>) => {
    if (!user) return;
    try {
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

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...formData } : prev));
      setShowProfileEdit(false);
      alert('✅ Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('❌ Erro ao atualizar perfil.');
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
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

  const activeOrder = orders.find((o) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'in_transit'].includes(o.status)
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">30 Express</span>
                <span className="block text-[10px] text-[#a7c957] font-medium">
                  Olá, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'} 👋
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition text-sm border border-white/20"
              >
                <Home className="w-4 h-4" />
                Voltar à Loja
              </Link>
              <Link
                href="/"
                className="md:hidden p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
              >
                <Home className="w-5 h-5" />
              </Link>
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition">
                <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-full transition"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#2d6a4f] to-[#a7c957] rounded-full mx-auto flex items-center justify-center text-3xl text-white mb-3 font-bold shadow-md">
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <h3 className="font-semibold text-gray-800">{profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}</h3>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
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
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as typeof activeTab)}
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

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 text-[#2d6a4f] bg-[#f0f7f3] hover:bg-[#e8f3ec] rounded-xl transition font-medium"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Voltar à Loja</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Banner de pedido ativo */}
            {activeOrder && (
              <div className="mb-6 bg-gradient-to-r from-[#f4a261] to-[#e76f51] rounded-2xl shadow-lg p-4 sm:p-5 text-white">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-white/90">Pedido em andamento</p>
                      <p className="text-lg font-bold">{formatOrderNumber(activeOrder.id)}</p>
                      <p className="text-sm text-white/90">
                        Status: {STATUS_MAP[activeOrder.status].label}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/order-confirmation?order_id=${activeOrder.id}`}
                    className="px-4 py-2 bg-white text-[#e76f51] rounded-xl font-semibold text-sm hover:bg-white/90 transition flex items-center gap-2"
                  >
                    Acompanhar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <OverviewTab profile={profile} orders={orders} user={user} />
            )}
            {activeTab === 'orders' && <OrdersTab orders={orders} />}
            {activeTab === 'profile' && (
              <ProfileTab
                profile={profile}
                user={user}
                showProfileEdit={showProfileEdit}
                setShowProfileEdit={setShowProfileEdit}
                handleUpdateProfile={handleUpdateProfile}
              />
            )}
          </main>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-[#2d6a4f]">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2d6a4f] to-[#a7c957] rounded-full mx-auto flex items-center justify-center text-2xl text-white mb-2 font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <h3 className="font-semibold text-gray-800">{profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}</h3>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'overview', icon: Home, label: 'Visão Geral' },
                { id: 'orders', icon: Package, label: 'Meus Pedidos' },
                { id: 'profile', icon: User, label: 'Meu Perfil' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as typeof activeTab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    activeTab === item.id ? 'bg-[#2d6a4f] text-white' : 'text-gray-600 hover:bg-[#f5f0eb]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2d6a4f] bg-[#f0f7f3] font-medium"
              >
                <ShoppingBag className="w-5 h-5" />
                Voltar à Loja
              </Link>
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

// ============================================================
// ABA: VISÃO GERAL
// ============================================================
function OverviewTab({
  profile,
  orders,
  user,
}: {
  profile: UserProfile | null;
  orders: Order[];
  user: { id: string; email: string } | null;
}) {
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const pendingOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Boas-vindas */}
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#f4a261]" />
            Bem-vindo de volta, {profile?.full_name?.split(' ')[0] || 'Cliente'}!
          </h2>
          <p className="text-gray-500 mt-1">Aqui você acompanha seus pedidos e gerencia seu perfil.</p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[#f4a261] text-white rounded-xl hover:bg-[#e76f51] transition font-medium text-sm shadow-md flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Nova Compra
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total de Pedidos" value={totalOrders} color="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle} label="Entregues" value={deliveredOrders} color="bg-green-50 text-green-600" />
        <StatCard icon={Clock} label="Em Andamento" value={pendingOrders} color="bg-orange-50 text-orange-600" />
        <StatCard icon={Wallet} label="Total Gasto" value={formatCurrency(totalSpent)} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#2d6a4f]" />
            Últimos Pedidos
          </h3>
          {orders.length > 0 && (
            <Link
              href="/dashboard?tab=orders"
              className="text-sm text-[#2d6a4f] font-medium hover:underline flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Você ainda não fez nenhum pedido</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition font-medium"
            >
              Fazer Primeiro Pedido
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              return (
                <Link
                  key={order.id}
                  href={`/order-confirmation?order_id=${order.id}`}
                  className="flex items-center justify-between p-4 bg-[#f8f6f4] rounded-xl hover:shadow-md hover:bg-[#f5f0eb] transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${status.color} bg-opacity-20`}>
                      <StatusIcon className={`w-5 h-5 ${status.textColor}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        {formatOrderNumber(order.id)}
                        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)} • {order.items?.length || 0} itens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#2d6a4f]">{formatCurrency(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color} text-white`}>
                      {status.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 hover:shadow-xl transition">
      <div className={`inline-flex p-3 rounded-full ${color} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ============================================================
// ABA: PEDIDOS
// ============================================================
function OrdersTab({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' &&
          order.status !== 'delivered' &&
          order.status !== 'cancelled') ||
        order.status === filter;

      const matchesSearch =
        formatOrderNumber(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some((item) =>
          item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <Package className="w-6 h-6" />
            Meus Pedidos
            <span className="text-sm font-normal text-gray-400">
              ({filteredOrders.length})
            </span>
          </h2>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Em Andamento' },
              { id: 'delivered', label: 'Entregues' },
              { id: 'cancelled', label: 'Cancelados' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === f.id
                    ? 'bg-[#2d6a4f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por pedido ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              const canRepeat = order.status === 'delivered';

              return (
                <div
                  key={order.id}
                  className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${status.color} bg-opacity-20`}>
                        <StatusIcon className={`w-5 h-5 ${status.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800">
                            {formatOrderNumber(order.id)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} text-white`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        <div className="mt-2 space-y-1">
                          {order.items?.map((item) => (
                            <p
                              key={item.id}
                              className="text-sm text-gray-600 flex items-center gap-2"
                            >
                              <span className="w-5 h-5 bg-[#f5f0eb] rounded-full flex items-center justify-center text-xs font-medium">
                                {item.quantity}x
                              </span>
                              {item.product_name}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[140px]">
                      <p className="text-xl font-bold text-[#2d6a4f]">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        Taxa: {formatCurrency(order.delivery_fee || 0)}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/order-confirmation?order_id=${order.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-[#2d6a4f] bg-[#f0f7f3] hover:bg-[#e8f3ec] rounded-lg transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Acompanhar
                        </Link>
                      </div>
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

// ============================================================
// ABA: PERFIL
// ============================================================
function ProfileTab({
  profile,
  user,
  showProfileEdit,
  setShowProfileEdit,
  handleUpdateProfile,
}: {
  profile: UserProfile | null;
  user: { id: string; email: string } | null;
  showProfileEdit: boolean;
  setShowProfileEdit: (v: boolean) => void;
  handleUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    neighborhood: profile?.neighborhood || '',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateProfile(formData);
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
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                placeholder="+244 936 953 381"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                placeholder="Rua, Número, Bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
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
            <ProfileItem icon={Mail} label="Email" value={user?.email || 'Não informado'} />
            <ProfileItem icon={Phone} label="Telefone" value={profile?.phone || 'Não informado'} />
            <ProfileItem icon={MapPinHouse} label="Endereço" value={profile?.address || 'Não informado'} />
            {profile?.neighborhood && (
              <ProfileItem icon={MapPin} label="Bairro" value={profile.neighborhood} />
            )}
            <ProfileItem
              icon={Calendar}
              label="Cliente desde"
              value={profile?.created_at ? formatDate(profile.created_at) : '—'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
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