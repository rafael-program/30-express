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
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  product_count?: number;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
};

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

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
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
          query = query.ilike('name', `%${searchTerm}%`);
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await query
          .range(from, to)
          .order('name', { ascending: true });

        if (error) throw error;

        // Buscar contagem de produtos por categoria
        const categoryIds = (data || []).map((c) => c.id);
        const productCountMap: Record<string, number> = {};

        if (categoryIds.length > 0) {
          const { data: productsData } = await supabase
            .from('products')
            .select('category_id')
            .in('category_id', categoryIds);

          productsData?.forEach((p) => {
            if (p.category_id) {
              productCountMap[p.category_id] =
                (productCountMap[p.category_id] || 0) + 1;
            }
          });
        }

        const enrichedCategories: Category[] = (data || []).map((cat) => ({
          ...cat,
          product_count: productCountMap[cat.id] || 0,
        }));

        if (!cancelled) {
          setCategories(enrichedCategories);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [currentPage, searchTerm, refreshKey]);

  // ============================================================
  // ABRIR MODAL DE CRIAÇÃO
  // ============================================================
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
    });
    setShowModal(true);
  };

  // ============================================================
  // ABRIR MODAL DE EDIÇÃO
  // ============================================================
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      image_url: category.image_url || '',
    });
    setShowModal(true);
  };

  // ============================================================
  // GERAR SLUG AUTOMATICAMENTE
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
  // SALVAR (CRIAR OU EDITAR)
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
        image_url: formData.image_url.trim() || null,
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
      alert('❌ Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETAR CATEGORIA
  // ============================================================
  const handleDelete = async (category: Category) => {
    if (category.product_count && category.product_count > 0) {
      alert(
        `❌ Não é possível excluir. Existem ${category.product_count} produtos associados a esta categoria.`
      );
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja excluir a categoria "${category.name}"?`
      )
    )
      return;

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
  // LOADING
  // ============================================================
  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">
            Carregando categorias...
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
            <FolderTree className="w-8 h-8" />
            Categorias
          </h1>
          <p className="text-gray-500 mt-1">
            Organize os produtos em categorias
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produtos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {category.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#f0f4f0] rounded-lg flex items-center justify-center text-lg">
                          📁
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">
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
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                    {category.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        category.product_count && category.product_count > 0
                          ? 'bg-[#f0f4f0] text-[#2d6a4f]'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {category.product_count || 0} produto
                      {category.product_count !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-400 hover:text-[#2d6a4f]" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-500">Nenhuma categoria encontrada</p>
            <button
              onClick={openCreateModal}
              className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition"
            >
              Criar Primeira Categoria
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f]">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Frutas e Vegetais"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] font-mono text-sm"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
                />
              </div>

              {/* URL da Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      image_url: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] text-sm"
                />
              </div>

              {/* Preview da imagem */}
              {formData.image_url && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {saving
                    ? 'Salvando...'
                    : editingCategory
                      ? 'Atualizar'
                      : 'Criar'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium disabled:opacity-50"
                >
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