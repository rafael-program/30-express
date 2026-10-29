// app/reset-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Truck,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // ============================================================
  // VERIFICAR SESSÃO (Supabase já cria uma quando o user clica no link)
  // ============================================================
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    };
    checkSession();
  }, []);

  // ============================================================
  // SUBMETER NOVA SENHA
  // ============================================================
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Após 3 segundos, redirecionar para login
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao atualizar senha. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // AGUARDANDO VERIFICAÇÃO
  // ============================================================
  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f2f7f4] via-[#fbf9f5] to-[#e8f3ec]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Verificando link...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // LINK INVÁLIDO OU EXPIRADO
  // ============================================================
  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f2f7f4] via-[#fbf9f5] to-[#e8f3ec] py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1b4332] mb-2">
            Link Inválido ou Expirado
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            O link de recuperação que você clicou já expirou ou não é válido.
            Por favor, solicite um novo link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block w-full py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-semibold text-sm"
          >
            Solicitar Novo Link
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // SUCESSO
  // ============================================================
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f2f7f4] via-[#fbf9f5] to-[#e8f3ec] py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1b4332] mb-2">
            Senha Atualizada!
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            A sua senha foi redefinida com sucesso. Você será redirecionado para
            a página de login em instantes...
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#2d6a4f]" />
            <span className="text-sm text-[#2d6a4f] font-medium">
              Redirecionando...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORMULÁRIO DE NOVA SENHA
  // ============================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f2f7f4] via-[#fbf9f5] to-[#e8f3ec] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#74c69d]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#f4a261]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
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
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#1b4332] mb-2">
              Defina a Nova Senha
            </h2>
            <p className="text-sm text-gray-500">
              Escolha uma senha forte com pelo menos 6 caracteres.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleReset}>
            {/* Nova Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
              >
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirmar Nova Senha */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
              >
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
              {confirmPassword && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {password === confirmPassword ? (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Senhas coincidem
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                      <span className="w-3.5 h-3.5">⚠️</span>
                      Senhas não coincidem
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-[#2d6a4f] hover:bg-[#1b4332] active:scale-[0.98] font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A atualizar...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Atualizar Senha
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-[#2d6a4f] hover:text-[#1b4332] font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Login
            </Link>
          </div>

          {/* Footer de Segurança */}
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-gray-500">
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

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 30 Express — Alimentos Saudáveis & Naturais
        </p>
      </div>
    </div>
  );
}