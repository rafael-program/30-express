// lib/supabase/queries.ts
import { supabase } from './client';

// Buscar produtos com filtros
export async function getProductsByCategory(category?: string) {
  let query = supabase.from('products').select('*');
  
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Buscar produtos em destaque
export async function getFeaturedProducts(limit = 4) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('rating', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// Buscar pedido por ID
export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data;
}

// Atualizar status do pedido
export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);
  
  if (error) throw error;
}

// Gerar QR Code
export function generateQRCode(orderNumber: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${orderNumber}`;
}