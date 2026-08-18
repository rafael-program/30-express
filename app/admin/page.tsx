// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Users,
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  Printer,
  LayoutDashboard
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    total_products: 0,
    total_customers: 0,
    total_deliveries: 0,
    pending_orders: 0,
    delivered_today: 0,
    revenue_today: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('📊 Buscando dados do dashboard...');

        // Buscar pedidos
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('❌ Erro ao buscar pedidos:', ordersError);
          return;
        }

        console.log('✅ Pedidos encontrados:', orders?.length);

        // Calcular estatísticas
        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'confirmed').length || 0;
        const deliveredOrders = orders?.filter(o => o.status === 'delivered').length || 0;

        // Buscar produtos
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Buscar clientes
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          total_products: productsCount || 0,
          total_customers: customersCount || 0,
          total_deliveries: deliveredOrders,
          pending_orders: pendingOrders,
          delivered_today: 0,
          revenue_today: 0
        });

        setRecentOrders(orders?.slice(0, 10) || []);

      } catch (error) {
        console.error('💥 Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-indigo-100 text-indigo-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      out_for_delivery: 'Em Rota',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando dados...</p>
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
            <LayoutDashboard className="w-8 h-8" />
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Visão geral do seu negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="Total Pedidos"
          value={stats.total_orders}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={DollarSign}
          label="Faturamento"
          value={formatCurrency(stats.total_revenue)}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={stats.total_customers}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Truck}
          label="Entregas"
          value={stats.total_deliveries}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallStatCard
          icon={AlertCircle}
          label="Pendentes"
          value={stats.pending_orders}
          color="bg-yellow-50 text-yellow-600"
        />
        <SmallStatCard
          icon={Package}
          label="Produtos"
          value={stats.total_products}
          color="bg-indigo-50 text-indigo-600"
        />
        <SmallStatCard
          icon={CheckCircle}
          label="Entregues"
          value={stats.total_deliveries}
          color="bg-green-50 text-green-600"
        />
        <SmallStatCard
          icon={TrendingUp}
          label="Faturamento Hoje"
          value={formatCurrency(stats.revenue_today)}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Pedidos Recentes */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2d6a4f]" />
            Últimos Pedidos
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm text-[#2d6a4f] hover:text-[#a7c957] transition flex items-center gap-1"
          >
            Ver todos
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Nenhum pedido ainda</p>
            <p className="text-sm text-gray-400 mt-1">Os pedidos aparecerão aqui quando forem feitos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.customer_name || 'Cliente'}</td>
                    <td className="px-4 py-3 font-bold text-[#2d6a4f]">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </Link>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                          <Printer className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
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

function SmallStatCard({ icon: Icon, label, value, color }: any) {
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