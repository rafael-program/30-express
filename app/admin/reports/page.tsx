// app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  Truck,
  Download,
  Calendar,
  Filter,
  ChevronDown,
  Printer,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Clock,
  Award,
  Star,
  Target,
  Zap,
  Eye,
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

type ReportData = {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_customers: number;
  total_deliveries: number;
  pending_orders: number;
  delivered_today: number;
  revenue_today: number;
  average_order_value: number;
  top_products: { name: string; sales: number; revenue: number }[];
  daily_stats: { date: string; orders: number; revenue: number }[];
  category_stats: { name: string; count: number; revenue: number }[];
  delivery_stats: { name: string; deliveries: number; rating: number }[];
};

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Buscar dados gerais
      const [
        ordersResult,
        revenueResult,
        productsResult,
        customersResult,
        deliveriesResult,
        pendingResult,
        todayOrdersResult,
        todayRevenueResult
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('orders').select('total_amount').gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
      const todayRevenue = todayRevenueResult.data?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
      const totalOrders = ordersResult.count || 0;

      // Buscar top produtos
      const { data: topProducts } = await supabase
        .from('order_items')
        .select('product_name, quantity, price')
        .order('quantity', { ascending: false })
        .limit(10);

      // Buscar estatísticas diárias (últimos 30 dias)
      const { data: dailyStats } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Agrupar por dia
      const dailyMap: Record<string, { orders: number; revenue: number }> = {};
      dailyStats?.forEach((order: any) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { orders: 0, revenue: 0 };
        }
        dailyMap[date].orders += 1;
        dailyMap[date].revenue += order.total_amount || 0;
      });

      const dailyStatsFormatted = Object.entries(dailyMap)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      // Estatísticas por categoria
      const { data: categoryStats } = await supabase
        .from('order_items')
        .select('product_name, quantity, price')
        .limit(50);

      const categoryMap: Record<string, { count: number; revenue: number }> = {};
      categoryStats?.forEach((item: any) => {
        const category = item.product_name || 'Outros';
        if (!categoryMap[category]) {
          categoryMap[category] = { count: 0, revenue: 0 };
        }
        categoryMap[category].count += item.quantity || 0;
        categoryMap[category].revenue += (item.price || 0) * (item.quantity || 0);
      });

      const categoryStatsFormatted = Object.entries(categoryMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Agrupar produtos por nome
      const productMap: Record<string, { sales: number; revenue: number }> = {};
      topProducts?.forEach((item: any) => {
        const name = item.product_name || 'Produto';
        if (!productMap[name]) {
          productMap[name] = { sales: 0, revenue: 0 };
        }
        productMap[name].sales += item.quantity || 0;
        productMap[name].revenue += (item.price || 0) * (item.quantity || 0);
      });

      const topProductsFormatted = Object.entries(productMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      setData({
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        total_products: productsResult.count || 0,
        total_customers: customersResult.count || 0,
        total_deliveries: deliveriesResult.count || 0,
        pending_orders: pendingResult.count || 0,
        delivered_today: todayOrdersResult.count || 0,
        revenue_today: todayRevenue,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        top_products: topProductsFormatted,
        daily_stats: dailyStatsFormatted,
        category_stats: categoryStatsFormatted,
        delivery_stats: []
      });

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExport = () => {
    alert('📊 Exportando relatório...');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Relatórios
          </h1>
          <p className="text-gray-500 mt-1">Análise completa do seu negócio</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={ShoppingBag}
          label="Total Pedidos"
          value={data.total_orders}
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          icon={DollarSign}
          label="Faturamento"
          value={formatCurrency(data.total_revenue)}
          color="bg-green-50 text-green-600"
        />
        <MetricCard
          icon={Users}
          label="Clientes"
          value={data.total_customers}
          color="bg-purple-50 text-purple-600"
        />
        <MetricCard
          icon={Truck}
          label="Entregas"
          value={data.total_deliveries}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallMetricCard
          icon={Clock}
          label="Pendentes"
          value={data.pending_orders}
          color="bg-yellow-50 text-yellow-600"
        />
        <SmallMetricCard
          icon={Package}
          label="Produtos"
          value={data.total_products}
          color="bg-indigo-50 text-indigo-600"
        />
        <SmallMetricCard
          icon={TrendingUp}
          label="Média por Pedido"
          value={formatCurrency(data.average_order_value)}
          color="bg-emerald-50 text-emerald-600"
        />
        <SmallMetricCard
          icon={Zap}
          label="Entregues Hoje"
          value={data.delivered_today}
          color="bg-cyan-50 text-cyan-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas Diárias */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-[#2d6a4f]" />
              Vendas Diárias
            </h3>
            <span className="text-xs text-gray-400">Últimos 30 dias</span>
          </div>
          <div className="h-64">
            {data.daily_stats.length > 0 ? (
              <div className="flex items-end h-full gap-1">
                {data.daily_stats.map((day, index) => {
                  const maxRevenue = Math.max(...data.daily_stats.map(d => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-[#2d6a4f] rounded-t hover:bg-[#1b4332] transition cursor-pointer relative group"
                        style={{ height: `${Math.max(height * 0.8, 5)}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {formatCurrency(day.revenue)}
                        </div>
                      </div>
                      <span className="text-[8px] text-gray-400 rotate-45 origin-top-left">
                        {formatDate(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#2d6a4f]" />
              Produtos Mais Vendidos
            </h3>
            <span className="text-xs text-gray-400">Top 10</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.top_products.length > 0 ? (
              data.top_products.map((product, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#f0f4f0] flex items-center justify-center text-xs font-bold text-[#2d6a4f]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.sales} vendas</p>
                  </div>
                  <span className="text-sm font-bold text-[#2d6a4f]">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                Nenhum produto vendido ainda
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorias e Estatísticas Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorias */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#2d6a4f]" />
              Vendas por Categoria
            </h3>
          </div>
          <div className="space-y-3">
            {data.category_stats.length > 0 ? (
              data.category_stats.map((category, index) => {
                const maxRevenue = Math.max(...data.category_stats.map(c => c.revenue), 1);
                const percentage = (category.revenue / maxRevenue) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{category.name}</span>
                      <span className="font-medium text-[#2d6a4f]">{formatCurrency(category.revenue)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#2d6a4f] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2d6a4f]" />
              Resumo Rápido
            </h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#f8f6f4] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#2d6a4f]">{data.total_orders}</p>
                <p className="text-xs text-gray-500">Total Pedidos</p>
              </div>
              <div className="p-4 bg-[#f8f6f4] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#2d6a4f]">{data.total_customers}</p>
                <p className="text-xs text-gray-500">Clientes</p>
              </div>
              <div className="p-4 bg-[#f8f6f4] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#2d6a4f]">{data.total_products}</p>
                <p className="text-xs text-gray-500">Produtos</p>
              </div>
              <div className="p-4 bg-[#f8f6f4] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#2d6a4f]">{data.total_deliveries}</p>
                <p className="text-xs text-gray-500">Entregas</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Ticket Médio</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.average_order_value)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Entregas Hoje</p>
                  <p className="text-2xl font-bold">{data.delivered_today}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Ações Rápidas */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#2d6a4f]" />
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-4 bg-[#f8f6f4] rounded-xl hover:bg-[#2d6a4f] hover:text-white transition group">
            <FileText className="w-6 h-6 mx-auto mb-2 text-[#2d6a4f] group-hover:text-white" />
            <p className="text-sm font-medium">Gerar Relatório</p>
          </button>
          <button className="p-4 bg-[#f8f6f4] rounded-xl hover:bg-[#2d6a4f] hover:text-white transition group">
            <Download className="w-6 h-6 mx-auto mb-2 text-[#2d6a4f] group-hover:text-white" />
            <p className="text-sm font-medium">Exportar Dados</p>
          </button>
          <button className="p-4 bg-[#f8f6f4] rounded-xl hover:bg-[#2d6a4f] hover:text-white transition group">
            <Printer className="w-6 h-6 mx-auto mb-2 text-[#2d6a4f] group-hover:text-white" />
            <p className="text-sm font-medium">Imprimir Relatório</p>
          </button>
          <button className="p-4 bg-[#f8f6f4] rounded-xl hover:bg-[#2d6a4f] hover:text-white transition group">
            <Mail className="w-6 h-6 mx-auto mb-2 text-[#2d6a4f] group-hover:text-white" />
            <p className="text-sm font-medium">Enviar por Email</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTES ============

function MetricCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SmallMetricCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xl font-bold text-gray-800">{value}</h4>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}