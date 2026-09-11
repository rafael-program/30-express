// lib/orders.ts
import { supabase } from './supabase/client';
import { calculateDeliveryFee } from './delivery-fee';

// ============================================================
// TIPOS
// ============================================================
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

// ============================================================
// CALCULAR TOTAL
// ============================================================
export async function calculateTotal(items: OrderItem[]) {
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

// ============================================================
// BUSCAR PRODUTO
// ============================================================
export async function getProduct(productId: string) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  return data;
}

// ============================================================
// CRIAR PEDIDO
// ============================================================
export async function createOrder(orderData: OrderData) {
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
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  if (!order) throw new Error('Falha ao criar pedido');

  // Inserir itens
  for (const item of orderData.items) {
    const product = await getProduct(item.productId);
    if (product) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.productId,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity,
      });
    }
  }

  return order;
}

// ============================================================
// BUSCAR PEDIDO (com itens)
// ============================================================
export async function getOrder(orderId: string) {
  const { data } = await supabase
    .from('orders')
    .select(
      `
      *,
      items:order_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `
    )
    .eq('id', orderId)
    .single();

  return data;
}