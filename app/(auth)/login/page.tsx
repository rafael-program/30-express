// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import {
  LogIn,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos. Tente novamente.'
          : error.message
      );
      setLoading(false);
      return;
    }

    // Redirecionar com base no role do usuário
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin' || profile?.role === 'manager') {
        router.push('/admin');
      } else if (profile?.role === 'delivery') {
        router.push('/delivery');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
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

        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-[#e8efe9]">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block hover:opacity-90 transition">
              <Image
                src="/logo-transparent.png"
                alt="30 Express - Alimentos Saudáveis & Naturais"
                width={200}
                height={64}
                className="h-16 mx-auto object-contain drop-shadow-sm"
                priority
              />
            </Link>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f7f3] text-[#2d6a4f] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#f4a261]" />
              Bem-vindo de volta!
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Link Esqueci Senha */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-[#2d6a4f] hover:text-[#1b4332] hover:underline font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-[#2d6a4f] hover:bg-[#1b4332] active:scale-[0.98] font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar na Minha Conta
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">Ou</span>
            </div>
          </div>

          {/* Link Cadastro */}
          <Link
            href="/register"
            className="w-full py-3 px-4 rounded-xl text-[#2d6a4f] bg-[#f0f7f3] hover:bg-[#e8f3ec] border border-[#d8f3dc] font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-[#f4a261]" />
            Criar Nova Conta
          </Link>

          {/* Footer de Segurança */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#52b788]" />
              Dados Seguros
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#f4a261]" />
              Entrega Mercado 30
            </span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 30 Express — Alimentos Saudáveis & Naturais
        </p>
      </div>
    </div>
  );
}