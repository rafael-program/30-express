// components/ImageUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  className?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  folder = 'products',
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para o Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product_images')
        .upload(filePath, file);

      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      setPreview(publicUrl);
      
      alert('✅ Imagem enviada com sucesso!');

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('❌ Erro ao fazer upload da imagem.');
      setPreview(value || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (onRemove) onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#2d6a4f] hover:bg-[#f0f7f0] transition flex items-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Selecionar Imagem
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <span className="text-xs text-gray-400">
          PNG, JPG, WEBP • máx 5MB
        </span>
      </div>

      {/* Preview da imagem */}
      {preview && (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Preview do produto"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition">
            <span className="text-white opacity-0 hover:opacity-100 transition text-xs font-medium">
              {uploading ? 'Enviando...' : 'Clique para trocar'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}