// app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Download,
  Calendar,
  FileText,
  ArrowUpRight,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Period = 'today' | 'week' | 'month' | 'year';

type OrderRow = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  client_id: string | null;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
};

type ReportStats = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgTicket: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
};

type TopProduct = {
  product_id: string;
  product_name: string;
  quantity: number;
  revenue: number;
};

type DailyData = {
  date: string;
  orders: number;
  revenue: number;
};

// ============================================================
// HELPERS
// ============================================================
const getDateRange = (period: Period): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return { start, end };
};

const getPeriodLabel = (p: Period) => {
  const labels: Record<Period, string> = {
    today: 'Hoje',
    week: 'Últimos 7 dias',
    month: 'Últimos 30 dias',
    year: 'Último ano',
  };
  return labels[p];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'short',
  });

// ============================================================
// COMPONENTE
// ============================================================
export default function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgTicket: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
  });

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  // ============================================================
  // BUSCAR DADOS DO RELATÓRIO
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchReportData = async () => {
      setLoading(true);
      try {
        const { start, end } = getDateRange(period);

        // 1. Buscar pedidos do período
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: true });

        if (ordersError) throw ordersError;

        const orders: OrderRow[] = ordersData || [];

        // 2. Calcular estatísticas
        const totalRevenue = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        const deliveredOrders = orders.filter(
          (o) => o.status === 'delivered'
        ).length;
        const cancelledOrders = orders.filter(
          (o) => o.status === 'cancelled'
        ).length;
        const pendingOrders = orders.filter(
          (o) =>
            o.status !== 'delivered' && o.status !== 'cancelled'
        ).length;

        const uniqueCustomers = new Set(
          orders.map((o) => o.client_id).filter(Boolean)
        ).size;

        const avgTicket =
          orders.length > 0 ? totalRevenue / orders.length : 0;

        if (!cancelled) {
          setStats({
            totalRevenue,
            totalOrders: orders.length,
            totalCustomers: uniqueCustomers,
            avgTicket,
            deliveredOrders,
            cancelledOrders,
            pendingOrders,
          });
        }

        // 3. Buscar itens dos pedidos para top produtos
        const orderIds = orders.map((o) => o.id);
        let items: OrderItemRow[] = [];

        if (orderIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);

          items = itemsData || [];
        }

        // 4. Calcular top produtos
        const productMap: Record<string, TopProduct> = {};
        items.forEach((item) => {
          if (!productMap[item.product_id]) {
            productMap[item.product_id] = {
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: 0,
              revenue: 0,
            };
          }
          productMap[item.product_id].quantity += item.quantity;
          productMap[item.product_id].revenue += item.total_price;
        });

        const sortedProducts = Object.values(productMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        if (!cancelled) setTopProducts(sortedProducts);

        // 5. Calcular dados diários (para gráfico)
        const dailyMap: Record<string, DailyData> = {};
        orders.forEach((order) => {
          const date = new Date(order.created_at)
            .toISOString()
            .split('T')[0];

          if (!dailyMap[date]) {
            dailyMap[date] = { date, orders: 0, revenue: 0 };
          }
          dailyMap[date].orders += 1;
          if (order.status !== 'cancelled') {
            dailyMap[date].revenue += order.total_amount || 0;
          }
        });

        const sortedDaily = Object.values(dailyMap).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        if (!cancelled) setDailyData(sortedDaily);
      } catch (error) {
        console.error('Erro ao buscar dados do relatório:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReportData();

    return () => {
      cancelled = true;
    };
  }, [period]);

  // ============================================================
  // EXPORTAR CSV
  // ============================================================
  const handleExport = () => {
    const rows = [
      ['Métrica', 'Valor'],
      ['Período', getPeriodLabel(period)],
      ['Receita Total', formatCurrency(stats.totalRevenue)],
      ['Total de Pedidos', stats.totalOrders.toString()],
      ['Clientes Únicos', stats.totalCustomers.toString()],
      ['Ticket Médio', formatCurrency(stats.avgTicket)],
      ['Pedidos Entregues', stats.deliveredOrders.toString()],
      ['Pedidos Cancelados', stats.cancelledOrders.toString()],
      ['Pedidos Pendentes', stats.pendingOrders.toString()],
      [],
      ['Top Produtos', 'Quantidade', 'Receita'],
      ...topProducts.map((p) => [
        p.product_name,
        p.quantity.toString(),
        formatCurrency(p.revenue),
      ]),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm"></div>
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl shadow-sm"></div>
        <div className="h-64 bg-white rounded-2xl shadow-sm"></div>
      </div>
    );
  }

  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            Relatórios
          </h1>
          <p className="text-gray-500 mt-2 ml-1">
            Análise de desempenho — {getPeriodLabel(period)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] font-medium text-sm appearance-none cursor-pointer"
            >
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
              <option value="year">Último ano</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2 font-medium text-sm shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Receita Total</p>
          <p className="text-2xl font-bold text-[#2d6a4f]">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Clientes Únicos</p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.totalCustomers}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(stats.avgTicket)}
          </p>
        </div>
      </div>

      {/* Status dos Pedidos */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-[#2d6a4f] mb-4">
          Status dos Pedidos
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <p className="text-3xl font-bold text-emerald-600">
              {stats.deliveredOrders}
            </p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Entregues</p>
          </div>
          <div className="text-center p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <p className="text-3xl font-bold text-amber-600">
              {stats.pendingOrders}
            </p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Em andamento</p>
          </div>
          <div className="text-center p-4 bg-red-50/50 rounded-xl border border-red-100">
            <p className="text-3xl font-bold text-red-600">
              {stats.cancelledOrders}
            </p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Cancelados</p>
          </div>
        </div>
      </div>

      {/* Gráfico de barras (CSS puro) */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#2d6a4f]">
            Receita por Dia
          </h2>
          <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-lg">
            Total do período: {formatCurrency(dailyData.reduce((sum, d) => sum + d.revenue, 0))}
          </span>
        </div>
        {dailyData.length > 0 ? (
          <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
            {dailyData.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
                style={{ minWidth: '40px' }}
              >
                <div className="text-[10px] font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatCurrency(day.revenue).replace('AOA', '').trim()}
                </div>
                <div
                  className="w-full bg-[#2d6a4f] rounded-t-md transition-all hover:bg-[#40916c] min-h-[4px] cursor-pointer"
                  style={{
                    height: `${(day.revenue / maxRevenue) * 140}px`,
                  }}
                  title={`${formatCurrency(day.revenue)} (${day.orders} pedidos)`}
                />
                <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                  {formatDate(day.date)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Sem dados no período selecionado</p>
          </div>
        )}
      </div>

      {/* Top produtos */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2d6a4f] flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produtos Mais Vendidos
          </h2>
        </div>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={product.product_id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition border border-transparent hover:border-gray-100"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {product.product_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.quantity} unidades vendidas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#2d6a4f]">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Sem dados de vendas no período</p>
          </div>
        )}
      </div>
    </div>
  );
}