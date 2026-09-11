// app/admin/orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import PrintOrder from '@/components/PrintOrder';
import {
  ArrowLeft,
  Package,
  Truck,
  Clock,
  MapPin,
  Phone,
  User,
  QrCode,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Edit,
  Save,
  X,
  Loader2,
  UserCheck,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

type PaymentMethod = 'cash' | 'card' | 'mobile_money';

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
  vehicle: string | null;
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  customer_lat: number | null;
  customer_lng: number | null;
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  status: OrderStatus;
  payment_method: PaymentMethod | string;
  created_at: string;
  delivery_time: string | null;
  scheduled_time: string | null;
  qr_code: string | null;
  items: OrderItem[];
  client_id?: string;
  updated_at?: string;
  delivery_agent_id?: string | null;
  delivery_agent?: DeliveryAgent | null;
};

type RawOrder = Omit<Order, 'items'> & {
  items?: OrderItem[];
};

// ============================================================
// CONFIGURAÇÃO DE STATUS
// ============================================================
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: 'Pendente',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: CheckCircle,
  },
  preparing: {
    label: 'Preparando',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    icon: Package,
  },
  in_transit: {
    label: 'Em Rota',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: Truck,
  },
  delivered: {
    label: 'Entregue',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
};

// ============================================================
// COMPONENTE
// ============================================================
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editData, setEditData] = useState({
    status: '',
    delivery_time: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
  });

  // ============================================================
  // BUSCAR PEDIDO
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      if (!orderId) {
        if (!cancelled) {
          setError('ID do pedido não encontrado');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Buscar pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;
        if (!orderData) throw new Error('Pedido não encontrado');

        // Buscar itens
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        // Buscar entregador se atribuído
        let agentData: DeliveryAgent | null = null;
        if (orderData.delivery_agent_id) {
          const { data: agent } = await supabase
            .from('delivery_agents')
            .select('id, name, phone, vehicle_type')
            .eq('id', orderData.delivery_agent_id)
            .maybeSingle();

          if (agent) {
            agentData = {
              id: agent.id,
              full_name: agent.name,
              phone: agent.phone,
              vehicle: agent.vehicle_type,
            };
          }
        }

        const mapped: RawOrder = {
          ...orderData,
          items: itemsData || [],
          delivery_agent: agentData,
        } as RawOrder;

        if (!cancelled) {
          setOrder(mapped as Order);
          setEditData({
            status: mapped.status || '',
            delivery_time: mapped.delivery_time || '',
            customer_name: mapped.customer_name || '',
            customer_phone: mapped.customer_phone || '',
            customer_address: mapped.delivery_address || '',
          });
          if (mapped.delivery_agent_id) {
            setSelectedAgentId(mapped.delivery_agent_id);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar pedido:', err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar pedido'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, refreshKey]);

  // ============================================================
  // BUSCAR ENTREGADORES
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchDeliveryAgents = async () => {
      try {
        const { data } = await supabase
          .from('delivery_agents')
          .select('id, name, phone, vehicle_type, status')
          .in('status', ['available', 'busy']);

        if (!cancelled) {
          const mapped: DeliveryAgent[] = (data || []).map((a) => ({
            id: a.id,
            full_name: a.name,
            phone: a.phone,
            vehicle: a.vehicle_type,
          }));
          setDeliveryAgents(mapped);
        }
      } catch (err) {
        console.error('Erro ao buscar entregadores:', err);
      }
    };

    fetchDeliveryAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // ATRIBUIR ENTREGADOR
  // ============================================================
  const assignDeliveryAgent = async () => {
    if (!order || !selectedAgentId) {
      alert('Selecione um entregador');
      return;
    }

    setAssigning(true);
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          delivery_agent_id: selectedAgentId,
          status: 'in_transit',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      await supabase
        .from('delivery_agents')
        .update({
          status: 'busy',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAgentId);

      setRefreshKey((prev) => prev + 1);
      alert('✅ Entregador atribuído com sucesso!');
    } catch (err) {
      console.error('Erro ao atribuir entregador:', err);
      alert('❌ Erro ao atribuir entregador');
    } finally {
      setAssigning(false);
    }
  };

  // ============================================================
  // ATUALIZAR STATUS
  // ============================================================
  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      setEditData({ ...editData, status: newStatus });
      setRefreshKey((prev) => prev + 1);
      alert('✅ Status atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('❌ Erro ao atualizar status');
    }
  };

  // ============================================================
  // SALVAR ALTERAÇÕES
  // ============================================================
  const saveChanges = async () => {
    if (!order) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: editData.customer_name,
          customer_phone: editData.customer_phone,
          delivery_address: editData.customer_address,
          delivery_time: editData.delivery_time || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      setOrder({
        ...order,
        customer_name: editData.customer_name,
        customer_phone: editData.customer_phone,
        delivery_address: editData.customer_address,
        delivery_time: editData.delivery_time || order.delivery_time,
      });

      setIsEditing(false);
      alert('✅ Alterações salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('❌ Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FORMATADORES
  // ============================================================
  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const getPaymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      mobile_money: 'Mobile Money',
    };
    return labels[method] || method;
  };

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            Carregando pedido...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERRO
  // ============================================================
  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-500">
            {error || 'Pedido não encontrado'}
          </p>
          <Link
            href="/admin/orders"
            className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition"
          >
            Voltar para Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const orderNumber =
    order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-3">
              Pedido {orderNumber}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </h1>
            <p className="text-gray-500 mt-1">Detalhes completos do pedido</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="px-4 py-2 bg-[#a7c957] text-white rounded-xl hover:bg-[#8fb84a] transition flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status e Ações */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-[#2d6a4f]" />
              Status do Pedido
            </h2>
            <div className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-xl">
              <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
                <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {statusConfig.label}
                </p>
                <p className="text-sm text-gray-500">
                  Atualizado em{' '}
                  {formatDate(order.updated_at || order.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Alterar Status</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'pending',
                  'confirmed',
                  'preparing',
                  'in_transit',
                  'delivered',
                  'cancelled',
                ].map((status) => {
                  const config = getStatusConfig(status);
                  const Icon = config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() =>
                        updateOrderStatus(status as OrderStatus)
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1 ${
                        order.status === status
                          ? `${config.bgColor} ${config.color} border-2 border-current`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Atribuir Entregador */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <UserCheck className="w-5 h-5 text-[#2d6a4f]" />
                Atribuir Entregador
              </h3>

              {order.delivery_agent_id ? (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ Entregador atribuído
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <strong>Nome:</strong>{' '}
                      {order.delivery_agent?.full_name || 'Não disponível'}
                    </p>
                    <p>
                      <strong>Telefone:</strong>{' '}
                      {order.delivery_agent?.phone || '-'}
                    </p>
                    <p>
                      <strong>Veículo:</strong>{' '}
                      {order.delivery_agent?.vehicle || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  >
                    <option value="">Selecione um entregador...</option>
                    {deliveryAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name} - {agent.vehicle || 'N/A'} (
                        {agent.phone})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={assignDeliveryAgent}
                    disabled={
                      !selectedAgentId ||
                      assigning ||
                      order.status === 'delivered' ||
                      order.status === 'cancelled'
                    }
                    className="w-full py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Atribuindo...
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4" />
                        Atribuir Entregador
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-[#2d6a4f]" />
              Itens do Pedido
            </h2>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#f0f4f0] rounded-lg flex items-center justify-center text-sm font-bold text-[#2d6a4f]">
                        {item.quantity || 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.product_name || 'Produto'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.unit_price)} / unidade
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#2d6a4f]">
                      {formatCurrency(
                        item.total_price ||
                          item.unit_price * (item.quantity || 1)
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Nenhum item encontrado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Informações do Cliente */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#2d6a4f]" />
              Cliente
            </h2>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editData.customer_name}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        customer_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editData.customer_phone}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        customer_phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={editData.customer_address}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        customer_address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entrega
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      editData.delivery_time
                        ? new Date(editData.delivery_time)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        delivery_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="w-full py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {order.customer_name || 'Cliente'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {order.customer_phone || '-'}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">
                    {order.delivery_address || '-'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4">
              Resumo
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxa de Entrega</span>
                <span>{formatCurrency(order.delivery_fee || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pagamento</span>
                <span className="capitalize">
                  {getPaymentLabel(order.payment_method)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Data</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#2d6a4f] pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal QR Code */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#2d6a4f]">
                QR Code do Pedido
              </h2>
              <button
                onClick={() => setShowQR(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${
                  order.qr_code || orderNumber
                }`}
                alt="QR Code"
                width={250}
                height={250}
                className="w-64 h-64 mx-auto"
                unoptimized
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Pedido: <strong>{orderNumber}</strong>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Escaneie para rastrear o pedido
            </p>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.download = `qr-${orderNumber}.png`;
                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${
                  order.qr_code || orderNumber
                }`;
                link.click();
              }}
              className="mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition"
            >
              Baixar QR Code
            </button>
          </div>
        </div>
      )}

      {/* Modal de Impressão */}
      {showPrintModal && (
        <PrintOrder
          order={order}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}