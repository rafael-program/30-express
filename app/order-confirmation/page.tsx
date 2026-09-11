// app/order-confirmation/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  MapPin,
  ChefHat,
} from 'lucide-react';

// ============================================================
// TIPOS (adaptados ao schema real do Supabase)
// ============================================================
type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

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
  items: OrderItem[];
};

// ============================================================
// CONFIGURAÇÃO DOS STATUS
// ============================================================
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof Clock; step: number }
> = {
  pending: {
    label: 'Pedido Recebido',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
    step: 1,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-700',
    icon: CheckCircle,
    step: 2,
  },
  preparing: {
    label: 'Em Preparação',
    color: 'bg-orange-100 text-orange-700',
    icon: ChefHat,
    step: 3,
  },
  ready: {
    label: 'Pronto para Entrega',
    color: 'bg-purple-100 text-purple-700',
    icon: Package,
    step: 4,
  },
  in_transit: {
    label: 'Em Trânsito',
    color: 'bg-indigo-100 text-indigo-700',
    icon: Truck,
    step: 5,
  },
  delivered: {
    label: 'Entregue',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    step: 6,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-700',
    icon: Clock,
    step: 0,
  },
};

// ============================================================
// COMPONENTE INTERNO
// ============================================================
function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // BUSCAR PEDIDO + ITENS + IMAGENS
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

      try {
        setLoading(true);

        // 1. Buscar pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;
        if (!orderData) throw new Error('Pedido não encontrado');

        // 2. Buscar itens
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        // 3. Buscar imagens dos produtos (JOIN manual)
        let itemsWithImages: OrderItem[] = [];

        if (itemsData && itemsData.length > 0) {
          const productIds = itemsData
            .map((item) => item.product_id)
            .filter(Boolean);

          const { data: productsData } = await supabase
            .from('products')
            .select('id, image_url')
            .in('id', productIds);

          const productImages: Record<string, string | null> = {};
          productsData?.forEach((p) => {
            productImages[p.id] = p.image_url || null;
          });

          itemsWithImages = itemsData.map((item) => ({
            ...item,
            product_image: productImages[item.product_id] || null,
          })) as OrderItem[];
        }

        if (!cancelled) {
          setOrder({
            ...orderData,
            items: itemsWithImages,
          } as Order);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar pedido:', err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar pedido'
          );
          setLoading(false);
        }
      }
    };

    fetchOrder();

    // Realtime
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (!cancelled) {
            setOrder((prev) =>
              prev ? { ...prev, ...(payload.new as Partial<Order>) } : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

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

  // Gera número amigável do pedido a partir do UUID
  const formatOrderNumber = (id: string) => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f4]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f4] p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Pedido não encontrado
          </h1>
          <p className="text-gray-500 mb-6">
            {error || 'Não foi possível carregar os detalhes do pedido.'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium"
          >
            Voltar à Loja
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#f8f6f4] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] mb-2">
            Pedido Confirmado!
          </h1>
          <p className="text-gray-500">
            Obrigado pela sua compra. Estamos preparando tudo com carinho.
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-[#f0f4f0] rounded-xl">
            <p className="text-sm text-gray-500">Número do Pedido</p>
            <p className="text-lg font-bold text-[#2d6a4f]">
              {formatOrderNumber(order.id)}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${statusInfo.color}`}
            >
              <StatusIcon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Status Atual</p>
              <p className="font-semibold text-gray-800">{statusInfo.label}</p>
              <p className="text-sm text-gray-500">
                Atualizado em {formatDate(order.updated_at || order.created_at)}
              </p>
            </div>
          </div>

          {order.status !== 'cancelled' && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      step <= statusInfo.step
                        ? 'bg-[#2d6a4f] text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2d6a4f] transition-all duration-500"
                  style={{ width: `${(statusInfo.step / 6) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-[#2d6a4f] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço de Entrega
          </h2>
          <p className="text-gray-700">{order.delivery_address}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium">{order.customer_phone}</p>
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-[#2d6a4f] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Itens do Pedido
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                {item.product_image ? (
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-14 h-14 bg-[#f0f4f0] rounded-lg flex items-center justify-center text-2xl">
                    📦
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {item.product_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.quantity}x {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-bold text-[#2d6a4f]">
                  {formatCurrency(item.total_price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-[#2d6a4f] mb-4">
            Resumo do Pagamento
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxa de Entrega</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-[#2d6a4f] pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 pt-2">
              <span>Método de Pagamento</span>
              <span className="capitalize">
                {order.payment_method || 'Não informado'}
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium text-center"
          >
            Continuar Comprando
          </Link>
          <Link
            href="/account/orders"
            className="flex-1 py-3 bg-white border border-[#2d6a4f] text-[#2d6a4f] rounded-xl hover:bg-[#f0f4f0] transition font-medium text-center"
          >
            Meus Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f6f4]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f]"></div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}