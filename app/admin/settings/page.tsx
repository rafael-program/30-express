// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Settings,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Truck,
  DollarSign,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  Shield,
  Users,
  Package,
  CreditCard,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  User,
  Home,
  Building,
  Store,
  RefreshCw,
  Upload,
  Camera,
  Loader2
} from 'lucide-react';

type SettingsData = {
  id: string;
  store_name: string;
  store_phone: string;
  store_email: string;
  store_address: string;
  store_whatsapp: string;
  delivery_base_fee: number;
  delivery_fee_per_km: number;
  delivery_max_distance: number;
  delivery_estimated_time: number;
  currency: string;
  timezone: string;
  maintenance_mode: boolean;
  allow_guest_checkout: boolean;
  min_order_value: number;
  max_order_value: number;
  created_at: string;
  updated_at: string;
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState<SettingsData>({
    id: '',
    store_name: '30 Express',
    store_phone: '+244 923 456 789',
    store_email: 'contato@30express.com',
    store_address: 'Mercado 30, Luanda, Angola',
    store_whatsapp: '+244 923 456 789',
    delivery_base_fee: 200,
    delivery_fee_per_km: 50,
    delivery_max_distance: 20,
    delivery_estimated_time: 60,
    currency: 'AOA',
    timezone: 'Africa/Luanda',
    maintenance_mode: false,
    allow_guest_checkout: true,
    min_order_value: 0,
    max_order_value: 100000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Criar configurações padrão
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        store_name: '30 Express',
        store_phone: '+244 923 456 789',
        store_email: 'contato@30express.com',
        store_address: 'Mercado 30, Luanda, Angola',
        store_whatsapp: '+244 923 456 789',
        delivery_base_fee: 200,
        delivery_fee_per_km: 50,
        delivery_max_distance: 20,
        delivery_estimated_time: 60,
        currency: 'AOA',
        timezone: 'Africa/Luanda',
        maintenance_mode: false,
        allow_guest_checkout: true,
        min_order_value: 0,
        max_order_value: 100000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Erro ao criar configurações padrão:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        ...settings,
        updated_at: new Date().toISOString()
      };

      if (settings.id) {
        // Atualizar
        const { error } = await supabase
          .from('settings')
          .update(updateData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('settings')
          .insert([updateData]);

        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Configurações
          </h1>
          <p className="text-gray-500 mt-1">Gerencie as configurações da plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-green-600 flex items-center gap-1 text-sm">
              <CheckCircle className="w-4 h-4" />
              Salvo com sucesso!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-4 py-3 gap-2">
            {[
              { id: 'general', icon: Store, label: 'Geral' },
              { id: 'delivery', icon: Truck, label: 'Entregas' },
              { id: 'payments', icon: CreditCard, label: 'Pagamentos' },
              { id: 'security', icon: Shield, label: 'Segurança' },
              { id: 'notifications', icon: Bell, label: 'Notificações' },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#2d6a4f] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Geral */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Store className="w-5 h-5 text-[#2d6a4f]" />
                Informações da Loja
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={settings.store_phone}
                    onChange={(e) => handleChange('store_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => handleChange('store_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={settings.store_whatsapp}
                    onChange={(e) => handleChange('store_whatsapp', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={settings.store_address}
                    onChange={(e) => handleChange('store_address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#2d6a4f]" />
                  Configurações Regionais
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moeda</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    >
                      <option value="AOA">AOA - Kwanza</option>
                      <option value="USD">USD - Dólar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuso Horário</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    >
                      <option value="Africa/Luanda">Africa/Luanda</option>
                      <option value="Africa/Lagos">Africa/Lagos</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Entregas */}
          {activeTab === 'delivery' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#2d6a4f]" />
                Configurações de Entrega
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxa Base (Kz)</label>
                  <input
                    type="number"
                    value={settings.delivery_base_fee}
                    onChange={(e) => handleChange('delivery_base_fee', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxa por Km (Kz)</label>
                  <input
                    type="number"
                    value={settings.delivery_fee_per_km}
                    onChange={(e) => handleChange('delivery_fee_per_km', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distância Máxima (km)</label>
                  <input
                    type="number"
                    value={settings.delivery_max_distance}
                    onChange={(e) => handleChange('delivery_max_distance', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Estimado (min)</label>
                  <input
                    type="number"
                    value={settings.delivery_estimated_time}
                    onChange={(e) => handleChange('delivery_estimated_time', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-medium">📌 Como funciona o cálculo:</p>
                <p className="mt-1">Taxa total = Taxa Base + (Distância × Taxa por Km)</p>
                <p className="mt-1 text-xs opacity-75">Distância máxima: {settings.delivery_max_distance} km</p>
              </div>
            </div>
          )}

          {/* Tab: Pagamentos */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#2d6a4f]" />
                Configurações de Pagamento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo do Pedido (Kz)</label>
                  <input
                    type="number"
                    value={settings.min_order_value}
                    onChange={(e) => handleChange('min_order_value', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo do Pedido (Kz)</label>
                  <input
                    type="number"
                    value={settings.max_order_value}
                    onChange={(e) => handleChange('max_order_value', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.allow_guest_checkout}
                    onChange={(e) => handleChange('allow_guest_checkout', e.target.checked)}
                    className="w-4 h-4 text-[#2d6a4f] rounded focus:ring-[#2d6a4f]"
                  />
                  <span className="text-sm text-gray-700">Permitir compra sem cadastro (convidado)</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab: Segurança */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2d6a4f]" />
                Segurança
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 bg-[#f8f6f4] rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">Modo Manutenção</p>
                    <p className="text-sm text-gray-500">Bloquear acesso à loja durante manutenção</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2d6a4f]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d6a4f]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Notificações */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#2d6a4f]" />
                Notificações
              </h2>
              <div className="space-y-3">
                {[
                  { id: 'new_order', label: 'Novo pedido', description: 'Receber notificação quando um novo pedido for feito' },
                  { id: 'order_status', label: 'Atualização de status', description: 'Receber notificação quando o status do pedido mudar' },
                  { id: 'delivery_complete', label: 'Entrega concluída', description: 'Receber notificação quando uma entrega for concluída' },
                  { id: 'low_stock', label: 'Estoque baixo', description: 'Receber notificação quando um produto estiver com estoque baixo' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-[#f8f6f4] rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2d6a4f]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d6a4f]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações da Última Atualização */}
      <div className="bg-white rounded-3xl shadow-lg p-4 text-center text-sm text-gray-400">
        <p>Última atualização: {settings.updated_at ? new Date(settings.updated_at).toLocaleString('pt-AO') : 'Nunca'}</p>
      </div>
    </div>
  );
}