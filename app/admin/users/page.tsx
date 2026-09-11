// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Users,
  Search,
  User as UserIcon,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle,
  Filter,
  Download,
  Edit,
  ShoppingBag,
  Activity,
  X,
  DollarSign,
} from 'lucide-react';

type User = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  neighborhood: string;
  role: 'customer' | 'admin' | 'manager' | 'delivery' | 'suspended';
  created_at: string;
  updated_at: string;
  avatar_url: string;
  order_count?: number;
  total_spent?: number;
  last_order?: string;
  status?: 'active' | 'inactive' | 'suspended';
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  neighborhood: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
};

type OrderRow = {
  client_id: string;
  total_amount: number | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const ITEMS_PER_PAGE = 10;

  // ============================================================
  // BUSCAR USUÁRIOS
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        if (roleFilter !== 'all') {
          query = query.eq('role', roleFilter);
        }

        if (searchTerm) {
          query = query.or(
            `full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`
          );
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data: profilesData, error, count } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const userIds = profilesData?.map((p) => p.id) || [];
        let usersWithEmail: User[] = [];

        if (userIds.length > 0) {
          const { data: authUsers } = await supabase
            .from('users')
            .select('id, email')
            .in('id', userIds);

          const { data: orders } = await supabase
            .from('orders')
            .select('client_id, total_amount')
            .in('client_id', userIds);

          const orderStats: Record<string, { count: number; total: number }> = {};
          (orders as OrderRow[] | null)?.forEach((order) => {
            if (!orderStats[order.client_id]) {
              orderStats[order.client_id] = { count: 0, total: 0 };
            }
            orderStats[order.client_id].count += 1;
            orderStats[order.client_id].total += order.total_amount || 0;
          });

          usersWithEmail =
            (profilesData as ProfileRow[] | null)?.map((profile) => {
              const authUser = authUsers?.find((u) => u.id === profile.id);
              const stats = orderStats[profile.id] || { count: 0, total: 0 };
              return {
                id: profile.id,
                email: authUser?.email || 'Email não disponível',
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                address: profile.address || '',
                neighborhood: profile.neighborhood || '',
                role: (profile.role as User['role']) || 'customer',
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                avatar_url: profile.avatar_url || '',
                order_count: stats.count,
                total_spent: stats.total,
                status: 'active' as const,
              };
            }) || [];
        }

        if (!cancelled) {
          setUsers(usersWithEmail);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [currentPage, roleFilter, searchTerm, refreshKey]);

  // ============================================================
  // ATUALIZAR FUNÇÃO DO USUÁRIO
  // ============================================================
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
      alert('✅ Função do usuário atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      alert('❌ Erro ao atualizar função');
    }
  };

  // ============================================================
  // ATIVAR/SUSPENDER USUÁRIO
  // ============================================================
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    if (
      !confirm(
        `Deseja ${newStatus === 'active' ? 'ativar' : 'suspender'} este usuário?`
      )
    )
      return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newStatus === 'active' ? 'customer' : 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
      alert(`✅ Usuário ${newStatus === 'active' ? 'ativado' : 'suspenso'}!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('❌ Erro ao atualizar status');
    }
  };

  // ============================================================
  // FORÇAR REFRESH MANUAL (botão Filtrar)
  // ============================================================
  const refetchUsers = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // ============================================================
  // FORMATADORES
  // ============================================================
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
      manager: { label: 'Gestor', color: 'bg-blue-100 text-blue-700' },
      delivery: { label: 'Entregador', color: 'bg-orange-100 text-orange-700' },
      customer: { label: 'Cliente', color: 'bg-green-100 text-green-700' },
      suspended: { label: 'Suspenso', color: 'bg-red-100 text-red-700' },
    };
    return badges[role] || badges.customer;
  };

  const getStatusBadge = (status: string) => {
    if (
      status === 'active' ||
      status === 'customer' ||
      status === 'admin' ||
      status === 'delivery'
    ) {
      return { label: 'Ativo', color: 'bg-green-100 text-green-700' };
    }
    return { label: 'Inativo', color: 'bg-gray-100 text-gray-500' };
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
            Carregando usuários...
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
            <Users className="w-8 h-8" />
            Clientes
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todas as Funções</option>
            <option value="admin">Admin</option>
            <option value="manager">Gestor</option>
            <option value="delivery">Entregador</option>
            <option value="customer">Cliente</option>
          </select>
          <button
            onClick={refetchUsers}
            className="px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gasto
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
              {users.map((user) => {
                const roleBadge = getRoleBadge(user.role || 'customer');
                const statusBadge = getStatusBadge(user.status || 'active');
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f0f4f0] rounded-full flex items-center justify-center text-sm font-bold text-[#2d6a4f]">
                          {user.full_name?.[0]?.toUpperCase() ||
                            user.email?.[0]?.toUpperCase() ||
                            'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.full_name || 'Sem nome'}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone || '-'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.address || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}
                      >
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">
                      {user.order_count || 0}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#2d6a4f]">
                      {user.total_spent ? formatCurrency(user.total_spent) : '-'}
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
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        <select
                          value={user.role || 'customer'}
                          onChange={(e) =>
                            updateUserRole(user.id, e.target.value)
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                        >
                          <option value="customer">Cliente</option>
                          <option value="delivery">Entregador</option>
                          <option value="manager">Gestor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() =>
                            toggleUserStatus(user.id, user.status || 'active')
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title={
                            user.status === 'active' ? 'Suspender' : 'Ativar'
                          }
                        >
                          {user.status === 'active' ? (
                            <Ban className="w-4 h-4 text-orange-400 hover:text-orange-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400 hover:text-green-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-gray-500">Nenhum usuário encontrado</p>
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
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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

      {/* Modal de Detalhes do Usuário */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
                <UserIcon className="w-6 h-6" />
                Detalhes do Usuário
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Cabeçalho do Perfil */}
              <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-[#2d6a4f] rounded-full flex items-center justify-center text-3xl text-white font-bold">
                  {selectedUser.full_name?.[0]?.toUpperCase() ||
                    selectedUser.email?.[0]?.toUpperCase() ||
                    'U'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedUser.full_name || 'Sem nome'}
                  </h3>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedUser.role || 'customer').color}`}
                    >
                      {getRoleBadge(selectedUser.role || 'customer').label}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedUser.status || 'active').color}`}
                    >
                      {getStatusBadge(selectedUser.status || 'active').label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">
                    {selectedUser.phone || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cadastro</p>
                  <p className="font-medium">
                    {formatDate(selectedUser.created_at)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium">
                    {selectedUser.address || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bairro</p>
                  <p className="font-medium">
                    {selectedUser.neighborhood || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Última atualização</p>
                  <p className="font-medium">
                    {formatDate(selectedUser.updated_at)}
                  </p>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center p-4 bg-[#f8f6f4] rounded-xl">
                  <ShoppingBag className="w-6 h-6 mx-auto text-[#2d6a4f]" />
                  <p className="text-2xl font-bold text-gray-800">
                    {selectedUser.order_count || 0}
                  </p>
                  <p className="text-xs text-gray-500">Pedidos</p>
                </div>
                <div className="text-center p-4 bg-[#f8f6f4] rounded-xl">
                  <DollarSign className="w-6 h-6 mx-auto text-[#2d6a4f]" />
                  <p className="text-2xl font-bold text-[#2d6a4f]">
                    {selectedUser.total_spent
                      ? formatCurrency(selectedUser.total_spent)
                      : '-'}
                  </p>
                  <p className="text-xs text-gray-500">Total Gasto</p>
                </div>
                <div className="text-center p-4 bg-[#f8f6f4] rounded-xl">
                  <Activity className="w-6 h-6 mx-auto text-[#2d6a4f]" />
                  <p className="text-2xl font-bold text-gray-800">-</p>
                  <p className="text-xs text-gray-500">Última Compra</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
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
                    toggleUserStatus(
                      selectedUser.id,
                      selectedUser.status || 'active'
                    );
                  }}
                  className="flex-1 py-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition font-medium flex items-center justify-center gap-2"
                >
                  {selectedUser.status === 'active' ? (
                    <>
                      <Ban className="w-4 h-4" />
                      Suspender
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Ativar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}