// app/delivery/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkDelivery = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Verificar se é entregador
        const { data: agent, error } = await supabase
          .from('delivery_agents')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error || !agent) {
          console.error('Erro:', error);
          router.push('/dashboard');
          return;
        }

        // Verificar se está ativo
        if (agent.status !== 'active') {
          alert('Seu cadastro está inativo. Entre em contato com o administrador.');
          router.push('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Erro:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkDelivery();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}