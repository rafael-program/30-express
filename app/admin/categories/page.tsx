// app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  FolderOpen,
  Package,
  TrendingUp,
  Eye,
  Save,
  FolderPlus
} from 'lucide-react';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  product_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Categorias pré-definidas com ícones
const DEFAULT_CATEGORIES = [
  { name: 'Carnes', icon: '🥩', color: 'bg-red-100 text-red-700' },
  { name: 'Verduras', icon: '🥬', color: 'bg-green-100 text-green-700' },
  { name: 'Frutas', icon: '🍎', color: 'bg-orange-100 text-orange-700' },
  { name: 'Chás', icon: '🍵', color: 'bg-amber-100 text-amber-700' },
  { name: 'Legumes', icon: '🥕', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Laticínios', icon: '🧀', color: 'bg-blue-100 text-blue-700' },
  { name: 'Ovos', icon: '🥚', color: 'bg-rose-100 text-rose-700' },
  { name: 'Mercearia', icon: '🧂', color: 'bg-gray-100 text-gray-700' },
  { name: 'Padaria', icon: '🍞', color: 'bg-amber-100 text-amber-700' },
  { name: 'Bebidas', icon: '🧃', color: 'bg-sky-100 text-sky-700' },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦',
    color: 'bg-gray-100 text-gray-700',
    is_active: true
  });

  const ITEMS_PER_PAGE = 10;

  // Lista de ícones disponíveis
  const availableIcons = [
    '🥩', '🥬', '🍎', '🍵', '🥕', '🧀', '🥚', '🧂', '🍞', '🧃',
    '🍗', '🥑', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🥝', '🍅', '🫑', '🥒', '🥬', '🥦', '🧅', '🧄', '🥔', '🍠',
    '🌽', '🥕', '🥗', '🍲', '🥘', '🍳', '🧇', '🥞', '🧈', '🧊',
    '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁', '🥧', '🍫', '🍬',
  ];

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('categories')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order('name', { ascending: true });

      if (error) throw error;

      // Se não houver categorias, criar as padrão
      if (!data || data.length === 0) {
        await createDefaultCategories();
        // Recarregar após criar
        const { data: newData } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        setCategories(newData || []);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      } else {
        setCategories(data || []);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultCategories = async () => {
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await supabase
          .from('categories')
          .insert({
            name: cat.name,
            slug: cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-'),
            icon: cat.icon,
            color: cat.color,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Erro ao criar categorias padrão:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-');

      const categoryData = {
        name: formData.name,
        slug: slug,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        alert('✅ Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            ...categoryData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        alert('✅ Categoria criada com sucesso!');
      }

      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error('Erro:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
      alert('✅ Categoria excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('❌ Erro ao excluir categoria');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('❌ Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📦',
      color: 'bg-gray-100 text-gray-700',
      is_active: true
    });
    setEditingCategory(null);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📦',
      color: category.color || 'bg-gray-100 text-gray-700',
      is_active: category.is_active !== false
    });
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando categorias...</p>
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
            <Tag className="w-8 h-8" />
            Categorias
          </h1>
          <p className="text-gray-500 mt-1">Gerencie as categorias de produtos</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <button
            onClick={fetchCategories}
            className="px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Lista de Categorias */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produtos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${category.color || 'bg-gray-100'}`}>
                        {category.icon || '📦'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">{category.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      <Package className="w-3 h-3" />
                      {category.product_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(category.id, category.is_active !== false)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                        category.is_active !== false
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {category.is_active !== false ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(category.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏷️</div>
            <p className="text-gray-500">Nenhuma categoria cadastrada</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition"
            >
              Criar primeira categoria
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

      {/* Modal de Criar/Editar Categoria */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f]">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  placeholder="Ex: Carnes, Frutas, Bebidas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  placeholder="Descrição da categoria (opcional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-xl max-h-32 overflow-y-auto">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 text-2xl rounded-lg transition ${
                          formData.icon === icon
                            ? 'bg-[#2d6a4f] text-white scale-110'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'bg-red-100 text-red-700',
                      'bg-green-100 text-green-700',
                      'bg-orange-100 text-orange-700',
                      'bg-amber-100 text-amber-700',
                      'bg-yellow-100 text-yellow-700',
                      'bg-blue-100 text-blue-700',
                      'bg-rose-100 text-rose-700',
                      'bg-gray-100 text-gray-700',
                      'bg-sky-100 text-sky-700',
                      'bg-purple-100 text-purple-700',
                      'bg-pink-100 text-pink-700',
                      'bg-indigo-100 text-indigo-700',
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 transition ${
                          formData.color === color
                            ? 'border-[#2d6a4f] scale-110'
                            : 'border-transparent'
                        }`}
                      >
                        <div className={`w-full h-full rounded-full ${color.split(' ')[0]}`}></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#2d6a4f] rounded focus:ring-[#2d6a4f]"
                  />
                  <span className="text-sm text-gray-700">Categoria ativa</span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-medium">💡 Informação</p>
                <p className="mt-1">Categorias inativas não aparecem na vitrine da loja.</p>
                <p className="mt-1 text-xs">Slug gerado automaticamente: <strong>{formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : '...'}</strong></p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    editingCategory ? 'Atualizar' : 'Criar Categoria'
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
    </div>
  );
}