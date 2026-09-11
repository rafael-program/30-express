// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  Truck,
  Clock,
  CreditCard,
  DollarSign,
  Smartphone,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MapPinHouse,
  Phone,
  User,
  ShoppingBag,
  X
} from 'lucide-react';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
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
  const [feePerKm, setFeePerKm] = useState(400);
  const [baseFee, setBaseFee] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MARKET_LOCATION = { lat: -8.838, lng: 13.285 };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/login');
          return;
        }
        
        setUser(user);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          setAddress(profileData.address || '');
          setPhone(profileData.phone || '');
          setCustomerName(profileData.full_name || '');
        }

        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        } else {
          router.push('/');
        }

        let feePerKmVal = 400;
        let baseFeeVal = 0;
        try {
          const { data: settingsData } = await supabase
            .from('settings')
            .select('delivery_base_fee, delivery_fee_per_km')
            .single();
          
          if (settingsData) {
            if (typeof settingsData.delivery_fee_per_km === 'number' && settingsData.delivery_fee_per_km > 0) {
              feePerKmVal = settingsData.delivery_fee_per_km;
              setFeePerKm(settingsData.delivery_fee_per_km);
            }
            if (typeof settingsData.delivery_base_fee === 'number') {
              baseFeeVal = settingsData.delivery_base_fee;
              setBaseFee(settingsData.delivery_base_fee);
            }
          }
        } catch (settingsErr) {
          console.error('Erro ao buscar configurações de taxa:', settingsErr);
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setCustomerLocation(location);
              calculateDeliveryFee(location, feePerKmVal, baseFeeVal);
            },
            () => {
              const defaultLocation = { lat: -8.839, lng: 13.289 };
              setCustomerLocation(defaultLocation);
              calculateDeliveryFee(defaultLocation, feePerKmVal, baseFeeVal);
            }
          );
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const calculateDeliveryFee = (
    location: { lat: number; lng: number },
    currentFeePerKm = feePerKm,
    currentBaseFee = baseFee
  ) => {
    const R = 6371;
    const dLat = (location.lat - MARKET_LOCATION.lat) * Math.PI / 180;
    const dLng = (location.lng - MARKET_LOCATION.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(MARKET_LOCATION.lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    setDistance(Math.round(distanceKm * 10) / 10);
    
    // Taxa: 400 Kz por km (ex: 20km = 8.000 Kz)
    const fee = currentBaseFee + (distanceKm * currentFeePerKm);
    setDeliveryFee(Math.round(fee));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${year}${month}${day}-${random}`;
  };

  const generateQRCode = (orderId: string) => {
    return `QR-${orderId.slice(0, 8)}`;
  };

  const handleSubmitOrder = async () => {
    if (!user || !customerLocation) {
      setError('Localização não disponível');
      return;
    }

    if (!address.trim()) {
      setError('Por favor, informe o endereço de entrega');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderNumber = generateOrderNumber();
      const qrCode = generateQRCode(orderNumber);

      // 🔥 Incluir customer_name e customer_phone
      const orderData = {
        client_id: user.id,
        customer_name: customerName || 'Cliente',
        customer_phone: phone || 'Não informado',
        delivery_address: address.trim(),
        delivery_lat: customerLocation.lat,
        delivery_lng: customerLocation.lng,
        customer_lat: customerLocation.lat,
        customer_lng: customerLocation.lng,
        delivery_fee: deliveryFee,
        subtotal: subtotal,
        total_amount: total,
        status: 'pending',
        payment_method: paymentMethod,
        delivery_time: deliveryTime === 'now' ? new Date().toISOString() : new Date(scheduledDate).toISOString(),
        scheduled_time: deliveryTime === 'now' ? new Date().toISOString() : new Date(scheduledDate).toISOString(),
        qr_code: qrCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📤 Enviando pedido:', orderData);

      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Erro ao criar pedido:', orderError);
        setError(`Erro ao criar pedido: ${orderError.message}`);
        setSubmitting(false);
        return;
      }

      console.log('✅ Pedido criado:', orderResult);

      // 🔥 Adicionar itens
      const orderItems = cart.map(item => ({
        order_id: orderResult.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        created_at: new Date().toISOString()
      }));

      console.log('📤 Adicionando itens:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Erro ao adicionar itens:', itemsError);
        setError(`Erro ao salvar itens: ${itemsError.message}`);
        setSubmitting(false);
        return;
      }

      console.log('✅ Itens adicionados com sucesso!');

      localStorage.removeItem('cart');
      router.push(`/order-confirmation?order=${orderResult.id}`);

    } catch (error: any) {
      console.error('💥 Erro inesperado:', error);
      setError(error.message || 'Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#f5f0eb] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2d6a4f] transition mb-6">
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
            <p className="text-sm mt-1">Verifique os dados e tente novamente.</p>
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
                    placeholder="Seu nome completo"
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
                    placeholder="+244 936 953 381"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <MapPinHouse className="w-5 h-5 text-[#2d6a4f]" />
                Endereço de Entrega
              </h2>
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
                  required
                />
              </div>
            </div>

            {/* Localização */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#2d6a4f]" />
                Localização
              </h2>
              {customerLocation ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Navigation className="w-4 h-4 text-[#2d6a4f]" />
                    <span>📍 Mercado 30 → {distance.toFixed(1)} km de distância</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4 text-[#2d6a4f]" />
                    <span>🚚 Taxa de entrega: {deliveryFee.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} ({feePerKm} Kz/km)</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Carregando localização...</p>
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
              <p className="text-xs text-gray-500 mt-2 text-center">
                Pagamento realizado no momento da entrega
              </p>
            </div>
          </div>

          {/* Resumo do Pedido */}
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
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#2d6a4f]">
                      {(item.price * item.quantity).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxa de Entrega</span>
                  <span>{deliveryFee.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#2d6a4f] pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={submitting || !customerLocation}
                className="w-full mt-6 py-3 bg-[#2d6a4f] text-white rounded-2xl hover:bg-[#1b4332] transition font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              {!customerLocation && (
                <p className="text-center text-xs text-red-500 mt-2">
                  Aguardando localização...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}