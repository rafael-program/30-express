// app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Palette,
  TrendingUp,
  FolderOpen,
  Eye,
  EyeOff,
  Package,
  Sparkles,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
};

// ============================================================
// CONFIG
// ============================================================
const COLOR_OPTIONS = [
  { value: '#52b788', label: 'Verde' },
  { value: '#f4a261', label: 'Laranja' },
  { value: '#e76f51', label: 'Vermelho' },
  { value: '#2a9d8f', label: 'Turquesa' },
  { value: '#e9c46a', label: 'Amarelo' },
  { value: '#8ecae6', label: 'Azul' },
  { value: '#b5838d', label: 'Rosa' },
  { value: '#6d6875', label: 'Cinza' },
];

const EMOJI_OPTIONS = [
  '🍎', '🥩', '🥛', '🍞', '🥫', '🥤', '🧴', '🧼', '🍕', '🥗',
  '🍷', '🍫', '🧀', '🥚', '🐟', '🌽', '🍌', '🍇', '🥕', '🍞',
  '🥥', '🍊', '🍋', '🥬', '🍅', '🧅', '🧄', '🥔', '🍠', '🥦',
  '🍗', '🥓', '🧆', '🍤', '🦐', '🦀', '🐔', '🐄', '🐖', '🐑',
];

// ============================================================
// COMPONENTE
// ============================================================
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    totalProducts: 0,
  });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    slug: '',
    description: '',
    icon: '📁',
    color: '#52b788',
  });

  const ITEMS_PER_PAGE = 10;

  // ============================================================
  // BUSCAR CATEGORIAS
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('categories')
          .select('*', { count: 'exact' });

        if (searchTerm) {
          query = query.or(
            `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await query
          .range(from, to)
          .order('name', { ascending: true });

        if (error) throw error;

        // Buscar todas para as estatísticas
        const { data: allCategories } = await supabase
          .from('categories')
          .select('is_active, product_count');

        const counts = { active: 0, inactive: 0, totalProducts: 0 };
        allCategories?.forEach((c) => {
          if (c.is_active) counts.active++;
          else counts.inactive++;
          counts.totalProducts += c.product_count || 0;
        });

        if (!cancelled) {
          setCategories(data || []);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
          setTotalCount(count || 0);
          setStatusCounts(counts);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce da busca
    const timer = setTimeout(fetchCategories, searchTerm ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentPage, searchTerm, refreshKey]);

  // ============================================================
  // ABRIR MODAIS
  // ============================================================
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '📁',
      color: '#52b788',
    });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      icon: category.icon || '📁',
      color: category.color || '#52b788',
    });
    setShowModal(true);
  };

  // ============================================================
  // GERAR SLUG
  // ============================================================
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  // ============================================================
  // SALVAR
  // ============================================================
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Por favor, preencha o nome da categoria');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description.trim() || null,
        icon: formData.icon || '📁',
        color: formData.color || '#52b788',
        updated_at: new Date().toISOString(),
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      setRefreshKey((prev) => prev + 1);
      alert(
        editingCategory
          ? '✅ Categoria atualizada!'
          : '✅ Categoria criada!'
      );
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar categoria';
      alert(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TOGGLE ATIVO
  // ============================================================
  const toggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', category.id);
      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('❌ Erro ao atualizar status');
    }
  };

  // ============================================================
  // DELETAR
  // ============================================================
  const handleDelete = async (category: Category) => {
    if (category.product_count && category.product_count > 0) {
      alert(
        `❌ Não é possível excluir. Existem ${category.product_count} produtos nesta categoria.`
      );
      return;
    }

    if (!confirm(`Excluir a categoria "${category.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);
      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
      alert('✅ Categoria excluída!');
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      alert('❌ Erro ao excluir categoria');
    }
  };

  // ============================================================
  // LOADING SKELETON
  // ============================================================
  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm"></div>
          ))}
        </div>
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
              <FolderTree className="w-7 h-7 text-white" />
            </div>
            Categorias
          </h1>
          <p className="text-gray-500 mt-2 ml-1">
            Organize os produtos e defina a identidade visual
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="group px-5 py-3 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Nova Categoria
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalCount}</p>
          <p className="text-sm text-gray-500 mt-1">Total de Categorias</p>
        </div>

        {/* Ativas */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {statusCounts.active}
          </p>
          <p className="text-sm text-gray-500 mt-1">Categorias Ativas</p>
        </div>

        {/* Inativas */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
              <EyeOff className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-500">
            {statusCounts.inactive}
          </p>
          <p className="text-sm text-gray-500 mt-1">Inativas</p>
        </div>

        {/* Produtos */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md p-5 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {statusCounts.totalProducts}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total de Produtos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#f8f6f4] to-[#faf8f5] border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Produtos
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
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-[#f8f6f4]/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                        style={{
                          backgroundColor: category.color
                            ? `${category.color}20`
                            : '#f0f4f0',
                        }}
                      >
                        {category.icon || '📁'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          category.product_count > 0
                            ? 'bg-[#f0f4f0] text-[#2d6a4f]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {category.product_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(category)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${
                        category.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                      title="Clique para alternar"
                    >
                      {category.is_active ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          Inativa
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 hover:bg-[#2d6a4f]/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-400 hover:text-[#2d6a4f]" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {categories.length === 0 && !loading && (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#f0f4f0] to-[#e8efe9] rounded-full flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-[#2d6a4f]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando a primeira categoria de produtos'}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Categoria
            </button>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-[#f8f6f4]/30">
            <div className="text-sm text-gray-500">
              Página{' '}
              <span className="font-semibold text-gray-800">
                {currentPage}
              </span>{' '}
              de{' '}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-[#f8f6f4] to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2d6a4f] to-[#40916c] rounded-2xl flex items-center justify-center shadow-md">
                  <FolderTree className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingCategory
                      ? 'Atualize as informações'
                      : 'Defina a identidade visual da categoria'}
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
              {/* Preview ao vivo */}
              <div className="p-4 bg-gradient-to-br from-[#f8f6f4] to-[#faf8f5] rounded-2xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Pré-visualização
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md transition-all"
                    style={{
                      backgroundColor: formData.color
                        ? `${formData.color}25`
                        : '#f0f4f0',
                    }}
                  >
                    {formData.icon || '📁'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">
                      {formData.name || 'Nome da categoria'}
                    </p>
                    <code className="text-xs text-gray-400 font-mono">
                      {formData.slug || 'slug-da-categoria'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Frutas e Vegetais"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value,
                    }))
                  }
                  placeholder="frutas-e-vegetais"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all font-mono text-sm"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Breve descrição da categoria..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Ícone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ícone
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, icon: emoji }))
                      }
                      className={`w-10 h-10 rounded-lg text-xl transition-all ${
                        formData.icon === emoji
                          ? 'bg-[#2d6a4f] ring-2 ring-[#2d6a4f] scale-110 shadow-md'
                          : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Cor da Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          color: color.value,
                        }))
                      }
                      className={`w-10 h-10 rounded-full transition-all ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-[#2d6a4f] scale-110 shadow-md'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
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
                    <Check className="w-4 h-4" />
                    {editingCategory ? 'Atualizar' : 'Criar Categoria'}
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