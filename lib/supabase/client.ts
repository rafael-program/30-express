// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Função auxiliar para buscar dados reais
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return []
  }
  return data
}

export async function getOrders(customerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar pedidos:', error)
    return []
  }
  return data
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
  return data
}