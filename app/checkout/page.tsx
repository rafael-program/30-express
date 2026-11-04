// app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  MapPin, Navigation, Truck, Clock, CreditCard, DollarSign,
  Smartphone, Calendar, ArrowLeft, CheckCircle, Loader2,
  MapPinHouse, User, Home, ChevronRight,
  Sparkles, Store, Route, Wallet, PartyPopper, Phone,
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
// COORDENADAS DO MERCADO DO 30
// ============================================================
const MARKET_LOCATION = {
  lat: -8.95735,
  lng: 13.48001,
  name: 'Mercado do 30',
  address: 'Viana, Luanda, Angola',
};

// ============================================================
// GERADORES (FORA DO COMPONENTE)
// ============================================================
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
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
  const [showSuccess, setShowSuccess] = useState(false);
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
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('my-address');
  const [otherAddress, setOtherAddress] = useState('');
  const [otherLat, setOtherLat] = useState<number | null>(null);
  const [otherLng, setOtherLng] = useState<number | null>(null);

  // ============================================================
  // CALCULAR TAXA (Haversine)
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
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          router.push('/login');
          return;
        }
        if (!cancelled) setUser({ id: authUser.id, email: authUser.email || '' });

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

        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          if (!cancelled) setCart(JSON.parse(savedCart));
        } else {
          router.push('/');
          return;
        }

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
            if (!cancelled) setFeePerKm(feePerKmVal);
          }
        } catch (settingsErr) {
          console.error('Erro ao buscar configurações:', settingsErr);
        }

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
  // ALTERNAR TIPO DE ENTREGA
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

  const handleGetOtherLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setOtherLat(lat);
        setOtherLng(lng);
        calculateDeliveryFee({ lat, lng }, feePerKm, 500);
      },
      () => setError('Não foi possível capturar a localização')
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
    if (deliveryType === 'my-address' && !customerLocation) {
      setError('Localização não disponível');
      return;
    }
    if (deliveryType === 'other-address') {
      if (!otherAddress.trim()) {
        setError('Informe o endereço de entrega alternativo');
        return;
      }
      if (!otherLat || !otherLng) {
        setError('Capture a localização do endereço alternativo');
        return;
      }
    }

    const finalAddress = deliveryType === 'my-address' ? address : otherAddress;
    const finalLat = deliveryType === 'my-address' ? customerLocation?.lat : otherLat;
    const finalLng = deliveryType === 'my-address' ? customerLocation?.lng : otherLng;

    if (!finalAddress.trim()) {
      setError('Informe o endereço de entrega');
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
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/order-confirmation?order_id=${orderResult.id}`);
      }, 2500);
    } catch (err) {
      console.error('💥 Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao finalizar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING SKELETON ANIMADO
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0eb] py-8">
        <div className="container mx-auto px-4 max-w-5xl space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-white rounded-3xl shadow-sm"></div>
              ))}
            </div>
            <div className="h-96 bg-white rounded-3xl shadow-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MODAL DE SUCESSO
  // ============================================================
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f2f7f4] via-[#fbf9f5] to-[#e8f3ec] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
            <PartyPopper className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] mb-3">
            Pedido Confirmado!
          </h1>
          <p className="text-gray-500 mb-6">
            O seu pedido foi criado com sucesso. A redirecionar para o acompanhamento...
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#2d6a4f]" />
            <span className="text-sm text-[#2d6a4f] font-medium">
              Redirecionando...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-[#f5f0eb] py-8 relative overflow-hidden">
      {/* Elementos decorativos animados */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#a7c957]/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f4a261]/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-in slide-in-from-top duration-500">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2d6a4f] transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar à loja
          </Link>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-[#f4a261] animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              Checkout Seguro
            </span>
          </div>
        </div>

        <div className="text-center mb-10 animate-in slide-in-from-top duration-700">
          <h1 className="text-4xl font-bold text-[#2d6a4f] mb-2">
            Finalizar Pedido
          </h1>
          <p className="text-gray-500">
            Está a {cart.reduce((sum, i) => sum + i.quantity, 0)} passos de receber em casa
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 animate-in slide-in-from-top">
            <p className="font-medium">❌ {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA ESQUERDA */}
          <div className="lg:col-span-2 space-y-6">
            {/* ETAPA 1: DADOS DO CLIENTE */}
            <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all animate-in slide-in-from-left duration-500">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  1
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Dados do Cliente</h2>
                  <p className="text-xs text-gray-500">Quem vai receber?</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2d6a4f] transition-colors" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome Completo"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/10 transition-all"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2d6a4f] transition-colors" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ETAPA 2: ENDEREÇO DE ORIGEM */}
            <div className="bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] rounded-3xl shadow-lg p-6 text-white animate-in slide-in-from-left duration-500 delay-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold">Origem do Pedido</h2>
                  <p className="text-xs text-white/70">De onde sai o pedido?</p>
                </div>
              </div>
              <div className="relative z-10">
                <p className="font-bold text-lg">🏪 {MARKET_LOCATION.name}</p>
                <p className="text-sm text-white/80 mt-1">{MARKET_LOCATION.address}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-white/60">
                  <MapPin className="w-3 h-3" />
                  <span>GPS: {MARKET_LOCATION.lat}, {MARKET_LOCATION.lng}</span>
                </div>
              </div>
            </div>

            {/* ETAPA 3: ENDEREÇO DE ENTREGA */}
            <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all animate-in slide-in-from-left duration-500 delay-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  2
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Endereço de Entrega</h2>
                  <p className="text-xs text-gray-500">Para onde enviamos?</p>
                </div>
              </div>

              {/* Toggle animado */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => handleDeliveryTypeChange('my-address')}
                  className={`py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'my-address'
                      ? 'border-[#2d6a4f] bg-[#2d6a4f] text-white shadow-lg scale-105'
                      : 'border-gray-200 text-gray-500 hover:border-[#a7c957] hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="font-medium text-sm">Meu Endereço</span>
                </button>
                <button
                  onClick={() => handleDeliveryTypeChange('other-address')}
                  className={`py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'other-address'
                      ? 'border-[#2d6a4f] bg-[#2d6a4f] text-white shadow-lg scale-105'
                      : 'border-gray-200 text-gray-500 hover:border-[#a7c957] hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">Outro Endereço</span>
                </button>
              </div>

              {deliveryType === 'my-address' && (
                <div className="animate-in slide-in-from-top duration-300">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, Número, Bairro"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/10 transition-all"
                  />
                  {customerLocation && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#f0f7f3] rounded-xl">
                        <p className="text-xs text-gray-500">Distância</p>
                        <p className="font-bold text-[#2d6a4f] flex items-center gap-1">
                          <Route className="w-4 h-4" />
                          {distance.toFixed(1)} km
                        </p>
                      </div>
                      <div className="p-3 bg-[#f0f7f3] rounded-xl">
                        <p className="text-xs text-gray-500">Taxa</p>
                        <p className="font-bold text-[#2d6a4f] flex items-center gap-1">
                          <Truck className="w-4 h-4" />
                          {formatCurrency(deliveryFee)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {deliveryType === 'other-address' && (
                <div className="space-y-3 animate-in slide-in-from-top duration-300">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Endereço Alternativo
                    </label>
                    <input
                      type="text"
                      value={otherAddress}
                      onChange={(e) => setOtherAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/10 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleGetOtherLocation}
                    className="w-full py-3 bg-gradient-to-r from-[#a7c957] to-[#8fb84a] text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Navigation className="w-4 h-4" />
                    Capturar Localização
                  </button>
                  {otherLat && otherLng && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#f0f7f3] rounded-xl">
                        <p className="text-xs text-gray-500">Distância</p>
                        <p className="font-bold text-[#2d6a4f]">{distance.toFixed(1)} km</p>
                      </div>
                      <div className="p-3 bg-[#f0f7f3] rounded-xl">
                        <p className="text-xs text-gray-500">Taxa</p>
                        <p className="font-bold text-[#2d6a4f]">{formatCurrency(deliveryFee)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ETAPA 4: AGENDAMENTO */}
            <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all animate-in slide-in-from-left duration-500 delay-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  3
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Quando entregar?</h2>
                  <p className="text-xs text-gray-500">Escolha o horário</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setDeliveryTime('now')}
                  className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                    deliveryTime === 'now'
                      ? 'border-[#2d6a4f] bg-[#f0f7f0] text-[#2d6a4f] shadow-md'
                      : 'border-gray-200 text-gray-500 hover:border-[#a7c957]'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-medium text-sm">Agora</span>
                  <span className="text-xs opacity-70">Entrega rápida</span>
                </button>
                <button
                  onClick={() => setDeliveryTime('schedule')}
                  className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                    deliveryTime === 'schedule'
                      ? 'border-[#2d6a4f] bg-[#f0f7f0] text-[#2d6a4f] shadow-md'
                      : 'border-gray-200 text-gray-500 hover:border-[#a7c957]'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium text-sm">Agendar</span>
                  <span className="text-xs opacity-70">Escolha a hora</span>
                </button>
              </div>
              {deliveryTime === 'schedule' && (
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/10 transition-all animate-in slide-in-from-top"
                />
              )}
            </div>

            {/* ETAPA 5: PAGAMENTO */}
            <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all animate-in slide-in-from-left duration-500 delay-[400ms]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  4
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Método de Pagamento</h2>
                  <p className="text-xs text-gray-500">Pague na entrega</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', icon: DollarSign, label: 'Dinheiro' },
                  { id: 'card', icon: CreditCard, label: 'Cartão' },
                  { id: 'mobile_money', icon: Smartphone, label: 'Mobile' },
                ].map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 active:scale-95 ${
                        isActive
                          ? 'border-[#2d6a4f] bg-[#2d6a4f] text-white shadow-lg scale-105'
                          : 'border-gray-200 text-gray-500 hover:border-[#a7c957]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RESUMO LATERAL */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-2 mb-5">
                <Wallet className="w-5 h-5 text-[#2d6a4f]" />
                <h2 className="font-bold text-gray-800">Resumo</h2>
                <span className="ml-auto text-xs bg-[#f0f7f3] text-[#2d6a4f] px-2 py-1 rounded-full font-medium">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#f0f4f0] to-[#e8efe9] rounded-xl flex items-center justify-center text-xs font-bold text-[#2d6a4f]">
                      {item.quantity}x
                    </div>
                    <div className="flex-1 min-w-0">
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

              <div className="border-t-2 border-dashed border-gray-100 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Entrega
                  </span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-[#2d6a4f] pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full mt-6 py-4 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white rounded-2xl hover:shadow-xl transition-all font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 group"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    A processar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Finalizar Pedido
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Seguro
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-[#f4a261]" />
                  Rápido
                </span>
                <span className="flex items-center gap-1">
                  <MapPinHouse className="w-3 h-3 text-[#2d6a4f]" />
                  Local
                </span>
              </div>
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