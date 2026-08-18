// app/admin/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Leaf,
  ShoppingBag,
  Filter,
  Download,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Tag,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_organic: boolean;
  in_stock: boolean;
  stock: number;
  weight: string;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = [
  { id: 'all', name: 'Todas', icon: '📦', color: 'bg-gray-100' },
  { id: 'carnes', name: 'Carnes', icon: '🥩', color: 'bg-red-100' },
  { id: 'verduras', name: 'Verduras', icon: '🥬', color: 'bg-green-100' },
  { id: 'frutas', name: 'Frutas', icon: '🍎', color: 'bg-orange-100' },
  { id: 'chas', name: 'Chás', icon: '🍵', color: 'bg-amber-100' },
  { id: 'legumes', name: 'Legumes', icon: '🥕', color: 'bg-yellow-100' },
  { id: 'laticinios', name: 'Laticínios', icon: '🧀', color: 'bg-blue-100' },
  { id: 'ovos', name: 'Ovos', icon: '🥚', color: 'bg-rose-100' },
  { id: 'mercearia', name: 'Mercearia', icon: '🧂', color: 'bg-gray-100' },
  { id: 'padaria', name: 'Padaria', icon: '🍞', color: 'bg-amber-100' },
  { id: 'bebidas', name: 'Bebidas', icon: '🧃', color: 'bg-sky-100' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_organic: false,
    stock: '',
    weight: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter, stockFilter, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (stockFilter === 'in_stock') {
        query = query.gt('stock', 0);
      } else if (stockFilter === 'out_of_stock') {
        query = query.eq('stock', 0);
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

      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchProducts();
      alert('✅ Produto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('❌ Erro ao excluir produto');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Selecione produtos para excluir');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${selectedProducts.length} produtos?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;

      setSelectedProducts([]);
      fetchProducts();
      alert(`✅ ${selectedProducts.length} produtos excluídos!`);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('❌ Erro ao excluir produtos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        is_organic: formData.is_organic,
        stock: parseInt(formData.stock) || 0,
        weight: formData.weight,
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        alert('✅ Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        alert('✅ Produto criado com sucesso!');
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: product.category,
      is_organic: product.is_organic || false,
      stock: String(product.stock || 0),
      weight: product.weight || '',
      image_url: product.image_url || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      is_organic: false,
      stock: '',
      weight: '',
      image_url: ''
    });
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">Carregando produtos...</p>
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
            <Package className="w-8 h-8" />
            Produtos
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie o catálogo de produtos • {products.length} produtos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl">
              <span className="text-sm text-blue-700">
                {selectedProducts.length} selecionados
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs"
              >
                Excluir
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs"
              >
                Limpar
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
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
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] min-w-[150px]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] min-w-[150px]"
          >
            <option value="all">📦 Todos os estoques</option>
            <option value="in_stock">✅ Em estoque</option>
            <option value="out_of_stock">❌ Esgotados</option>
          </select>
          <button
            onClick={fetchProducts}
            className="px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const category = getCategoryInfo(product.category);
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {category.icon}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${category.color} text-gray-700`}>
                        {category.icon} {category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#2d6a4f]">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock || 0} {product.weight && `(${product.weight})`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {product.is_organic && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#2d6a4f] text-white flex items-center gap-1 w-fit">
                            <Leaf className="w-3 h-3" />
                            Orgânico
                          </span>
                        )}
                        {product.stock > 0 ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Em estoque
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Esgotado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500">Nenhum produto encontrado</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-full hover:bg-[#1b4332] transition"
            >
              Adicionar primeiro produto
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

      {/* Modal de Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d6a4f]">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (Kz) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  >
                    <option value="">Selecione...</option>
                    {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Ex: 1kg, 500g"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Produto
                </label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  onRemove={() => setFormData({ ...formData, image_url: '' })}
                  folder="products"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_organic}
                    onChange={(e) => setFormData({ ...formData, is_organic: e.target.checked })}
                    className="w-4 h-4 text-[#2d6a4f] rounded focus:ring-[#2d6a4f]"
                  />
                  <span className="text-sm text-gray-700">Produto Orgânico</span>
                </label>
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
                    editingProduct ? 'Atualizar' : 'Criar'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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