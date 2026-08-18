// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Usar o cliente normal (o RLS está desativado)
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)