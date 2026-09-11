// components/ImageUpload.tsx
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { Upload, X, Loader2 } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type ImageUploadProps = {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  className?: string;
};

// ============================================================
// COMPONENTE
// ============================================================
export default function ImageUpload({
  value,
  onChange,
  bucket = 'product-images',
  folder = 'uploads',
  maxSizeMB = 5,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // SELECIONAR ARQUIVO
  // ============================================================
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // ============================================================
  // UPLOAD
  // ============================================================
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`A imagem deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Não foi possível obter a URL da imagem');
      }

      onChange(publicUrlData.publicUrl);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(
        err instanceof Error ? err.message : 'Erro ao fazer upload da imagem'
      );
    } finally {
      setUploading(false);
      // Limpar o input para permitir selecionar a mesma imagem novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ============================================================
  // REMOVER IMAGEM
  // ============================================================
  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {value ? (
        // Preview da imagem
        <div className="relative group">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
            <Image
              src={value}
              alt="Imagem do produto"
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Botão remover */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Remover imagem"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Botão alterar (aparece ao passar o mouse) */}
          <button
            type="button"
            onClick={handleFileSelect}
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
          >
            <div className="text-center">
              <Upload className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm font-medium">Alterar imagem</span>
            </div>
          </button>
        </div>
      ) : (
        // Área de upload vazia
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={uploading}
          className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#2d6a4f] hover:bg-[#f0f4f0] transition flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#2d6a4f] animate-spin" />
              <span className="text-sm text-[#2d6a4f] font-medium">
                A enviar...
              </span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-[#f0f4f0] rounded-full flex items-center justify-center">
                <Upload className="w-7 h-7 text-[#2d6a4f]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Carregar imagem
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WEBP • Máx {maxSizeMB}MB
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Mensagem de erro */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}