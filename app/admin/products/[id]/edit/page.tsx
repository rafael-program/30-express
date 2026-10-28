// app/admin/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      // Buscar categorias
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (cats) setCategories(cats);

      // Buscar produto
      if (productId) {
        const { data: prod, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (prod) {
          setFormData({
            name: prod.name || '',
            description: prod.description || '',
            price: prod.price?.toString() || '',
            category_id: prod.category_id || '',
            stock: prod.stock?.toString() || '',
            weight: prod.weight || '',
            image_url: prod.image_url || '',
            is_organic: prod.is_organic || false,
          });
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [productId]);

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
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId);

      if (error) throw error;

      alert('✅ Produto atualizado!');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('❌ Erro ao atualizar produto.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            Editar Produto
          </h1>
          <p className="text-gray-500 mt-1">Atualize as informações do produto</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Produto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
            />
          </div>

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
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preço (Kz) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stock
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Peso / Unidade
            </label>
            <input
              type="text"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              URL da Imagem
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 p-4 bg-[#f8f6f4] rounded-xl">
            <input
              type="checkbox"
              name="is_organic"
              id="is_organic"
              checked={formData.is_organic}
              onChange={handleChange}
              className="w-5 h-5 accent-[#2d6a4f]"
            />
            <label htmlFor="is_organic" className="text-sm font-medium text-gray-700">
              Produto Orgânico
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/admin/products"
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}