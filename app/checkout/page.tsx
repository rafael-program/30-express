// app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  MapPin, Navigation, Truck, Clock, CreditCard, DollarSign,
  Smartphone, Calendar, ArrowLeft, CheckCircle, Loader2,
  MapPinHouse, User, ShoppingBag, Home, ToggleLeft, ToggleRight,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
};

type AuthUser = { id: string; email: string };

type DeliveryType = 'my-address' | 'other-address';

// ============================================================
// COORDENADAS DO MERCADO DO 30 (ORIGEM FIXA)
// ============================================================
const MARKET_LOCATION = {
  lat: -8.95735,
  lng: 13.48001,
  name: 'Mercado do 30',
  address: 'Viana, Luanda, Angola',
};

// ============================================================
// GERADOR DE NÚMERO DE PEDIDO (FORA DO COMPONENTE)
// ============================================================
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

function generateQRCode(orderNumber: string): string {
  return `QR-${orderNumber.slice(0, 8)}`;
}

// ============================================================
// COMPONENTE
// ============================================================
export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryTime, setDeliveryTime] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [feePerKm, setFeePerKm] = useState(100);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOVOS ESTADOS PARA ENDEREÇO DE ENTREGA
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('my-address');
  const [otherAddress, setOtherAddress] = useState('');
  const [otherLat, setOtherLat] = useState<number | null>(null);
  const [otherLng, setOtherLng] = useState<number | null>(null);

  // ============================================================
  // CALCULAR TAXA DE ENTREGA (Haversine) — ORIGEM FIXA: MERCADO DO 30
  // ============================================================
  const calculateDeliveryFee = useCallback(
    (
      location: { lat: number; lng: number },
      currentFeePerKm: number,
      currentBaseFee: number
    ) => {
      const R = 6371;
      const dLat = ((location.lat - MARKET_LOCATION.lat) * Math.PI) / 180;
      const dLng = ((location.lng - MARKET_LOCATION.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((MARKET_LOCATION.lat * Math.PI) / 180) *
          Math.cos((location.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;

      setDistance(Math.round(distanceKm * 10) / 10);

      const fee = currentBaseFee + distanceKm * currentFeePerKm;
      setDeliveryFee(Math.round(fee));
    },
    []
  );

  // ============================================================
  // CARREGAR DADOS
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // 1. Usuário
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          router.push('/login');
          return;
        }
        if (!cancelled) setUser({ id: authUser.id, email: authUser.email || '' });

        // 2. Perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData && !cancelled) {
          setAddress(profileData.address || '');
          setPhone(profileData.phone || '');
          setCustomerName(profileData.full_name || '');
        }

        // 3. Carrinho
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          if (!cancelled) setCart(JSON.parse(savedCart));
        } else {
          router.push('/');
          return;
        }

        // 4. Configurações
        let feePerKmVal = 100;
        let baseFeeVal = 500;

        try {
          const { data: settingsData } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (settingsData) {
            feePerKmVal =
              Number(settingsData.delivery_per_km) ||
              Number(settingsData.delivery_fee_per_km) ||
              100;
            baseFeeVal = Number(settingsData.delivery_base_fee) || 500;

            if (!cancelled) {
              setFeePerKm(feePerKmVal);
            }
          }
        } catch (settingsErr) {
          console.error('Erro ao buscar configurações de taxa:', settingsErr);
        }

        // 5. Geolocalização (padrão: endereço do cliente)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              if (!cancelled) {
                setCustomerLocation(location);
                calculateDeliveryFee(location, feePerKmVal, baseFeeVal);
              }
            },
            () => {
              const defaultLocation = { lat: -8.839, lng: 13.289 };
              if (!cancelled) {
                setCustomerLocation(defaultLocation);
                calculateDeliveryFee(defaultLocation, feePerKmVal, baseFeeVal);
              }
            }
          );
        }

        if (!cancelled) setLoading(false);
      } catch (error) {
        console.error('Erro:', error);
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [router, calculateDeliveryFee]);

  // ============================================================
  // ALTERNAR ENTRE ENDEREÇO DO CLIENTE E OUTRO ENDEREÇO
  // ============================================================
  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);

    if (type === 'my-address' && customerLocation) {
      calculateDeliveryFee(customerLocation, feePerKm, 500);
    } else if (type === 'other-address' && otherLat && otherLng) {
      calculateDeliveryFee({ lat: otherLat, lng: otherLng }, feePerKm, 500);
    } else {
      setDeliveryFee(0);
      setDistance(0);
    }
  };

  // ============================================================
  // OBTER LOCALIZAÇÃO DO OUTRO ENDEREÇO (VIA GPS DO DISPOSITIVO)
  // ============================================================
  const handleGetOtherLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste dispositivo');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setOtherLat(lat);
        setOtherLng(lng);
        calculateDeliveryFee({ lat, lng }, feePerKm, 500);
        alert('✅ Localização do outro endereço capturada!');
      },
      () => {
        setError('Não foi possível obter a localização do outro endereço');
      }
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  // ============================================================
  // SUBMETER PEDIDO
  // ============================================================
  const handleSubmitOrder = async () => {
    if (!user) {
      setError('Utilizador não autenticado');
      return;
    }

    // Validar localização
    if (deliveryType === 'my-address' && !customerLocation) {
      setError('Localização não disponível');
      return;
    }

    if (deliveryType === 'other-address') {
      if (!otherAddress.trim()) {
        setError('Por favor, informe o endereço de entrega alternativo');
        return;
      }
      if (!otherLat || !otherLng) {
        setError('Por favor, capture a localização do endereço alternativo');
        return;
      }
    }

    const finalAddress = deliveryType === 'my-address' ? address : otherAddress;
    const finalLat = deliveryType === 'my-address' ? customerLocation?.lat : otherLat;
    const finalLng = deliveryType === 'my-address' ? customerLocation?.lng : otherLng;

    if (!finalAddress.trim()) {
      setError('Por favor, informe o endereço de entrega');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderNumber = generateOrderNumber();
      const qrCode = generateQRCode(orderNumber);

      const orderData = {
        client_id: user.id,
        customer_name: customerName || 'Cliente',
        customer_phone: phone || 'Não informado',
        delivery_address: finalAddress.trim(),
        delivery_lat: finalLat,
        delivery_lng: finalLng,
        customer_lat: customerLocation?.lat || finalLat,
        customer_lng: customerLocation?.lng || finalLng,
        delivery_fee: deliveryFee,
        subtotal: subtotal,
        total_amount: total,
        status: 'pending',
        payment_method: paymentMethod,
        delivery_time:
          deliveryTime === 'now'
            ? new Date().toISOString()
            : new Date(scheduledDate).toISOString(),
        scheduled_time:
          deliveryTime === 'now'
            ? new Date().toISOString()
            : new Date(scheduledDate).toISOString(),
        qr_code: qrCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: orderResult.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      localStorage.removeItem('cart');
      router.push(`/order-confirmation?order_id=${orderResult.id}`);
    } catch (err) {
      console.error('💥 Erro inesperado:', err);
      const message =
        err instanceof Error ? err.message : 'Erro ao finalizar pedido.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Preparando checkout...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#f5f0eb] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2d6a4f] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a loja
        </Link>

        <h1 className="text-3xl font-bold text-[#2d6a4f] mb-8 flex items-center gap-2">
          <ShoppingBag className="w-8 h-8" />
          Finalizar Pedido
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <p className="font-medium">❌ {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Cliente */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#2d6a4f]" />
                Dados do Cliente
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
            </div>

            {/* ✅ ENDEREÇO DE ORIGEM (FIXO) */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-[#2d6a4f]" />
                Endereço de Origem
              </h2>
              <div className="p-4 bg-[#f0f7f3] border border-[#d8f3dc] rounded-xl">
                <p className="font-semibold text-[#2d6a4f] text-sm">
                  🏪 {MARKET_LOCATION.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {MARKET_LOCATION.address}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  GPS: {MARKET_LOCATION.lat}, {MARKET_LOCATION.lng}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Todos os produtos são enviados a partir do Mercado do 30.
              </p>
            </div>

            {/* ✅ ESCOLHA DO ENDEREÇO DE ENTREGA */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <MapPinHouse className="w-5 h-5 text-[#2d6a4f]" />
                Endereço de Entrega
              </h2>

              {/* Toggle: Meu endereço vs Outro endereço */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handleDeliveryTypeChange('my-address')}
                  className={`flex-1 py-2 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                    deliveryType === 'my-address'
                      ? 'border-[#2d6a4f] bg-[#f0f7f0] text-[#2d6a4f] font-medium'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Meu Endereço
                </button>
                <button
                  onClick={() => handleDeliveryTypeChange('other-address')}
                  className={`flex-1 py-2 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                    deliveryType === 'other-address'
                      ? 'border-[#2d6a4f] bg-[#f0f7f0] text-[#2d6a4f] font-medium'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Outro Endereço
                </button>
              </div>

              {/* Endereço do Cliente */}
              {deliveryType === 'my-address' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço completo *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    placeholder="Rua, Número, Bairro"
                  />
                  {customerLocation && (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-[#2d6a4f]" />
                        Distância: {distance.toFixed(1)} km
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#2d6a4f]" />
                        Taxa: {formatCurrency(deliveryFee)} ({feePerKm} Kz/km)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Outro Endereço */}
              {deliveryType === 'other-address' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço completo *
                    </label>
                    <input
                      type="text"
                      value={otherAddress}
                      onChange={(e) => setOtherAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                      placeholder="Rua, Número, Bairro (outro endereço)"
                    />
                  </div>
                  <button
                    onClick={handleGetOtherLocation}
                    className="w-full py-2 bg-[#a7c957] text-white rounded-xl hover:bg-[#8fb84a] transition font-medium flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Capturar Localização do Outro Endereço
                  </button>
                  {otherLat && otherLng && (
                    <div className="p-3 bg-[#f0f7f3] rounded-xl">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-[#2d6a4f]" />
                        Distância: {distance.toFixed(1)} km
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#2d6a4f]" />
                        Taxa: {formatCurrency(deliveryFee)} ({feePerKm} Kz/km)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Data e Hora */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#2d6a4f]" />
                Data e Hora
              </h2>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeliveryTime('now')}
                    className={`flex-1 py-2 rounded-xl border-2 transition ${
                      deliveryTime === 'now'
                        ? 'border-[#2d6a4f] bg-[#f0f7f0] text-[#2d6a4f]'
                        : 'border-gray-200 hover:border-[#a7c957]'
                    }`}
                  >
                    Agora
                  </button>
                  <button
                    onClick={() => setDeliveryTime('schedule')}
                    className={`flex-1 py-2 rounded-xl border-2 transition ${
                      deliveryTime === 'schedule'
                        ? 'border-[#2d6a4f] bg-[#f0f7f0] text-[#2d6a4f]'
                        : 'border-gray-200 hover:border-[#a7c957]'
                    }`}
                  >
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Agendar
                  </button>
                </div>
                {deliveryTime === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                )}
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-[#2d6a4f]" />
                Método de Pagamento
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', icon: DollarSign, label: 'Dinheiro' },
                  { id: 'card', icon: CreditCard, label: 'Cartão' },
                  { id: 'mobile_money', icon: Smartphone, label: 'Mobile Money' },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-3 rounded-xl border-2 transition flex flex-col items-center gap-1 ${
                        paymentMethod === method.id
                          ? 'border-[#2d6a4f] bg-[#f0f7f0] text-[#2d6a4f]'
                          : 'border-gray-200 hover:border-[#a7c957]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4">
                Resumo do Pedido
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f0f4f0] rounded-lg flex items-center justify-center text-xs">
                      {item.quantity}x
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#2d6a4f]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxa de Entrega</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#2d6a4f] pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full mt-6 py-3 bg-[#2d6a4f] text-white rounded-2xl hover:bg-[#1b4332] transition font-medium shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Finalizar Pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FORMATADOR
// ============================================================
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  }).format(value || 0);
}