// app/api/admin/create-delivery-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente admin (service_role) — só roda no servidor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================================
// POST — Criar entregador (user + profile + agent)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_name,
      phone,
      email,
      password,
      bi_number,
      vehicle,
      vehicle_plate,
      status,
    } = body;

    // Validações
    if (!full_name?.trim() || !phone?.trim() || !bi_number?.trim()) {
      return NextResponse.json(
        { error: 'Nome, telefone e BI são obrigatórios' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório para o login do entregador' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // 1. Criar usuário no auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          phone: phone.trim(),
          role: 'delivery',
        },
      });

    if (authError) {
      if (
        authError.message.toLowerCase().includes('already') ||
        authError.message.toLowerCase().includes('registered')
      ) {
        return NextResponse.json(
          { error: 'Já existe um usuário com este email' },
          { status: 400 }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Upsert do profile com role='delivery'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: full_name.trim(),
        phone: phone.trim(),
        role: 'delivery',
      });

    if (profileError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // 3. Criar o delivery_agent vinculado
    const { data: agentData, error: agentError } = await supabaseAdmin
      .from('delivery_agents')
      .insert({
        user_id: userId,
        full_name: full_name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        bi_number: bi_number.trim(),
        vehicle: vehicle || null,
        vehicle_plate: vehicle_plate?.trim() || null,
        status: status || 'active',
        is_available: status === 'active',
      })
      .select()
      .single();

    if (agentError) {
      // Rollback
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw agentError;
    }

    return NextResponse.json({
      success: true,
      agent: agentData,
      message: 'Entregador criado com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao criar entregador:', error);
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}