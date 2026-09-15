// app/admin/delivery/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import {
  Truck,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ============================================================
// TIPOS (adaptados ao schema real do Supabase)
// ============================================================
type DeliveryAgent = {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  bi_number: string;
  bi_file_url: string | null;
  photo_url: string | null;
  vehicle: string | null;
  vehicle_plate: string | null;
  status: string;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  active_order_id: string | null;
  total_deliveries: number;
  rating: number;
  created_at: string;
  updated_at: string;
};

type AgentForm = {
  full_name: string;
  phone: string;
  email: string;
  bi_number: string;
  vehicle: string;
  vehicle_plate: string;
  status: string;
};

// ============================================================
// CONFIG
// ============================================================
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Disponível', color: 'bg-green-100 text-green-700' },
  busy: { label: 'Ocupado', color: 'bg-orange-100 text-orange-700' },
  offline: { label: 'Offline', color: 'bg-gray-100 text-gray-500' },
};

const VEHICLE_OPTIONS = [
  { value: 'moto', label: 'Moto' },
  { value: 'carro', label: 'Carro' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'a_pé', label: 'A pé' },
];

// ============================================================
// COMPONENTE
// ============================================================
export default function AdminDeliveryPage() {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AgentForm>({
    full_name: '',
    phone: '',
    email: '',
    bi_number: '',
    vehicle: 'moto',
    vehicle_plate: '',
    status: 'active',
  });

  const ITEMS_PER_PAGE = 10;

  // ============================================================
  // BUSCAR ENTREGADORES
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchAgents = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('delivery_agents')
          .select('*', { count: 'exact' });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        if (searchTerm) {
          query = query.or(
            `full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,vehicle_plate.ilike.%${searchTerm}%`
          );
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!cancelled) {
          setAgents(data || []);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        }
      } catch (error) {
        console.error('Erro ao buscar entregadores:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAgents();

    return () => {
      cancelled = true;
    };
  }, [currentPage, statusFilter, searchTerm, refreshKey]);

  // ============================================================
  // ABRIR MODAIS
  // ============================================================
  const openCreateModal = () => {
    setEditingAgent(null);
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      bi_number: '',
      vehicle: 'moto',
      vehicle_plate: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const openEditModal = (agent: DeliveryAgent) => {
    setEditingAgent(agent);
    setFormData({
      full_name: agent.full_name || '',
      phone: agent.phone || '',
      email: agent.email || '',
      bi_number: agent.bi_number || '',
      vehicle: agent.vehicle || 'moto',
      vehicle_plate: agent.vehicle_plate || '',
      status: agent.status || 'active',
    });
    setShowModal(true);
  };

  // ============================================================
  // SALVAR
  // ============================================================
  const handleSave = async () => {
    if (
      !formData.full_name.trim() ||
      !formData.phone.trim() ||
      !formData.bi_number.trim()
    ) {
      alert('Por favor, preencha nome, telefone e número do BI');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        bi_number: formData.bi_number.trim(),
        vehicle: formData.vehicle || null,
        vehicle_plate: formData.vehicle_plate.trim() || null,
        status: formData.status || 'active',
        is_available: formData.status === 'active',
        updated_at: new Date().toISOString(),
      };

      if (editingAgent) {
        const { error } = await supabase
          .from('delivery_agents')
          .update(payload)
          .eq('id', editingAgent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('delivery_agents')
          .insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      setRefreshKey((prev) => prev + 1);
      alert(
        editingAgent
          ? '✅ Entregador atualizado!'
          : '✅ Entregador criado!'
      );
    } catch (error) {
      console.error('Erro ao salvar entregador:', error);
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar entregador';
      alert(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETAR
  // ============================================================
  const handleDelete = async (agent: DeliveryAgent) => {
    if (!confirm(`Excluir o entregador "${agent.full_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('delivery_agents')
        .delete()
        .eq('id', agent.id);
      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
      alert('✅ Entregador excluído!');
    } catch (error) {
      console.error('Erro ao excluir entregador:', error);
      alert('❌ Erro ao excluir entregador');
    }
  };

  // ============================================================
  // FORMATADORES
  // ============================================================
  const getStatusBadge = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  };

  const getVehicleLabel = (value: string | null) => {
    const vehicle = VEHICLE_OPTIONS.find((v) => v.value === value);
    return vehicle?.label || value || 'N/A';
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">
            Carregando entregadores...
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
            <Truck className="w-8 h-8" />
            Entregadores
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie a equipe de entregadores
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Novo Entregador
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou placa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Disponível</option>
            <option value="busy">Ocupado</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entregador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veículo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((agent) => {
                const statusBadge = getStatusBadge(agent.status);
                return (
                  <tr key={agent.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {agent.photo_url ? (
                          <Image
                            src={agent.photo_url}
                            alt={agent.full_name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#f0f4f0] rounded-full flex items-center justify-center text-sm font-bold text-[#2d6a4f]">
                            {agent.full_name?.[0]?.toUpperCase() || 'E'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {agent.full_name}
                          </p>
                          {agent.vehicle_plate && (
                            <p className="text-xs text-gray-400 font-mono">
                              {agent.vehicle_plate}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {agent.phone || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getVehicleLabel(agent.vehicle)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-[#2d6a4f]" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {agents.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛵</div>
            <p className="text-gray-500">Nenhum entregador encontrado</p>
            <button
              onClick={openCreateModal}
              className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition"
            >
              Adicionar Entregador
            </button>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
                <Truck className="w-6 h-6" />
                {editingAgent ? 'Editar Entregador' : 'Novo Entregador'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  placeholder="Ex: Maurício Gingi"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="+244 9XX XXX XXX"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="entregador@exemplo.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              {/* BI Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do BI *
                </label>
                <input
                  type="text"
                  value={formData.bi_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bi_number: e.target.value,
                    }))
                  }
                  placeholder="Ex: 000000000LA000"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              {/* Veículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veículo
                </label>
                <select
                  value={formData.vehicle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehicle: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                >
                  {VEHICLE_OPTIONS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Placa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa do Veículo
                </label>
                <input
                  type="text"
                  value={formData.vehicle_plate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehicle_plate: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="LD-00-00-XX"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] font-mono"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, status: key }))
                      }
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                        formData.status === key
                          ? config.color
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {saving
                    ? 'Salvando...'
                    : editingAgent
                      ? 'Atualizar'
                      : 'Criar'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}