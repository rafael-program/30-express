// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Save,
  Store,
  Truck,
  CreditCard,
  CheckCircle,
  Settings as SettingsIcon,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Settings = {
  id: string;
  store_name: string;
  store_phone: string | null;
  store_email: string | null;
  store_address: string | null;
  delivery_base_fee: number;
  delivery_per_km: number;
  min_order: number;
  open_hours: string;
  close_hours: string;
  accepts_cash: boolean;
  accepts_card: boolean;
  accepts_transfer: boolean;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
};

type SettingsForm = Omit<
  Settings,
  'id' | 'created_at' | 'updated_at'
>;

// ============================================================
// DEFAULTS
// ============================================================
const DEFAULT_SETTINGS: SettingsForm = {
  store_name: 'Mercado do 30',
  store_phone: '',
  store_email: '',
  store_address: '',
  delivery_base_fee: 500,
  delivery_per_km: 100,
  min_order: 1000,
  open_hours: '08:00',
  close_hours: '20:00',
  accepts_cash: true,
  accepts_card: true,
  accepts_transfer: false,
  whatsapp: '',
};

// ============================================================
// COMPONENTE
// ============================================================
export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] =
    useState<SettingsForm>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'store' | 'delivery' | 'payment'>(
    'store'
  );

  // ============================================================
  // BUSCAR CONFIGURAÇÕES
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          if (!cancelled) {
            setSettingsId(data.id);
            setFormData({
              store_name: data.store_name || '',
              store_phone: data.store_phone || '',
              store_email: data.store_email || '',
              store_address: data.store_address || '',
              delivery_base_fee: data.delivery_base_fee || 500,
              delivery_per_km: data.delivery_per_km || 100,
              min_order: data.min_order || 1000,
              open_hours: data.open_hours || '08:00',
              close_hours: data.close_hours || '20:00',
              accepts_cash: data.accepts_cash ?? true,
              accepts_card: data.accepts_card ?? true,
              accepts_transfer: data.accepts_transfer ?? false,
              whatsapp: data.whatsapp || '',
            });
          }
        } else {
          // Criar settings padrão
          const { data: created, error: createError } = await supabase
            .from('settings')
            .insert([DEFAULT_SETTINGS])
            .select()
            .single();

          if (createError) throw createError;
          if (!cancelled && created) {
            setSettingsId(created.id);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // SALVAR
  // ============================================================
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (settingsId) {
        const { error } = await supabase
          .from('settings')
          .update(payload)
          .eq('id', settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      alert('✅ Configurações salvas!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('❌ Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // HELPERS DE FORM
  // ============================================================
  const updateField = <K extends keyof SettingsForm>(
    field: K,
    value: SettingsForm[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">
            Carregando configurações...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <SettingsIcon className="w-8 h-8" />
            Configurações
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie as configurações da plataforma
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-lg p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-3 px-4 rounded-2xl font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'store'
              ? 'bg-[#2d6a4f] text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Store className="w-4 h-4" />
          Loja
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex-1 py-3 px-4 rounded-2xl font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'delivery'
              ? 'bg-[#2d6a4f] text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          Entrega
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex-1 py-3 px-4 rounded-2xl font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'payment'
              ? 'bg-[#2d6a4f] text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Pagamento
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        {/* TAB: Loja */}
        {activeTab === 'store' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#2d6a4f] flex items-center gap-2 mb-4">
              <Store className="w-5 h-5" />
              Informações da Loja
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Loja
              </label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => updateField('store_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.store_phone || ''}
                  onChange={(e) => updateField('store_phone', e.target.value)}
                  placeholder="+244 9XX XXX XXX"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp || ''}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  placeholder="+244 9XX XXX XXX"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.store_email || ''}
                onChange={(e) => updateField('store_email', e.target.value)}
                placeholder="contato@30express.ao"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <textarea
                value={formData.store_address || ''}
                onChange={(e) => updateField('store_address', e.target.value)}
                rows={3}
                placeholder="Endereço completo do Mercado do 30"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Abertura
                </label>
                <input
                  type="time"
                  value={formData.open_hours}
                  onChange={(e) => updateField('open_hours', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Fecho
                </label>
                <input
                  type="time"
                  value={formData.close_hours}
                  onChange={(e) => updateField('close_hours', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: Entrega */}
        {activeTab === 'delivery' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#2d6a4f] flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5" />
              Configurações de Entrega
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa Base (Kz)
                </label>
                <input
                  type="number"
                  value={formData.delivery_base_fee}
                  onChange={(e) =>
                    updateField(
                      'delivery_base_fee',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="50"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa por KM (Kz)
                </label>
                <input
                  type="number"
                  value={formData.delivery_per_km}
                  onChange={(e) =>
                    updateField(
                      'delivery_per_km',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="10"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedido Mínimo (Kz)
              </label>
              <input
                type="number"
                value={formData.min_order}
                onChange={(e) =>
                  updateField('min_order', parseFloat(e.target.value) || 0)
                }
                min="0"
                step="100"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            <div className="p-4 bg-[#f0f4f0] rounded-xl">
              <p className="text-sm text-gray-600">
                <strong>Exemplo de cálculo:</strong> Para uma entrega a 3 km
                do Mercado do 30, a taxa será de{' '}
                <strong>
                  {(
                    formData.delivery_base_fee +
                    formData.delivery_per_km * 3
                  ).toLocaleString('pt-AO')}{' '}
                  Kz
                </strong>
                .
              </p>
            </div>
          </div>
        )}

        {/* TAB: Pagamento */}
        {activeTab === 'payment' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#2d6a4f] flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              Métodos de Pagamento
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Selecione os métodos de pagamento aceitos na entrega:
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-[#f8f6f4] rounded-xl cursor-pointer hover:bg-[#f0f4f0] transition">
                <input
                  type="checkbox"
                  checked={formData.accepts_cash}
                  onChange={(e) =>
                    updateField('accepts_cash', e.target.checked)
                  }
                  className="w-5 h-5 accent-[#2d6a4f]"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    Dinheiro na Entrega
                  </p>
                  <p className="text-xs text-gray-500">
                    Cliente paga em cash ao receber o pedido
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-[#f8f6f4] rounded-xl cursor-pointer hover:bg-[#f0f4f0] transition">
                <input
                  type="checkbox"
                  checked={formData.accepts_card}
                  onChange={(e) =>
                    updateField('accepts_card', e.target.checked)
                  }
                  className="w-5 h-5 accent-[#2d6a4f]"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    Cartão na Entrega
                  </p>
                  <p className="text-xs text-gray-500">
                    Entregador leva POS/multicaixa
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-[#f8f6f4] rounded-xl cursor-pointer hover:bg-[#f0f4f0] transition">
                <input
                  type="checkbox"
                  checked={formData.accepts_transfer}
                  onChange={(e) =>
                    updateField('accepts_transfer', e.target.checked)
                  }
                  className="w-5 h-5 accent-[#2d6a4f]"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    Transferência Bancária
                  </p>
                  <p className="text-xs text-gray-500">
                    Cliente envia comprovativo antes da entrega
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Botão de salvar inferior (para mobile) */}
      <div className="flex md:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}