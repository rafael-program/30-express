// app/admin/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ShoppingBag,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  User,
  MapPin,
  Phone,
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
  client_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  customer_lat: number | null;
  customer_lng: number | null;
  scheduled_time: string | null;
  delivery_time: string | null;
  delivery_agent_id: string | null;
  qr_code: string | null;
  tracking_history: unknown;
  created_at: string;
  updated_at: string;
  delivery_agent_name?: string;
};

type DeliveryAgent = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  vehicle_type: string | null;
  status: string;
};

// ============================================================
// CONFIGURAÇÃO DE STATUS
// ============================================================
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; step: number }
> = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-700',
    step: 1,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-700',
    step: 2,
  },
  preparing: {
    label: 'Em Preparação',
    color: 'bg-orange-100 text-orange-700',
    step: 3,
  },
  ready: {
    label: 'Pronto',
    color: 'bg-purple-100 text-purple-700',
    step: 4,
  },
  in_transit: {
    label: 'Em Trânsito',
    color: 'bg-indigo-100 text-indigo-700',
    step: 5,
  },
  delivered: {
    label: 'Entregue',
    color: 'bg-green-100 text-green-700',
    step: 6,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-700',
    step: 0,
  },
};

// ============================================================
// COMPONENTE
// ============================================================
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const ITEMS_PER_PAGE = 10;

  // ============================================================
  // BUSCAR ENTREGADORES (uma vez)
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchDeliveryAgents = async () => {
      try {
        const { data } = await supabase
          .from('delivery_agents')
          .select('*')
          .eq('status', 'available');

        if (!cancelled && data) {
          setDeliveryAgents(data);
        }
      } catch (error) {
        console.error('Erro ao buscar entregadores:', error);
      }
    };

    fetchDeliveryAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // BUSCAR PEDIDOS
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('orders')
          .select('*', { count: 'exact' });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        if (searchTerm) {
          query = query.or(
            `customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,delivery_address.ilike.%${searchTerm}%`
          );
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Buscar nomes dos entregadores atribuídos
        const agentIds = (data || [])
          .map((o) => o.delivery_agent_id)
          .filter(Boolean);

        // ✅ const em vez de let
        const agentsMap: Record<string, string> = {};
        if (agentIds.length > 0) {
          const { data: agentsData } = await supabase
            .from('delivery_agents')
            .select('id, name')
            .in('id', agentIds);

          agentsData?.forEach((a) => {
            agentsMap[a.id] = a.name;
          });
        }

        const enrichedOrders: Order[] = (data || []).map((o) => ({
          ...o,
          delivery_agent_name: o.delivery_agent_id
            ? agentsMap[o.delivery_agent_id]
            : undefined,
        }));

        if (!cancelled) {
          setOrders(enrichedOrders);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [currentPage, statusFilter, searchTerm, refreshKey]);

  // ============================================================
  // ATRIBUIR ENTREGADOR
  // ============================================================
  const assignDeliveryAgent = async () => {
    if (!selectedOrder || !selectedAgentId) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_agent_id: selectedAgentId,
          status: 'in_transit',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      setRefreshKey((prev) => prev + 1);
      setShowDetailModal(false);
      setSelectedAgentId('');
      alert('✅ Entregador atribuído com sucesso!');
    } catch (error) {
      console.error('Erro ao atribuir entregador:', error);
      alert('❌ Erro ao atribuir entregador');
    }
  };

  // ============================================================
  // MUDAR STATUS DO PEDIDO
  // ============================================================
  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      setRefreshKey((prev) => prev + 1);
      alert(`✅ Status atualizado para ${STATUS_CONFIG[newStatus].label}!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('❌ Erro ao atualizar status');
    }
  };

  // ============================================================
  // FORMATADORES
  // ============================================================
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

  const formatOrderNumber = (id: string) => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">
            Carregando pedidos...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            Pedidos
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie todos os pedidos da plataforma
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, telefone ou endereço..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="preparing">Em Preparação</option>
            <option value="ready">Pronto</option>
            <option value="in_transit">Em Trânsito</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entregador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {formatOrderNumber(order.id)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {order.customer_name || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                        {order.delivery_address}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#2d6a4f]">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Taxa: {formatCurrency(order.delivery_fee)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.delivery_agent_name || (
                        <span className="text-gray-400 italic">
                          Não atribuído
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-[#2d6a4f]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                Pedido {formatOrderNumber(selectedOrder.id)}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-xl">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    getStatusBadge(selectedOrder.status).color
                  }`}
                >
                  {getStatusBadge(selectedOrder.status).label}
                </span>
                <span className="text-sm text-gray-500">
                  Criado em {formatDate(selectedOrder.created_at)}
                </span>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">
                  Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.customer_name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.customer_phone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">
                  Endereço de Entrega
                </h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{selectedOrder.delivery_address}</span>
                </div>
                {selectedOrder.delivery_lat &&
                  selectedOrder.delivery_lng && (
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                      GPS: {selectedOrder.delivery_lat.toFixed(5)},{' '}
                      {selectedOrder.delivery_lng.toFixed(5)}
                    </p>
                  )}
              </div>

              {/* Valores */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">
                  Valores
                </h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxa de Entrega</span>
                    <span>
                      {formatCurrency(selectedOrder.delivery_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[#2d6a4f] pt-2 border-t">
                    <span>Total</span>
                    <span>
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-gray-500">Pagamento</span>
                    <span className="capitalize">
                      {selectedOrder.payment_method || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Atribuir Entregador */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">
                  Entregador
                </h3>
                {selectedOrder.delivery_agent_name ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                    <Truck className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">
                      {selectedOrder.delivery_agent_name}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    >
                      <option value="">Selecionar entregador...</option>
                      {deliveryAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} - {agent.vehicle_type || 'N/A'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={assignDeliveryAgent}
                      disabled={!selectedAgentId}
                      className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition disabled:opacity-50"
                    >
                      Atribuir
                    </button>
                  </div>
                )}
              </div>

              {/* Mudar Status */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">
                  Alterar Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'pending',
                      'confirmed',
                      'preparing',
                      'ready',
                      'in_transit',
                      'delivered',
                      'cancelled',
                    ] as OrderStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, status)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        selectedOrder.status === status
                          ? STATUS_CONFIG[status].color
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {STATUS_CONFIG[status].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <Link
                  href={`/order-confirmation?order_id=${selectedOrder.id}`}
                  className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium text-center flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver Confirmação
                </Link>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}