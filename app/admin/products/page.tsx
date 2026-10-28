// app/admin/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Box,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  category_id: string | null;
  category_name?: string;
  image_url: string | null;
  stock: number;
  weight: string | null;
  is_organic: boolean;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
};

type Category = {
  id: string;
  name: string;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category_id: string;
  stock: string;
  weight: string;
  image_url: string;
  is_organic: boolean;
};

// ============================================================
// COMPONENTE
// ============================================================
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
    weight: '',
    image_url: '',
    is_organic: false,
  });

  const ITEMS_PER_PAGE = 10;

  // ============================================================
  // BUSCAR CATEGORIAS E PRODUTOS
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Categorias
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
        if (cats) setCategories(cats);

        // 2. Produtos com filtros
        let query = supabase.from('products').select('*', { count: 'exact' });

        if (categoryFilter !== 'all') {
          query = query.eq('category_id', categoryFilter);
        }
        if (stockFilter === 'low') {
          query = query.lte('stock', 10).gt('stock', 0);
        } else if (stockFilter === 'out') {
          query = query.eq('stock', 0);
        } else if (stockFilter === 'available') {
          query = query.gt('stock', 0).eq('in_stock', true);
        }
        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 3. Estatísticas globais (sem filtros)
        const { data: allProducts } = await supabase
          .from('products')
          .select('stock, in_stock');

        const s = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
        allProducts?.forEach((p) => {
          s.total++;
          if (!p.in_stock || p.stock === 0) s.outOfStock++;
          else if (p.stock <= 10) s.lowStock++;
          else s.inStock++;
        });

        if (!cancelled) {
          // Mapear nome da categoria
          const catsMap: Record<string, string> = {};
          (cats || []).forEach((c) => (catsMap[c.id] = c.name));

          const enriched = (data || []).map((p) => ({
            ...p,
            category_name: p.category_id ? catsMap[p.category_id] : p.category,
          }));

          setProducts(enriched);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
          setStats(s);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, searchTerm ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentPage, categoryFilter, stockFilter, searchTerm, refreshKey]);

  // ============================================================
  // ABRIR MODAL
  // ============================================================
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      stock: '',
      weight: '',
      image_url: '',
      is_organic: false,
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      category_id: product.category_id || '',
      stock: product.stock?.toString() || '',
      weight: product.weight || '',
      image_url: product.image_url || '',
      is_organic: product.is_organic || false,
    });
    setShowModal(true);
  };

  // ============================================================
  // SALVAR (CRIAR / EDITAR)
  // ============================================================
  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        stock: parseInt(formData.stock) || 0,
        weight: formData.weight || null,
        image_url: formData.image_url || null,
        is_organic: formData.is_organic,
        in_stock: true,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      setRefreshKey((prev) => prev + 1);
      alert(
        editingProduct
          ? '✅ Produto atualizado!'
          : '✅ Produto criado com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('❌ Erro ao salvar produto (Verifique o RLS)');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETAR E TOGGLE
  // ============================================================
  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      alert('❌ Erro ao excluir produto');
    }
  };

  const toggleInStock = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('products')
        .update({
          in_stock: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      alert('❌ Erro ao atualizar status');
    }
  };

  // ============================================================
  // FORMATADORES
  // ============================================================
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);

  const getStockBadge = (stock: number, inStock: boolean) => {
    if (!inStock || stock === 0)
      return { label: 'Esgotado', color: 'bg-red-50 text-red-700 border-red-200' };
    if (stock <= 10)
      return { label: `Baixo (${stock})`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: `${stock} un`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // ============================================================
  // LOADING SKELETON
  // ============================================================
  if (loading && products.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
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
              <Package className="w-7 h-7 text-white" />
            </div>
            Produtos
          </h1>
          <p className="text-gray-500 mt-2 ml-1">
            Gerencie o catálogo de produtos do Mercado do 30
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="group px-5 py-3 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Novo Produto
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
              <Box className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total de Produtos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.inStock}</p>
          <p className="text-sm text-gray-500 mt-1">Bom Stock</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.lowStock}</p>
          <p className="text-sm text-gray-500 mt-1">Stock Baixo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
          <p className="text-sm text-gray-500 mt-1">Esgotados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todo o Stock</option>
            <option value="available">Disponível</option>
            <option value="low">Stock Baixo</option>
            <option value="out">Sem Stock</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#f8f6f4] to-[#faf8f5] border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Produto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Preço
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const badge = getStockBadge(product.stock, product.in_stock);
                return (
                  <tr
                    key={product.id}
                    className="hover:bg-[#f8f6f4]/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {product.image_url ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800 flex items-center gap-2">
                            {product.name}
                            {product.is_organic && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                🌿 Orgânico
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {product.weight || 'sem peso'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                        {product.category_name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#2d6a4f]">
                        {formatCurrency(product.price)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 hover:bg-[#2d6a4f]/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-[#2d6a4f]" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
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

        {products.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition"
            >
              Cadastrar Produto
            </button>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50/30">
            <span className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg disabled:opacity-50"
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
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#f8f6f4] to-white">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2d6a4f]" />
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f] outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preço (Kz) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f] outline-none bg-white"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Peso / Unidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1 kg"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f] outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f] outline-none"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={formData.is_organic}
                    onChange={(e) =>
                      setFormData({ ...formData, is_organic: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#2d6a4f]"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Este produto é Orgânico? (Exibe selo verde na loja)
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-white border text-gray-600 rounded-xl hover:bg-gray-100 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}