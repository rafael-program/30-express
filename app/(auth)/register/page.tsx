// app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, UserPlus, ArrowLeft, ShieldCheck, Truck, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            role: 'client',
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            role: 'client',
          });

        if (userError) {
          console.error('Error saving user profile:', userError);
        }

        router.push('/login');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f2f7f4] via-[#fbf9f5] to-[#e8f3ec] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#74c69d]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#f4a261]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Voltar para início */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332] mb-6 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para a loja
        </Link>

        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-natural-xl border border-[#e8efe9]">
          {/* Logo Oficial */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block hover:opacity-90 transition">
              <img 
                src="/logo-transparent.png" 
                alt="30 Express - Alimentos Saudáveis & Naturais" 
                className="h-16 mx-auto object-contain drop-shadow-sm" 
              />
            </Link>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f7f3] text-[#2d6a4f] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#f4a261]" />
              Cadastro Rápido de Cliente
            </div>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Nome Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="Ex: Manuel António"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="seu.email@exemplo.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="+244 9XX XXX XXX"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="Mínimo de 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="Repita sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-white bg-[#2d6a4f] hover:bg-[#1b4332] active:scale-[0.98] font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar Minha Conta
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Já possui uma conta?{' '}
              <Link href="/login" className="font-semibold text-[#2d6a4f] hover:text-[#1b4332] hover:underline">
                Entrar agora
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#52b788]" />
              Dados Seguros
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-[#f4a261]" />
              Entrega Mercado 30
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}