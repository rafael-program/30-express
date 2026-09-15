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
  UserPlus,
  Phone,
  CheckCircle,
  XCircle,
  Mail,
  IdCard,
  Bike,
  Car,
  Footprints,
  MoreVertical,
  TrendingUp,
  Users,
  CircleDot,
  Clock,
  Zap,
} from 'lucide-react';

// ============================================================
// TIPOS
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
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string; icon: typeof CircleDot }
> = {
  active: {
    label: 'Disponível',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
  },
  busy: {
    label: 'Ocupado',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  offline: {
    label: 'Offline',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
    icon: CircleDot,
  },
};

const VEHICLE_OPTIONS = [
  { value: 'moto', label: 'Moto', icon: Bike },
  { value: 'carro', label: 'Carro', icon: Car },
  { value: 'bicicleta', label: 'Bicicleta', icon: Bike },
  { value: 'a_pé', label: 'A pé', icon: Footprints },
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
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    busy: 0,
    offline: 0,
  });

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
        // Query principal
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

        // Contagens de status (sem filtro)
        const { data: allAgents } = await supabase
          .from('delivery_agents')
          .select('status');

        const counts = { active: 0, busy: 0, offline: 0 };
        allAgents?.forEach((a) => {
          if (a.status in counts) {
            counts[a.status as keyof typeof counts]++;
          }
        });

        if (!cancelled) {
          setAgents(data || []);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
          setTotalCount(count || 0);
          setStatusCounts(counts);
        }
      } catch (error) {
        console.error('Erro ao buscar entregadores:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce da busca (300ms)
    const timer = setTimeout(fetchAgents, searchTerm ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
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
  // TOGGLE STATUS RÁPIDO (na tabela)
  // ============================================================
  const toggleStatusQuick = async (agent: DeliveryAgent) => {
    const nextStatus =
      agent.status === 'active'
        ? 'busy'
        : agent.status === 'busy'
          ? 'offline'
          : 'active';

    try {
      const { error } = await supabase
        .from('delivery_agents')
        .update({
          status: nextStatus,
          is_available: nextStatus === 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agent.id);

      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('❌ Erro ao atualizar status');
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

  const getVehicleIcon = (value: string | null) => {
    const vehicle = VEHICLE_OPTIONS.find((v) => v.value === value);
    return vehicle?.icon || Truck;
  };

  // ============================================================
  // LOADING SKELETON
  // ============================================================
  if (loading && agents.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm"></div>
          ))}
        </div>

        {/* Tabela skeleton */}
        <div className="h-96 bg-white rounded-2xl shadow-sm"></div>
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
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-2xl flex items-center justify-center shadow-lg">
              <Truck className="w-7 h-7 text-white" />
            </div>
            Entregadores
          </h1>
          <p className="text-gray-500 mt-2 ml-1">
            Gerencie a equipe e acompanhe o desempenho em tempo real
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="group px-5 py-3 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 font-medium"
        >
          <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Novo Entregador
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalCount}</p>
          <p className="text-sm text-gray-500 mt-1">Total de Entregadores</p>
        </div>

        {/* Disponíveis */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {statusCounts.active}
          </p>
          <p className="text-sm text-gray-500 mt-1">Disponíveis</p>
        </div>

        {/* Ocupados */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <Zap className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {statusCounts.busy}
          </p>
          <p className="text-sm text-gray-500 mt-1">Ocupados</p>
        </div>

        {/* Offline */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
              <CircleDot className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-500">
            {statusCounts.offline}
          </p>
          <p className="text-sm text-gray-500 mt-1">Offline</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou placa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Disponível</option>
            <option value="busy">Ocupado</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#f8f6f4] to-[#faf8f5] border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Entregador
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Veículo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((agent) => {
                const statusBadge = getStatusBadge(agent.status);
                const StatusIcon = statusBadge.icon;
                const VehicleIcon = getVehicleIcon(agent.vehicle);

                return (
                  <tr
                    key={agent.id}
                    className="hover:bg-[#f8f6f4]/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {agent.photo_url ? (
                            <Image
                              src={agent.photo_url}
                              alt={agent.full_name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-full flex items-center justify-center text-white font-bold shadow-md">
                              {agent.full_name?.[0]?.toUpperCase() || 'E'}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${statusBadge.dot}`}
                          ></span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {agent.full_name}
                          </p>
                          {agent.vehicle_plate && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              {agent.vehicle_plate}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {agent.phone || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <VehicleIcon className="w-4 h-4 text-gray-400" />
                        {getVehicleLabel(agent.vehicle)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatusQuick(agent)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${statusBadge.color}`}
                        title="Clique para alternar"
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusBadge.label}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-2 hover:bg-[#2d6a4f]/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-[#2d6a4f]" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#f0f4f0] to-[#e8efe9] rounded-full flex items-center justify-center">
              <Truck className="w-10 h-10 text-[#2d6a4f]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Nenhum entregador encontrado
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando o primeiro entregador da equipe'}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Entregador
            </button>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-[#f8f6f4]/30">
            <div className="text-sm text-gray-500">
              Página <span className="font-semibold text-gray-800">{currentPage}</span> de{' '}
              <span className="font-semibold text-gray-800">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-[#f8f6f4] to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-2xl flex items-center justify-center shadow-md">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingAgent ? 'Editar Entregador' : 'Novo Entregador'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingAgent
                      ? 'Atualize as informações'
                      : 'Preencha os dados do novo entregador'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body do Modal */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email{' '}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* BI Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número do BI <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Grid: Veículo + Placa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all bg-white"
                  >
                    {VEHICLE_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Placa
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all font-mono uppercase"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isActive = formData.status === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, status: key }))
                        }
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                          isActive
                            ? `${config.color} border-current shadow-sm`
                            : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-100 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 border border-gray-200"
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {editingAgent ? 'Atualizar' : 'Criar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}