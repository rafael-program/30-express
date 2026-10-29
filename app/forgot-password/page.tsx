// app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  CheckCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao enviar e-mail. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f2f7f4] via-[#fbf9f5] to-[#e8f3ec] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#74c69d]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#f4a261]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332] mb-6 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para o login
        </Link>

        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-[#e8efe9]">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block hover:opacity-90 transition">
              <Image
                src="/logo-transparent.png"
                alt="30 Express"
                width={200}
                height={64}
                className="h-16 mx-auto object-contain drop-shadow-sm"
                priority
              />
            </Link>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff8ed] text-[#e76f51] text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5" />
              Recuperar Senha
            </div>
          </div>

          {success ? (
            // ============================================================
            // TELA DE SUCESSO
            // ============================================================
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1b4332] mb-2">
                  E-mail Enviado!
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Enviámos um link de recuperação para o e-mail:
                </p>
                <p className="font-bold text-[#2d6a4f] mt-2 break-all">
                  {email}
                </p>
              </div>

              <div className="bg-[#f0f7f3] border border-[#d8f3dc] rounded-xl p-4 text-left text-sm text-gray-600">
                <p className="font-semibold text-[#2d6a4f] mb-2">
                  Próximos passos:
                </p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Abra o seu e-mail</li>
                  <li>Clique no link <strong>&quot;Redefinir Senha&quot;</strong></li>
                  <li>Defina a nova senha</li>
                </ol>
                <p className="mt-3 text-xs text-gray-500">
                  ⚠️ Não encontrou? Verifique a pasta de <strong>Spam</strong>{' '}
                  ou <strong>Lixo Eletrónico</strong>.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-semibold text-sm"
                >
                  Enviar para outro e-mail
                </button>
                <Link
                  href="/login"
                  className="w-full py-3 bg-white border border-[#2d6a4f] text-[#2d6a4f] rounded-xl hover:bg-[#f0f7f3] transition font-semibold text-sm flex items-center justify-center"
                >
                  Voltar ao Login
                </Link>
              </div>
            </div>
          ) : (
            // ============================================================
            // FORMULÁRIO
            // ============================================================
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-[#1b4332] mb-2">
                  Esqueceu a sua senha?
                </h2>
                <p className="text-sm text-gray-500">
                  Digite o e-mail associado à sua conta e enviaremos um link
                  para redefinir a senha.
                </p>
              </div>

              {error && (
                <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white bg-[#2d6a4f] hover:bg-[#1b4332] active:scale-[0.98] font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Enviar Link de Recuperação
                    </>
                  )}
                </button>
              </form>

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
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 30 Express — Alimentos Saudáveis & Naturais
        </p>
      </div>
    </div>
  );
}