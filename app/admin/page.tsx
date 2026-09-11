// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
};

type DashboardStats = {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredToday: number;
  totalProducts: number;
  lowStockProducts: number;
  activeDeliveryAgents: number;
  totalCustomers: number;
};

type DailyRevenue = {
  date: string;
  revenue: number;
  orders: number;
};

// ============================================================
// CONFIGURAÇÃO DE STATUS
// ============================================================
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  preparing: {
    label: 'Em Preparação',
    color: 'bg-orange-100 text-orange-700',
  },
  ready: { label: 'Pronto', color: 'bg-purple-100 text-purple-700' },
  in_transit: {
    label: 'Em Trânsito',
    color: 'bg-indigo-100 text-indigo-700',
  },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

// ============================================================
// COMPONENTE
// ============================================================
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredToday: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    activeDeliveryAgents: 0,
    totalCustomers: 0,
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);

  // ============================================================
  // BUSCAR DADOS DO DASHBOARD
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Intervalo: hoje (00:00 até agora)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Últimos 7 dias
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // 1. Pedidos de hoje
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', todayStart.toISOString());

        const ordersToday: Order[] = todayOrders || [];

        // 2. Pedidos dos últimos 7 dias (para gráfico)
        const { data: weekOrders } = await supabase
          .from('orders')
          .select('created_at, total_amount, status')
          .gte('created_at', weekAgo.toISOString())
          .order('created_at', { ascending: true });

        // 3. Produtos
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        const { count: lowStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('stock', 10)
          .gt('stock', 0);

        // 4. Entregadores disponíveis
        const { count: agentsCount } = await supabase
          .from('delivery_agents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'available');

        // 5. Clientes únicos
        const { data: customerIds } = await supabase
          .from('orders')
          .select('customer_id')
          .not('customer_id', 'is', null);

        const uniqueCustomers = new Set(
          (customerIds || [])
            .map((o) => o.customer_id)
            .filter((id): id is string => Boolean(id))
        ).size;

        // 6. Calcular stats
        const todayRevenue = ordersToday
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        const pendingOrders = ordersToday.filter(
          (o) => o.status === 'pending' || o.status === 'confirmed'
        ).length;

        const inTransitOrders = ordersToday.filter(
          (o) => o.status === 'in_transit' || o.status === 'ready'
        ).length;

        const deliveredToday = ordersToday.filter(
          (o) => o.status === 'delivered'
        ).length;

        // 7. Receita diária (últimos 7 dias)
        const dailyMap: Record<string, DailyRevenue> = {};
        (weekOrders || []).forEach((order) => {
          const date = new Date(order.created_at)
            .toISOString()
            .split('T')[0];

          if (!dailyMap[date]) {
            dailyMap[date] = { date, revenue: 0, orders: 0 };
          }
          dailyMap[date].orders += 1;
          if (order.status !== 'cancelled') {
            dailyMap[date].revenue += order.total_amount || 0;
          }
        });

        const sortedDaily = Object.values(dailyMap).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        // 8. Pedidos recentes (últimos 5)
        const { data: recent } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!cancelled) {
          setStats({
            todayRevenue,
            todayOrders: ordersToday.length,
            pendingOrders,
            inTransitOrders,
            deliveredToday,
            totalProducts: productsCount || 0,
            lowStockProducts: lowStockCount || 0,
            activeDeliveryAgents: agentsCount || 0,
            totalCustomers: uniqueCustomers,
          });

          setRecentOrders((recent || []) as Order[]);
          setDailyRevenue(sortedDaily);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // FORMATADORES
  // ============================================================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOrderNumber = (id: string) => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const getTodayLabel = () => {
    return new Date().toLocaleDateString('pt-AO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8" />
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 capitalize">{getTodayLabel()}</p>
        </div>
        <Link
          href="/admin/orders"
          className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Ver Pedidos
        </Link>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita de hoje */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Hoje
            </span>
          </div>
          <p className="text-sm text-gray-500">Receita de Hoje</p>
          <p className="text-2xl font-bold text-[#2d6a4f] mt-1">
            {formatCurrency(stats.todayRevenue)}
          </p>
        </div>

        {/* Pedidos de hoje */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Hoje
            </span>
          </div>
          <p className="text-sm text-gray-500">Pedidos de Hoje</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.todayOrders}
          </p>
        </div>

        {/* Clientes */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Clientes</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.totalCustomers}
          </p>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            {stats.lowStockProducts > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {stats.lowStockProducts} com stock baixo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Produtos</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.totalProducts}
          </p>
        </div>
      </div>

      {/* Status dos pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl shadow-lg p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-7 h-7 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.pendingOrders}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
            <Truck className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Em Trânsito</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.inTransitOrders}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Entregues Hoje</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.deliveredToday}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Receita (últimos 7 dias) */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2d6a4f] flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Receita (Últimos 7 dias)
          </h2>
          <span className="text-xs text-gray-500">
            Total:{' '}
            {formatCurrency(
              dailyRevenue.reduce((sum, d) => sum + d.revenue, 0)
            )}
          </span>
        </div>

        {dailyRevenue.length > 0 ? (
          <div className="flex items-end gap-3 h-48">
            {dailyRevenue.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="text-xs font-medium text-gray-600">
                  {formatCurrency(day.revenue).replace('AOA', '').trim()}
                </div>
                <div
                  className="w-full bg-[#2d6a4f] rounded-t-lg transition-all hover:bg-[#1b4332] min-h-[4px]"
                  style={{
                    height: `${(day.revenue / maxRevenue) * 140}px`,
                  }}
                  title={`${day.orders} pedidos — ${formatCurrency(day.revenue)}`}
                />
                <div className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('pt-AO', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Sem dados nos últimos 7 dias</p>
          </div>
        )}
      </div>

      {/* Entregadores ativos + Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-[#2d6a4f] flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5" />
            Entregadores Disponíveis
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#f0f4f0] rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-[#2d6a4f]">
                {stats.activeDeliveryAgents}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {stats.activeDeliveryAgents === 1
                  ? 'entregador disponível agora'
                  : 'entregadores disponíveis agora'}
              </p>
              <Link
                href="/admin/delivery"
                className="text-sm text-[#2d6a4f] font-medium hover:underline flex items-center gap-1 mt-1"
              >
                Gerir entregadores
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {stats.lowStockProducts > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6 border-l-4 border-orange-400">
            <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5" />
              Atenção ao Stock
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              <strong>{stats.lowStockProducts}</strong>{' '}
              {stats.lowStockProducts === 1
                ? 'produto está com stock baixo'
                : 'produtos estão com stock baixo'}{' '}
              (menos de 10 unidades).
            </p>
            <Link
              href="/admin/products"
              className="text-sm text-[#2d6a4f] font-medium hover:underline flex items-center gap-1"
            >
              Ver produtos
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Pedidos recentes */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-[#2d6a4f] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Pedidos Recentes
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm text-[#2d6a4f] font-medium hover:underline flex items-center gap-1"
          >
            Ver todos
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8f6f4]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {formatOrderNumber(order.id)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.customer_name || 'Cliente'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#2d6a4f]">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhum pedido ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}