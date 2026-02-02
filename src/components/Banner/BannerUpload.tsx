"use client";

import { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useBannerStore } from "@/stores/bannerStore";
import { toast } from "sonner";
import Image from "next/image";

interface BannerUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BannerUpload({ isOpen, onClose }: BannerUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { uploadBanner, isUploading: storeUploading } = useBannerStore();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan.");
      return;
    }

    // Validate file size (3MB)
    const maxSize = 3 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error(`Ukuran file maksimum adalah 3MB.`);
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    // Validate file type
    if (!droppedFile.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan.");
      return;
    }

    // Validate file size (3MB)
    const maxSize = 3 * 1024 * 1024;
    if (droppedFile.size > maxSize) {
      toast.error(`Ukuran file maksimum adalah 3MB.`);
      return;
    }

    setFile(droppedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Silakan pilih file gambar terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadBanner({
        file,
        name: name || undefined,
        link_url: linkUrl || undefined,
        is_active: true,
      });

      // Reset form and close dialog
      setFile(null);
      setPreview("");
      setName("");
      setLinkUrl("");
      onClose();
    } catch (error) {
      // Error is already handled in the store
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading && !storeUploading) {
      setFile(null);
      setPreview("");
      setName("");
      setLinkUrl("");
      onClose();
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Banner Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="banner-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="banner-upload" className="cursor-pointer">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Klik untuk upload atau drag & drop gambar
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, atau WEBP (Maks. 3MB)
                </p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 600px) 100vw, 600px"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="banner-name">Nama Banner</Label>
            <Input
              id="banner-name"
              type="text"
              placeholder="Contoh: Promo Januari"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500">
              Nama untuk organisasi admin (tidak ditampilkan di banner)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url">Link URL (Opsional)</Label>
            <Input
              id="link-url"
              type="url"
              placeholder="https://example.com/promo"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500">
              Pengguna akan diarahkan ke link ini saat mengklik banner
            </p>
          </div>

          {file && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>File: {file.name}</p>
              <p>Ukuran: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              <p className="text-xs text-gray-500 mt-1">
                File akan dikompresi otomatis menjadi di bawah 500KB
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading || storeUploading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!file || isUploading || storeUploading}
          >
            {isUploading || storeUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengupload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Banner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
