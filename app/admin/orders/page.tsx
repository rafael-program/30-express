// app/admin/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  FileText,
  UserCheck,
  UserPlus,
  X
} from 'lucide-react';
import { PrintOrder } from '@/components/PrintOrder';

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_address: string;
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  status: string;
  payment_method: string;
  created_at: string;
  updated_at?: string;
  delivery_time: string;
  qr_code: string;
  items: OrderItem[];
  items_count?: number;
  delivery_agent_id?: string;
  delivery_agent?: {
    id: string;
    full_name: string;
    phone: string;
  } | null;
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type DeliveryAgent = {
  id: string;
  full_name: string;
  phone: string;
  vehicle: string;
  is_available: boolean;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchOrders();
    fetchDeliveryAgents();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `, { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const mappedOrders = data?.map((order: any) => {
        const shortId = order.id?.slice(0, 6) || '000000';
        const timestamp = new Date(order.created_at).getTime().toString().slice(-4);
        const orderNumber = order.order_number || `ORD-${timestamp}-${shortId}`;
        
        return {
          ...order,
          customer_address: order.delivery_address || order.customer_address || 'Endereço não informado',
          delivery_time: order.delivery_time || order.scheduled_time || new Date().toISOString(),
          qr_code: order.qr_code || 'QR-' + order.id?.slice(0, 8),
          order_number: orderNumber,
          delivery_agent: null
        };
      }) || [];

      setOrders(mappedOrders);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      const { data } = await supabase
        .from('delivery_agents')
        .select('id, full_name, phone, vehicle, is_available')
        .eq('status', 'active');
      
      setDeliveryAgents(data || []);
    } catch (error) {
      console.error('Erro ao buscar entregadores:', error);
    }
  };

  // 🔥 Função para atribuir entregador com os status corretos
  const assignDeliveryAgent = async () => {
    if (!assignOrderId || !selectedAgentId) {
      alert('Selecione um entregador');
      return;
    }

    setAssigning(true);
    try {
      // 🔥 USAR OS STATUS CORRETOS DA TABELA
      // A tabela tem: pending, processing, delivering, delivered, cancelled
      
      // Atualizar pedido para 'delivering' (em rota)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          delivery_agent_id: selectedAgentId,
          status: 'delivering',  // ← 'delivering' em vez de 'out_for_delivery'
          updated_at: new Date().toISOString()
        })
        .eq('id', assignOrderId);

      if (orderError) {
        console.error('❌ Erro ao atualizar pedido:', orderError);
        
        // Tentar com 'processing' como fallback
        if (orderError.message.includes('check constraint')) {
          console.log('🔄 Tentando com status "processing"...');
          const { error: retryError } = await supabase
            .from('orders')
            .update({
              delivery_agent_id: selectedAgentId,
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', assignOrderId);
          
          if (retryError) throw retryError;
        } else {
          throw orderError;
        }
      }

      // Atualizar entregador
      const { error: agentError } = await supabase
        .from('delivery_agents')
        .update({
          active_order_id: assignOrderId,
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAgentId);

      if (agentError) throw agentError;

      // Adicionar log
      const agentName = deliveryAgents.find(a => a.id === selectedAgentId)?.full_name || 'Entregador';
      await supabase.from('order_logs').insert({
        order_id: assignOrderId,
        status: 'delivering',
        description: `Entregador atribuído: ${agentName}`
      });

      alert('✅ Entregador atribuído com sucesso!');
      setShowAssignModal(false);
      setSelectedAgentId('');
      setAssignOrderId(null);
      fetchOrders();
      fetchDeliveryAgents();

    } catch (error) {
      console.error('Erro ao atribuir entregador:', error);
      alert('❌ Erro ao atribuir entregador');
    } finally {
      setAssigning(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      await supabase.from('order_logs').insert({
        order_id: orderId,
        status: newStatus,
        description: `Status atualizado para ${getStatusLabel(newStatus)}`
      });

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  // 🔥 Funções de status atualizadas para os valores da tabela
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-indigo-100 text-indigo-700',
      delivering: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Preparando',
      delivering: 'Em Rota',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: AlertCircle,
      processing: Package,
      delivering: Truck,
      delivered: CheckCircle,
      cancelled: XCircle
    };
    return icons[status] || AlertCircle;
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f]">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os pedidos</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Relatório
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, telefone ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="processing">Preparando</option>
            <option value="delivering">Em Rota</option>
            <option value="delivered">Entregues</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <button
            onClick={fetchOrders}
            className="px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">#{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{order.customer_name || 'Cliente'}</p>
                        <p className="text-sm text-gray-500">{order.customer_phone || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#2d6a4f]">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {order.delivery_agent_id ? (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          Entregador atribuído
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Não atribuído</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </Link>
                        <PrintOrder 
                          order={order} 
                          buttonText=""
                          buttonVariant="outline"
                          className="!px-1.5 !py-1 text-xs"
                        />
                        
                        {/* 🔥 Botão Atribuir Entregador */}
                        {!order.delivery_agent_id && order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setAssignOrderId(order.id);
                              setShowAssignModal(true);
                              setSelectedAgentId('');
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition text-blue-500"
                            title="Atribuir entregador"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                          disabled={order.status === 'delivered' || order.status === 'cancelled'}
                        >
                          <option value="pending">Pendente</option>
                          <option value="processing">Preparando</option>
                          <option value="delivering">Em Rota</option>
                          <option value="delivered">Entregue</option>
                          <option value="cancelled">Cancelar</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 MODAL ATRIBUIR ENTREGADOR */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#2d6a4f] flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Atribuir Entregador
              </h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAgentId('');
                  setAssignOrderId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Selecione um entregador disponível para este pedido.
            </p>

            <div className="space-y-3">
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              >
                <option value="">Selecione um entregador...</option>
                {deliveryAgents.filter(a => a.is_available).map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.full_name} - {agent.vehicle} ({agent.phone})
                  </option>
                ))}
              </select>

              {deliveryAgents.filter(a => a.is_available).length === 0 && (
                <div className="p-4 bg-yellow-50 rounded-xl text-yellow-700 text-sm">
                  ⚠️ Nenhum entregador disponível no momento.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={assignDeliveryAgent}
                disabled={!selectedAgentId || assigning}
                className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {assigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Atribuindo...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    Atribuir
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAgentId('');
                  setAssignOrderId(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Pedido */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#2d6a4f]">
                Pedido #{selectedOrder.order_number}
              </h2>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_name || 'Cliente'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{selectedOrder.customer_phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium">{selectedOrder.customer_address || selectedOrder.delivery_address || '-'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Itens</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity}x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold text-[#2d6a4f]">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxa de Entrega</span>
                  <span>{formatCurrency(selectedOrder.delivery_fee || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#2d6a4f] mt-2 border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <PrintOrder 
                  order={selectedOrder} 
                  buttonText="🖨️ Imprimir (3 Vias)"
                  buttonVariant="primary"
                  className="flex-1"
                />
                <button
                  onClick={() => {
                    alert(`QR Code: ${selectedOrder.qr_code || selectedOrder.id}`);
                  }}
                  className="flex-1 py-3 bg-[#a7c957] text-white rounded-xl hover:bg-[#8fb84a] transition font-medium flex items-center justify-center gap-2"
                >
                  QR Code
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Atualizar Status</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'processing', 'delivering', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, status);
                        setSelectedOrder({ ...selectedOrder, status });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        selectedOrder.status === status
                          ? 'bg-[#2d6a4f] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}