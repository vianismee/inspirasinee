"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ExternalLink, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import type { Banner } from "@/types/banner";

interface BannerItemProps {
  banner: Banner;
  onDelete: () => void;
  onUpdate?: (id: number, data: Partial<Banner>) => void;
}

export function BannerItem({ banner, onDelete }: BannerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Banner Image */}
      <div className="relative w-48 h-28 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <Image
          src={banner.image_url}
          alt={`Banner ${banner.display_order + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 200px) 100vw, 200px"
        />
        {!banner.is_active && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <EyeOff className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Banner Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {banner.name || `Banner #${banner.display_order + 1}`}
          </h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {banner.image_ratio}
          </span>
          {banner.is_active ? (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Aktif
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
              Nonaktif
            </span>
          )}
        </div>

        {banner.link_url ? (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{banner.link_url}</span>
          </a>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada link</p>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Dibuat: {new Date(banner.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
