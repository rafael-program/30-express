// lib/orders.ts
import { createClient } from './supabase/client';
import { calculateDeliveryFee } from './delivery-fee';

interface OrderItem {
  productId: string;
  quantity: number;
}

interface OrderData {
  clientId: string;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  scheduledTime?: Date;
}

export async function calculateTotal(items: OrderItem[]) {
  const supabase = createClient();
  let total = 0;

  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', item.productId)
      .single();

    if (product) {
      total += product.price * item.quantity;
    }
  }

  return total;
}

export async function getProduct(productId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  return data;
}

export async function createOrder(orderData: OrderData) {
  const supabase = createClient();

  const total = await calculateTotal(orderData.items);
  const deliveryFee = calculateDeliveryFee(
    orderData.deliveryLat,
    orderData.deliveryLng
  );

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      client_id: orderData.clientId,
      delivery_address: orderData.deliveryAddress,
      delivery_lat: orderData.deliveryLat,
      delivery_lng: orderData.deliveryLng,
      total_amount: total,
      delivery_fee: deliveryFee,
      scheduled_time: orderData.scheduledTime || new Date(),
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  for (const item of orderData.items) {
    const product = await getProduct(item.productId);
    if (product) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity,
      });
    }
  }

  return order;
}

export async function getOrder(orderId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      users:client_id (name, phone),
      order_items (
        quantity,
        total_price,
        unit_price,
        products (name, price)
      )
    `)
    .eq('id', orderId)
    .single();
  return data;
}