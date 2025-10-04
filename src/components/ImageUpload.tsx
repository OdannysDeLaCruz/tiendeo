"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (base64Image: string | null) => void;
}

export default function ImageUpload({
  currentImage,
  onImageChange,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB");
      return;
    }

    setError("");

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onImageChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {preview ? (
          <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("data:")}
            />
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <span className="text-gray-400 text-sm">Sin imagen</span>
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <div className="flex space-x-2">
            <label
              htmlFor="image-upload"
              className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {preview ? "Cambiar imagen" : "Seleccionar imagen"}
            </label>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Tamaño máximo: 5MB. Formatos: JPG, PNG, WebP
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
