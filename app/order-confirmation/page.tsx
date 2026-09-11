// app/order-confirmation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  Printer,
  QrCode,
  ArrowLeft,
  ShoppingBag,
  Home,
  Download,
  Share2,
  Copy,
  Check,
  AlertCircle,
  User,
  Phone,
  MessageCircle,
  Star,
  Heart,
  Shield,
  Award
} from 'lucide-react';

type Order = {
  id: string;
  order_number: string;
  client_id: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  status: string;
  payment_method: string;
  delivery_time: string;
  scheduled_time: string;
  qr_code: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItem[];
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        router.push('/');
        return;
      }

      try {
        console.log('🔍 Buscando pedido:', orderId);

        // Buscar pedido com itens
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error('❌ Erro ao buscar pedido:', orderError);
          setError('Pedido não encontrado');
          return;
        }

        // Buscar dados do cliente (perfil)
        if (orderData.client_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', orderData.client_id)
            .single();
          
          if (profileData) {
            orderData.customer_name = profileData.full_name;
            orderData.customer_phone = profileData.phone;
          }
        }

        console.log('✅ Pedido encontrado:', orderData);
        setOrder(orderData);
      } catch (error) {
        console.error('💥 Erro:', error);
        setError('Erro ao carregar pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateLong = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: any; progress: number }> = {
      pending: { 
        label: 'Pedido Recebido', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100', 
        icon: Clock,
        progress: 20 
      },
      confirmed: { 
        label: 'Confirmado', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100', 
        icon: CheckCircle,
        progress: 40 
      },
      preparing: { 
        label: 'Preparando seu pedido', 
        color: 'text-indigo-600', 
        bgColor: 'bg-indigo-100', 
        icon: Package,
        progress: 60 
      },
      out_for_delivery: { 
        label: 'Saiu para Entrega', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100', 
        icon: Truck,
        progress: 80 
      },
      delivered: { 
        label: 'Entregue com Sucesso!', 
        color: 'text-green-600', 
        bgColor: 'bg-green-100', 
        icon: CheckCircle,
        progress: 100 
      },
      cancelled: { 
        label: 'Cancelado', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100', 
        icon: AlertCircle,
        progress: 0 
      },
    };
    return configs[status] || configs.pending;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyOrder = () => {
    if (order) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShare = () => {
    if (order && navigator.share) {
      navigator.share({
        title: `Pedido ${order.order_number} - 30 Express`,
        text: `Meu pedido #${order.order_number} no 30 Express! Total: ${formatCurrency(order.total_amount)}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      setShowShare(!showShare);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Dinheiro (na entrega)',
      card: 'Cartão (na entrega)',
      mobile_money: 'Mobile Money (na entrega)'
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f0eb] to-[#e8f0e8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando seu pedido...</p>
          <p className="text-sm text-gray-400 mt-1">Estamos preparando tudo para você</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb] p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-7xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido não encontrado</h2>
          <p className="text-gray-500 mb-6">{error || 'Não foi possível encontrar seu pedido.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition shadow-lg hover:shadow-xl"
          >
            <Home className="w-4 h-4" />
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const status = getStatusConfig(order.status);
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0eb] to-[#e8f0e8] py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Cabeçalho com Confete */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#a7c957] via-[#2d6a4f] to-[#f4a261]"></div>
          
          {/* Decoração */}
          <div className="absolute -top-10 -right-10 text-8xl opacity-10">🎉</div>
          <div className="absolute -bottom-10 -left-10 text-8xl opacity-10">🎊</div>
          
          <div className="relative">
            <div className="inline-flex p-4 bg-green-100 rounded-full mb-4 animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#2d6a4f]">Pedido Confirmado! 🎉</h1>
            <p className="text-gray-500 mt-3 text-lg max-w-lg mx-auto">
              Seu pedido foi recebido com sucesso. Em breve você receberá a confirmação por WhatsApp.
            </p>
            
            {/* Número do Pedido com Copy */}
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-[#f0f4f0] rounded-full shadow-inner">
              <Package className="w-5 h-5 text-[#2d6a4f]" />
              <span className="font-bold text-gray-700 text-lg">{order.order_number}</span>
              <button
                onClick={handleCopyOrder}
                className="p-1.5 hover:bg-gray-200 rounded-full transition"
                title="Copiar número do pedido"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>

            {/* Botões de Ação */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition shadow-md hover:shadow-lg text-sm"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition shadow-md hover:shadow-lg text-sm"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#a7c957] text-white rounded-full hover:bg-[#8fb84a] transition shadow-md hover:shadow-lg text-sm"
              >
                <Home className="w-4 h-4" />
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progresso do Pedido */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                <Truck className="w-5 h-5 text-[#2d6a4f]" />
                Status do Pedido
              </h2>
              
              {/* Barra de Progresso */}
              <div className="relative mb-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${status.bgColor.replace('100', '500')}`}
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Recebido</span>
                  <span>Confirmado</span>
                  <span>Preparando</span>
                  <span>Em Rota</span>
                  <span>Entregue</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                <div className={`p-3 rounded-full ${status.bgColor}`}>
                  <StatusIcon className={`w-6 h-6 ${status.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{status.label}</p>
                  <p className="text-sm text-gray-500">
                    Atualizado em {formatDate(order.updated_at || order.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-[#2d6a4f]" />
                Itens do Pedido
              </h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between py-3 ${
                      index < order.items.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#f0f4f0] rounded-lg flex items-center justify-center text-sm font-bold text-[#2d6a4f]">
                        {item.quantity}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.product_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.unit_price)} / unidade
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#2d6a4f]">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações de Entrega */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#2d6a4f]" />
                Endereço de Entrega
              </h2>
              <div className="p-4 bg-[#f8f6f4] rounded-xl">
                <p className="text-gray-800 font-medium">{order.delivery_address}</p>
                <p className="text-sm text-gray-500 mt-1">
                  📍 Coordenadas: {order.delivery_lat?.toFixed(4)}, {order.delivery_lng?.toFixed(4)}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm text-[#2d6a4f]">
                  <Clock className="w-4 h-4" />
                  <span>Entrega prevista: {formatDate(order.delivery_time || order.scheduled_time || order.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resumo do Pedido */}
            <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#2d6a4f]" />
                Resumo do Pedido
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-medium text-gray-700">{order.order_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Data</span>
                  <span className="font-medium text-gray-700">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagamento</span>
                  <span className="font-medium text-gray-700 capitalize">
                    {getPaymentMethodLabel(order.payment_method)}
                  </span>
                </div>
                {order.customer_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cliente</span>
                    <span className="font-medium text-gray-700">{order.customer_name}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxa de Entrega</span>
                  <span>{formatCurrency(order.delivery_fee || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#2d6a4f] pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4 text-[#2d6a4f]" />
                  QR Code do Pedido
                </p>
                <div className="inline-block p-2 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-[#2d6a4f] transition">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.qr_code || order.order_number}`}
                    alt="QR Code do Pedido"
                    className="w-36 h-36"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Escaneie para rastrear seu pedido
                </p>
              </div>

              {/* Botão de Ajuda */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={`https://wa.me/244936953381?text=Ol%C3%A1,%20gostaria%20de%20suporte%20sobre%20o%20pedido%20${order.order_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#f4a261] text-white rounded-2xl hover:bg-[#e8954a] transition font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-center"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar com Suporte no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>© 2026 30 Express - Alimentos Saudáveis & Naturais</p>
          <p className="mt-1">Em caso de dúvidas, entre em contato pelo WhatsApp: +244 936 953 381</p>
        </div>
      </div>
    </div>
  );
}