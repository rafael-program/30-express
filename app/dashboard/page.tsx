// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  User, Package, Clock, MapPin, ShoppingBag, Heart, LogOut,
  Truck, CheckCircle, XCircle, AlertCircle, Calendar, Wallet,
  ClipboardList, ChevronRight, Leaf, LayoutDashboard, Home,
  UserCircle, Bell, Award, TrendingUp, Menu, X, Phone, Mail,
  Edit3, Plus, Search, MapPinHouse
} from 'lucide-react';

type Order = {
  id: string;
  order_number: string;
  client_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_lat: number;
  customer_lng: number;
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: 'cash' | 'card' | 'mobile_money';
  delivery_time: string;
  created_at: string;
  updated_at: string;
  qr_code: string;
  items?: OrderItem[];
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Buscar perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Buscar pedidos
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Erro ao buscar pedidos:', ordersError);
          setOrders([]);
        } else {
          setOrders(ordersData || []);
        }
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

  const handleUpdateProfile = async (formData: any) => {
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

      setProfile({ ...profile, ...formData });
      setShowProfileEdit(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil.');
    }
  };

  const getStatusConfig = (status: Order['status']) => {
    const configs = {
      pending: { label: 'Pendente', color: 'bg-yellow-500', icon: AlertCircle },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
      preparing: { label: 'Preparando', color: 'bg-indigo-500', icon: Package },
      out_for_delivery: { label: 'Em Rota', color: 'bg-orange-500', icon: Truck },
      delivered: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
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
      {/* Header */}
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
              <button className="relative p-2 hover:bg-white/10 rounded-full transition">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <Link href="/" className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition text-sm border border-white/20">
                <Home className="w-4 h-4" />
                Loja
              </Link>
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition">
                <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 hover:bg-white/10 rounded-full transition">
                {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#2d6a4f] to-[#a7c957] rounded-full mx-auto flex items-center justify-center text-3xl text-white mb-3">
                  {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <h3 className="font-semibold text-gray-800">{profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}</h3>
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
                <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-[#f5f0eb] rounded-xl transition">
                  <ShoppingBag className="w-5 h-5" />
                  <span>Continuar Comprando</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Conteúdo */}
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
                showProfileEdit={showProfileEdit}
                setShowProfileEdit={setShowProfileEdit}
                formatDate={formatDate}
                handleUpdateProfile={handleUpdateProfile}
              />
            )}
          </main>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-[#2d6a4f]">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2d6a4f] to-[#a7c957] rounded-full mx-auto flex items-center justify-center text-2xl text-white mb-2">
                {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <h3 className="font-semibold text-gray-800">{profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'overview', icon: Home, label: 'Visão Geral' },
                { id: 'orders', icon: Package, label: 'Meus Pedidos' },
                { id: 'profile', icon: User, label: 'Meu Perfil' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    activeTab === item.id ? 'bg-[#2d6a4f] text-white' : 'text-gray-600 hover:bg-[#f5f0eb]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition">
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

// ============ COMPONENTES ============

function OverviewTab({ user, profile, orders, formatDate, formatCurrency, getStatusConfig }: any) {
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o: Order) => o.status === 'delivered').length;
  const pendingOrders = orders.filter((o: Order) => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const totalSpent = orders.reduce((sum: number, o: Order) => sum + o.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Bem-vindo de volta, {profile?.full_name?.split(' ')[0] || 'Cliente'}! 🌿
        </h2>
        <p className="text-gray-500 mt-1">Aqui você acompanha seus pedidos e gerencia seu perfil.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total de Pedidos" value={totalOrders} color="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle} label="Entregues" value={deliveredOrders} color="bg-green-50 text-green-600" />
        <StatCard icon={Clock} label="Em Andamento" value={pendingOrders} color="bg-orange-50 text-orange-600" />
        <StatCard icon={Wallet} label="Total Gasto" value={formatCurrency(totalSpent)} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#2d6a4f]" />
            Últimos Pedidos
          </h3>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Você ainda não fez nenhum pedido</p>
            <Link href="/" className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition">
              Fazer Primeiro Pedido
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order: Order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              return (
                <div key={order.id} className="flex items-center justify-between p-4 bg-[#f8f6f4] rounded-xl hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${status.color} bg-opacity-20`}>
                      <StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{order.order_number}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.created_at)} • {order.items?.length || 0} itens</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#2d6a4f]">{formatCurrency(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color} text-white`}>{status.label}</span>
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

function OrdersTab({ orders, formatDate, formatCurrency, getStatusConfig }: any) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter((order: Order) => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && order.status !== 'delivered' && order.status !== 'cancelled') ||
      order.status === filter;
    
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some((item: OrderItem) => 
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
            <span className="text-sm font-normal text-gray-400">({filteredOrders.length} pedidos)</span>
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'delivered', 'cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === f ? 'bg-[#2d6a4f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Em Andamento' : f === 'delivered' ? 'Entregues' : 'Cancelados'}
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
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
            {filteredOrders.map((order: Order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              return (
                <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${status.color} bg-opacity-20`}>
                        <StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800">{order.order_number}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} text-white`}>{status.label}</span>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        <div className="mt-2 space-y-1">
                          {order.items?.map((item: OrderItem) => (
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
                      <p className="text-xl font-bold text-[#2d6a4f]">{formatCurrency(order.total_amount)}</p>
                      <p className="text-sm text-gray-500">Taxa: {formatCurrency(order.delivery_fee || 0)}</p>
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

function ProfileTab({ profile, user, showProfileEdit, setShowProfileEdit, formatDate, handleUpdateProfile }: any) {
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
            <button type="submit" className="w-full py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium">
              Salvar Alterações
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <ProfileItem icon={User} label="Nome" value={profile?.full_name || 'Não informado'} />
            <ProfileItem icon={Mail} label="Email" value={user?.email} />
            <ProfileItem icon={Phone} label="Telefone" value={profile?.phone || 'Não informado'} />
            <ProfileItem icon={MapPinHouse} label="Endereço" value={profile?.address || 'Não informado'} />
            {profile?.neighborhood && <ProfileItem icon={MapPin} label="Bairro" value={profile.neighborhood} />}
            <ProfileItem icon={Calendar} label="Cliente desde" value={formatDate(profile?.created_at || Date.now())} />
          </div>
        )}
      </div>
    </div>
  );
}

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