// types/index.ts
export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_location: {
    lat: number;
    lng: number;
  };
  items: OrderItem[];
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: 'cash' | 'card' | 'mobile_money';
  delivery_time: string; // Horário agendado
  created_at: string;
  updated_at: string;
  qr_code: string;
};

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
  total: number;
};

export type DeliveryAgent = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  current_location: {
    lat: number;
    lng: number;
  };
  is_available: boolean;
  active_order_id?: string;
};