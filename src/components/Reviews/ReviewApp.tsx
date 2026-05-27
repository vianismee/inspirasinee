"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CustomerReview,
  maskPhone,
  ReviewFilter,
  ReviewService,
  ReviewStats,
} from "@/lib/reviews/service";
import { Headers } from "@/components/MainComponent/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconStar,
  IconStarFilled,
  IconEye,
  IconEyeOff,
  IconChartBar,
  IconLayoutGrid,
  IconRefresh,
} from "@tabler/icons-react";

// ─── Stat Cards ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Star Display ─────────────────────────────────────────────────────────────

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) =>
        i < value ? (
          <IconStarFilled key={i} size={14} className="text-amber-400" />
        ) : (
          <IconStar key={i} size={14} className="text-muted-foreground/30" />
        )
      )}
    </span>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onToggle,
  loading,
}: {
  review: CustomerReview;
  onToggle: (id: number, current: boolean) => void;
  loading: boolean;
}) {
  return (
    <Card
      className={`flex flex-col gap-0 overflow-hidden transition-opacity ${
        review.status === "approved" ? "" : "opacity-60"
      }`}
    >
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-sm">{maskPhone(review.reviewer_phone)}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Badge
            variant={review.status === "approved" ? "default" : "secondary"}
            className="flex-shrink-0"
          >
            {review.status === "approved" ? (
              <span className="flex items-center gap-1">
                <IconEye size={11} /> Ditampilkan
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <IconEyeOff size={11} /> Disembunyikan
              </span>
            )}
          </Badge>
        </div>

        {/* Overall rating */}
        <div className="flex items-center gap-2 mt-1">
          <Stars value={review.overall_rating} />
          <span className="text-sm font-medium">{review.overall_rating}/5</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-3">
        {/* Category ratings */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Kecepatan", value: review.rating_speed },
            { label: "Ketepatan", value: review.rating_accuracy },
            { label: "Pelayanan", value: review.rating_service },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-md bg-muted/40 py-2 px-1">
              <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
              <Stars value={value} />
              <p className="text-xs font-semibold mt-0.5">{value}/5</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {review.description}
        </p>

        {/* Invoice tag */}
        {review.invoice_id && (
          <p className="text-xs text-muted-foreground">
            Invoice:{" "}
            <span className="font-mono text-foreground">{review.invoice_id}</span>
          </p>
        )}

        {/* Visibility toggle */}
        <Button
          size="sm"
          variant={review.is_featured ? "outline" : "default"}
          className="w-full gap-1.5"
          disabled={loading}
          onClick={() => onToggle(review.id, review.status === "approved")}
        >
          {review.status === "approved" ? (
            <>
              <IconEyeOff size={14} />
              Sembunyikan
            </>
          ) : (
            <>
              <IconEye size={14} />
              Tampilkan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: ReviewFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Ditampilkan", value: "visible" },
  { label: "Disembunyikan", value: "hidden" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReviewApp() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("all");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewData, statsData] = await Promise.all([
        ReviewService.getReviews(activeFilter),
        ReviewService.getStats(),
      ]);
      setReviews(reviewData);
      setStats(statsData);
    } catch {
      toast.error("Gagal memuat data review");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (id: number, current: boolean) => {
    setToggling(true);
    try {
      await ReviewService.setVisibility(id, !current);
      toast.success(current ? "Review disembunyikan" : "Review ditampilkan");
      await loadData();
    } catch (err) {
      const isRls = err instanceof Error && err.message === "RLS_BLOCKED";
      toast.error(
        isRls
          ? "Gagal: belum ada RLS policy UPDATE di Supabase. Tambahkan policy untuk tabel customer_reviews."
          : "Gagal mengubah visibilitas review"
      );
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="w-full px-[30px] py-[30px]">
      <div className="flex flex-col gap-6">
        <Headers
          title="Review Pelanggan"
          desc="Atur review mana yang ditampilkan kepada calon pelanggan."
        />

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats ? (
            <>
              <StatCard
                label="Total Review"
                value={stats.total}
                icon={<IconChartBar size={22} className="text-blue-500" />}
                color="border-l-blue-500"
              />
              <StatCard
                label="Ditampilkan"
                value={stats.visible}
                icon={<IconLayoutGrid size={22} className="text-emerald-500" />}
                color="border-l-emerald-500"
              />
              <StatCard
                label="Disembunyikan"
                value={stats.hidden}
                icon={<IconEyeOff size={22} className="text-slate-400" />}
                color="border-l-slate-400"
              />
              <StatCard
                label="Rata-rata"
                value={stats.avg_overall > 0 ? stats.avg_overall.toFixed(1) : "-"}
                icon={<IconStarFilled size={22} className="text-amber-400" />}
                color="border-l-amber-400"
              />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[80px] rounded-xl" />
            ))
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={activeFilter === f.value ? "default" : "outline"}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
              {stats && f.value !== "all" && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 px-1.5 py-0 text-[10px]"
                >
                  {f.value === "visible" ? stats.visible : stats.hidden}
                </Badge>
              )}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="ml-auto gap-1.5"
          >
            <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <IconEyeOff size={40} />
            <p className="text-sm">Tidak ada review untuk filter ini</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onToggle={handleToggle}
                loading={toggling}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
