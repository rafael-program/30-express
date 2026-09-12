// components/EmailConfirmationModal.tsx
'use client';

import { useState } from 'react';
import { Mail, X, CheckCircle, ExternalLink } from 'lucide-react';

type EmailConfirmationModalProps = {
  isOpen: boolean;
  email: string;
  onClose: () => void;
};

export default function EmailConfirmationModal({
  isOpen,
  email,
  onClose,
}: EmailConfirmationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleOpenEmailProvider = () => {
    const domain = email.split('@')[1]?.toLowerCase();
    const providers: Record<string, string> = {
      'gmail.com': 'https://mail.google.com',
      'outlook.com': 'https://outlook.live.com',
      'hotmail.com': 'https://outlook.live.com',
      'yahoo.com': 'https://mail.yahoo.com',
      'icloud.com': 'https://www.icloud.com/mail',
      'protonmail.com': 'https://mail.proton.me',
      'zoho.com': 'https://mail.zoho.com',
    };

    const url = providers[domain];
    if (url) {
      window.open(url, '_blank');
    } else {
      window.open('https://mail.google.com', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
        {/* Botão fechar */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Fechar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Ícone */}
        <div className="w-20 h-20 bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="w-10 h-10 text-white" />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Confirme o Seu Email
        </h2>

        {/* Descrição */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Enviámos um <strong>link de confirmação</strong> para o seu email.
          <br />
          Abra a sua caixa de entrada e clique no link para ativar a sua
          conta.
        </p>

        {/* Email destacado */}
        <div className="bg-[#f0f4f0] rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Email enviado para:</p>
          <p className="font-bold text-[#2d6a4f] break-all">{email}</p>
          <button
            onClick={handleCopyEmail}
            className="mt-2 text-xs text-[#2d6a4f] hover:underline flex items-center gap-1 mx-auto"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Copiado!
              </>
            ) : (
              'Copiar email'
            )}
          </button>
        </div>

        {/* Passos */}
        <div className="space-y-3 mb-6 text-left">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#2d6a4f] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <p className="text-sm text-gray-600">
              Abra o seu provedor de email (Gmail, Outlook, etc.)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#2d6a4f] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <p className="text-sm text-gray-600">
              Procure um email do <strong>30 Express</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#2d6a4f] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <p className="text-sm text-gray-600">
              Clique no link <strong>&quot;Confirmar Email&quot;</strong>
            </p>
          </div>
        </div>

        {/* Aviso de spam */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-6 text-left">
          <p className="text-xs text-orange-700">
            <strong>⚠️ Não encontrou?</strong> Verifique a pasta de{' '}
            <strong>Spam</strong> ou <strong>Lixo Eletrónico</strong>.
          </p>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={handleOpenEmailProvider}
            className="w-full py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir o Meu Email
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium"
          >
            Entendi, vou verificar
          </button>
        </div>

        {/* Rodapé */}
        <p className="text-xs text-gray-400 mt-6">
          Depois de confirmar, já pode fazer login na sua conta.
        </p>
      </div>
    </div>
  );
}