// app/admin/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================
// TIPOS (adaptados ao schema real)
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

  const ITEMS_PER_PAGE = 10;

  // ============================================================
  // BUSCAR CATEGORIAS (uma vez)
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (!cancelled && data) {
        setCategories(data);
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // BUSCAR PRODUTOS
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' });

        if (categoryFilter !== 'all') {
          query = query.eq('category_id', categoryFilter);
        }

        if (stockFilter === 'low') {
          query = query.lte('stock', 10).gt('stock', 0);
        } else if (stockFilter === 'out') {
          query = query.eq('stock', 0);
        } else if (stockFilter === 'available') {
          query = query.gt('stock', 0);
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

        // Enriquecer com nome da categoria
        const catsMap: Record<string, string> = {};
        categories.forEach((c) => {
          catsMap[c.id] = c.name;
        });

        const enrichedProducts: Product[] = (data || []).map((p) => ({
          ...p,
          category_name: p.category_id
            ? catsMap[p.category_id] || p.category
            : p.category || undefined,
        }));

        if (!cancelled) {
          setProducts(enrichedProducts);
          setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, categoryFilter, stockFilter, searchTerm, refreshKey]);

  // ============================================================
  // DELETAR PRODUTO
  // ============================================================
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
      alert('✅ Produto excluído!');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('❌ Erro ao excluir produto');
    }
  };

  // ============================================================
  // TOGGLE DISPONÍVEL / INDISPONÍVEL
  // ============================================================
  const toggleInStock = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          in_stock: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('❌ Erro ao atualizar produto');
    }
  };

  // ============================================================
  // FORMATADORES
  // ============================================================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStockBadge = (stock: number, inStock: boolean) => {
    if (!inStock || stock === 0) {
      return { label: 'Indisponível', color: 'bg-red-100 text-red-700' };
    }
    if (stock <= 10) {
      return {
        label: `Baixo (${stock})`,
        color: 'bg-orange-100 text-orange-700',
      };
    }
    return { label: `${stock} un`, color: 'bg-green-100 text-green-700' };
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-4 text-[#2d6a4f] font-medium">
            Carregando produtos...
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
            <Package className="w-8 h-8" />
            Produtos
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie o catálogo de produtos do Mercado do 30
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          >
            <option value="all">Todo o Stock</option>
            <option value="available">Disponível</option>
            <option value="low">Stock Baixo</option>
            <option value="out">Sem Stock</option>
          </select>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f6f4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
              {products.map((product) => {
                const stockBadge = getStockBadge(
                  product.stock,
                  product.in_stock
                );
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#f0f4f0] rounded-lg flex items-center justify-center text-xl">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 flex items-center gap-2">
                            {product.name}
                            {product.is_organic && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Orgânico
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {product.weight || 'sem peso'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.category_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#2d6a4f]">
                        {formatCurrency(product.price)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${stockBadge.color}`}
                      >
                        {stockBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          toggleInStock(product.id, product.in_stock)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          product.in_stock
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {product.in_stock ? 'Disponível' : 'Indisponível'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-[#2d6a4f]" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
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

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Nenhum produto encontrado</p>
            <Link
              href="/admin/products/new"
              className="inline-block mt-4 px-6 py-2 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition"
            >
              Criar Primeiro Produto
            </Link>
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
    </div>
  );
}