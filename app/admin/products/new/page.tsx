// app/admin/products/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Image as ImageIcon,
} from 'lucide-react';

type Category = {
  id: string;
  name: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
    weight: '',
    image_url: '',
    is_organic: false,
  });

  // Buscar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    setLoading(true);
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
        in_stock: true, // Por padrão entra como disponível
      };

      const { error } = await supabase.from('products').insert([payload]);

      if (error) throw error;

      alert('✅ Produto criado com sucesso!');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('❌ Erro ao criar produto. Verifique as permissões RLS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 bg-white rounded-xl hover:bg-gray-50 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2d6a4f] flex items-center gap-2">
            <Package className="w-8 h-8" />
            Novo Produto
          </h1>
          <p className="text-gray-500 mt-1">Adicione um produto ao catálogo</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Produto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Abacate Tropical Maduro"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Descrição */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Breve descrição..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoria
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preço (Kz) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Ex: 600"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantidade em Stock
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="Ex: 10"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Peso / Unidade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Peso / Unidade
            </label>
            <input
              type="text"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Ex: 1 kg, 500g"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* URL da Imagem */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              URL da Imagem (Opcional)
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Checkbox Orgânico */}
          <div className="md:col-span-2 flex items-center gap-3 p-4 bg-[#f8f6f4] rounded-xl">
            <input
              type="checkbox"
              name="is_organic"
              id="is_organic"
              checked={formData.is_organic}
              onChange={handleChange}
              className="w-5 h-5 accent-[#2d6a4f]"
            />
            <label htmlFor="is_organic" className="text-sm font-medium text-gray-700 cursor-pointer">
              Este é um produto orgânico? (Adiciona selo verde na loja)
            </label>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/admin/products"
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? 'Salvando...' : 'Criar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}