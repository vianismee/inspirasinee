"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useBannerStore } from "@/stores/bannerStore";
import { BannerUpload } from "./BannerUpload";
import { BannerItem } from "./BannerItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MAX_BANNERS } from "@/stores/bannerStore";

export function BannerApp() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { banners, isLoading, isUploading, totalCount, canAddMoreBanners, deleteBanner, reorderBanners } = useBannerStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const reorderedBanners = arrayMove(banners, oldIndex, newIndex);
      reorderBanners(reorderedBanners);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus banner ini?")) {
      deleteBanner(id);
    }
  };

  return (
    <div className="w-full h-screen px-[30px] py-[30px]">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl text-center md:text-left sm:text-3xl font-bold text-gray-900 dark:text-white">
            Banner Management
          </h1>
          <p className="text-gray-500 text-center md:text-left dark:text-gray-400 mt-1">
            Kelola banner promosi untuk tracking page
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {totalCount} dari {MAX_BANNERS} banner maksimum
          </p>
        </div>

        <div className="flex items-center justify-center sm:justify-end">
          <Button
            onClick={() => setIsUploadOpen(true)}
            disabled={!canAddMoreBanners() || isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {!canAddMoreBanners() ? "Maksimum Banner Tercapai" : "Upload Banner"}
          </Button>
        </div>
      </header>

      <BannerUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Memuat banner...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Belum ada banner</p>
            <p className="text-gray-400 text-sm mt-2">
              Upload banner pertama Anda untuk memulai
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={banners.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {banners.map((banner) => (
                  <BannerItem
                    key={banner.id}
                    banner={banner}
                    onDelete={() => handleDelete(banner.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Informasi Upload:</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Maksimum ukuran upload: 3MB</li>
          <li>• Gambar akan dikompresi otomatis menjadi di bawah 500KB</li>
          <li>• Rasio gambar akan terdeteksi otomatis</li>
          <li>• Format yang didukung: JPG, PNG, WEBP</li>
          <li>• Maksimum {MAX_BANNERS} banner dapat diunggah</li>
        </ul>
      </div>
    </div>
  );
}
