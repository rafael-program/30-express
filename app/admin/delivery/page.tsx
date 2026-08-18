// app/admin/delivery/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Truck,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Star,
  Eye,
  User,
  Key,
  EyeOff
} from 'lucide-react';

type DeliveryAgent = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  bi_number: string;
  bi_file_url: string;
  photo_url: string;
  vehicle: string;
  vehicle_plate: string;
  status: 'active' | 'inactive' | 'suspended';
  is_available: boolean;
  total_deliveries: number;
  rating: number;
  created_at: string;
  updated_at: string;
};

export default function AdminDeliveryPage() {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    bi_number: '',
    vehicle: '',
    vehicle_plate: '',
    status: 'active'
  });
  const [uploading, setUploading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchAgents();
  }, [currentPage, statusFilter, searchTerm]);

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
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,bi_number.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAgents(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Erro ao buscar entregadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // 🔥 1. Criar usuário no Auth
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        user_metadata: {
          full_name: formData.full_name,
          role: 'delivery'
        }
      });

      if (userError) {
        console.error('❌ Erro ao criar usuário:', userError);
        alert(`Erro ao criar usuário: ${userError.message}`);
        setUploading(false);
        return;
      }

      console.log('✅ Usuário criado:', userData);

      // 🔥 2. Criar perfil do entregador
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userData.user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          role: 'delivery'
        });

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        alert(`Erro ao criar perfil: ${profileError.message}`);
        setUploading(false);
        return;
      }

      // 🔥 3. Criar entregador
      const agentData = {
        user_id: userData.user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        bi_number: formData.bi_number,
        vehicle: formData.vehicle || '',
        vehicle_plate: formData.vehicle_plate || '',
        status: formData.status,
        is_available: true,
        total_deliveries: 0,
        rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📤 Criando entregador:', agentData);

      const { data, error } = await supabase
        .from('delivery_agents')
        .insert([agentData])
        .select();

      if (error) {
        console.error('❌ Erro ao criar entregador:', error);
        alert(`Erro ao criar entregador: ${error.message}`);
        setUploading(false);
        return;
      }

      console.log('✅ Entregador criado:', data);
      alert('✅ Entregador criado com sucesso!\n\nCredenciais:\nEmail: ' + formData.email + '\nSenha: ' + formData.password);
      setShowModal(false);
      resetForm();
      fetchAgents();

    } catch (error: any) {
      console.error('Erro ao criar entregador:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('delivery_agents')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      fetchAgents();
      alert('✅ Status atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('❌ Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este entregador?')) return;

    try {
      const { error } = await supabase
        .from('delivery_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAgents();
      alert('✅ Entregador excluído!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('❌ Erro ao excluir entregador');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      password: '',
      bi_number: '',
      vehicle: '',
      vehicle_plate: '',
      status: 'active'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      suspended: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: CheckCircle,
      inactive: XCircle,
      suspended: AlertCircle
    };
    return icons[status as keyof typeof icons] || XCircle;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando entregadores...</p>
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
            <Truck className="w-8 h-8" />
            Entregadores
          </h1>
          <p className="text-gray-500 mt-1">Gerencie sua equipe de entregadores</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <UserPlus className="w-5 h-5" />
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
              placeholder="Buscar por nome, telefone ou BI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="suspended">Suspensos</option>
          </select>
          <button
            onClick={fetchAgents}
            className="px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Lista de Entregadores */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avaliação</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((agent) => {
                const StatusIcon = getStatusIcon(agent.status);
                return (
                  <tr key={agent.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#f0f4f0] rounded-full overflow-hidden flex-shrink-0">
                          {agent.photo_url ? (
                            <img
                              src={agent.photo_url}
                              alt={agent.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-[#2d6a4f] text-white font-bold">
                              {agent.full_name[0]?.toUpperCase() || 'E'}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{agent.full_name}</p>
                          <p className="text-sm text-gray-500">BI: {agent.bi_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {agent.phone}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {agent.email || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">{agent.vehicle || '-'}</p>
                        <p className="text-xs text-gray-400">{agent.vehicle_plate || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {getStatusLabel(agent.status)}
                        </span>
                        {agent.is_available && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Disponível
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">
                      {agent.total_deliveries || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#f4a261] text-[#f4a261]" />
                        <span className="font-medium">{agent.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        {agent.bi_file_url && (
                          <a
                            href={agent.bi_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Ver BI"
                          >
                            <FileText className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        )}
                        <select
                          value={agent.status}
                          onChange={(e) => handleUpdateStatus(agent.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                        >
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                          <option value="suspended">Suspenso</option>
                        </select>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚚</div>
            <p className="text-gray-500">Nenhum entregador cadastrado</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition"
            >
              Cadastrar primeiro entregador
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criar Entregador */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f]">Novo Entregador</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    placeholder="+244 923 456 789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] pr-10"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do BI *</label>
                <input
                  type="text"
                  required
                  value={formData.bi_number}
                  onChange={(e) => setFormData({ ...formData, bi_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  placeholder="00000000AZ0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veículo</label>
                  <input
                    type="text"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    placeholder="Ex: Moto, Carro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                  <input
                    type="text"
                    value={formData.vehicle_plate}
                    onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                    placeholder="Ex: ABC-1234"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-medium">ℹ️ Informações de Acesso</p>
                <p className="mt-1">O entregador receberá um email com as credenciais de acesso.</p>
                <p className="mt-1 text-xs">Email: <strong>{formData.email || '...'}</strong> | Senha: <strong>{formData.password ? '••••••' : '...'}</strong></p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Criando...
                    </>
                  ) : (
                    'Criar Entregador'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
                <User className="w-6 h-6" />
                Detalhes do Entregador
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-[#f0f4f0] rounded-full overflow-hidden">
                  {selectedAgent.photo_url ? (
                    <img
                      src={selectedAgent.photo_url}
                      alt={selectedAgent.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-[#2d6a4f] text-white font-bold">
                      {selectedAgent.full_name[0]?.toUpperCase() || 'E'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedAgent.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAgent.status)}`}>
                      {getStatusLabel(selectedAgent.status)}
                    </span>
                    {selectedAgent.is_available && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Disponível
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{selectedAgent.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedAgent.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">BI</p>
                  <p className="font-medium">{selectedAgent.bi_number}</p>
                  {selectedAgent.bi_file_url && (
                    <a
                      href={selectedAgent.bi_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#2d6a4f] hover:text-[#a7c957] transition flex items-center gap-1 mt-1"
                    >
                      <FileText className="w-3 h-3" />
                      Ver PDF
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Cadastro</p>
                  <p className="font-medium">{formatDate(selectedAgent.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Veículo</p>
                  <p className="font-medium">{selectedAgent.vehicle || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Placa</p>
                  <p className="font-medium">{selectedAgent.vehicle_plate || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de Entregas</p>
                  <p className="font-medium">{selectedAgent.total_deliveries || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avaliação</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#f4a261] text-[#f4a261]" />
                    <span className="font-medium">{selectedAgent.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    // Implementar edição
                    alert('Funcionalidade em desenvolvimento');
                  }}
                  className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleDelete(selectedAgent.id);
                  }}
                  className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}