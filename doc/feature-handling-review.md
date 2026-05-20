# Feature Proposal: Customer Reviews (C2C)

**Branch:** `feature/customer-reviews`  
**Date:** 2026-05-15  
**Status:** Draft

---

## Overview

Tambah fitur review pelanggan yang bisa diisi publik lewat form khusus, tersimpan di Supabase, lalu ditampilkan di section **"Customer to Customer"** di dalam webapp ShineApp (setelah login).

Tujuannya: membangun kepercayaan calon pelanggan lewat testimoni nyata dari sesama pelanggan, sekaligus memberi pelanggan lama ruang untuk berbagi pengalaman.

---

## User Flow

### Flow 1 — Mengisi Review (Publik, Verifikasi Nomor Telepon)

```
Pelanggan buka /review
  → Step 1 — Verifikasi: masukkan nomor telepon (WhatsApp)
      → Sistem cek ke tabel `customers` (kolom `whatsapp`)
      → Jika TIDAK ditemukan → tampil error "Nomor tidak terdaftar", form tidak bisa dilanjutkan
      → Jika ditemukan → lanjut ke Step 2
  → Step 2 — Form Review:
      → Nomor telepon terkunci (tidak bisa diubah), customer_id terisi otomatis dari DB
      → Isi rating per kategori + Overall Rating + Deskripsi
      → Submit → tersimpan di tabel `customer_reviews` (status: pending)
  → Tampil halaman "Terima kasih! Review kamu sedang diverifikasi."
```

### Flow 2 — Melihat Review (Dalam App, Setelah Login)

```
User login → Home page
  → Scroll ke section "Customer to Customer"
  → Lihat kartu-kartu review: nomor telepon (masked), rating per kategori, overall rating, deskripsi, tanggal

  → Bisa swipe/scroll horizontal (carousel) atau list vertikal
```

---

## Database Schema

### Tabel Baru: `customer_reviews`

| Kolom             | Tipe            | Keterangan                                                                |
| ----------------- | --------------- | ------------------------------------------------------------------------- |
| `id`              | `bigint` PK     | Auto increment                                                            |
| `customer_id`     | `text`          | FK ke `customers.customer_id` — wajib ada, hasil verifikasi nomor telepon |
| `reviewer_phone`  | `text`          | Nomor telepon yang diverifikasi (disimpan untuk audit trail)              |
| `invoice_id`      | `text` nullable | FK ke `orders.invoice_id`, opsional untuk verifikasi                      |
| `rating_speed`    | `smallint`      | Rating Kecepatan (1–5)                                                    |
| `rating_accuracy` | `smallint`      | Rating Ketepatan (1–5)                                                    |
| `rating_service`  | `smallint`      | Rating Pelayanan (1–5)                                                    |
| `overall_rating`  | `smallint`      | Overall Rating (1–5, diisi manual pelanggan)                              |
| `description`     | `text`          | Deskripsi / kesan pelanggan                                               |
| `service_type`    | `text` nullable | Jenis layanan yang direview                                               |
| `status`          | `text`          | `pending` / `approved` / `rejected`                                       |
| `is_featured`     | `boolean`       | Untuk pin review terbaik                                                  |
| `created_at`      | `timestamptz`   | Auto                                                                      |
| `updated_at`      | `timestamptz`   | Auto                                                                      |

**RLS Policy:**

- `INSERT`: Semua bisa insert (public anon key) — verifikasi nomor telepon dilakukan di sisi aplikasi sebelum submit
- `SELECT`: Hanya row dengan `status = 'approved'` yang bisa dibaca publik

**Constraint:**

- Satu `customer_id` hanya bisa punya 1 review dengan status `approved` per periode (bisa dibatasi di service layer)

---

## Halaman & Komponen Baru

### 1. `/review` — Public Review Form Page

- Route: `app/review/page.tsx` (di luar `(dashboard)` group, tidak butuh login)
- **Step 1 — Verifikasi Nomor Telepon:**
  - Input nomor telepon/WhatsApp
  - Tombol "Verifikasi"
  - Cek ke tabel `customers` (kolom `whatsapp`) via `reviewService.verifyPhone(phone)`
  - Jika tidak ditemukan → tampil pesan error, form tidak muncul
  - Jika valid → lanjut ke Step 2
- **Step 2 — Form Review** (muncul setelah verifikasi berhasil):
  - Nomor telepon ditampilkan terkunci (read-only) sebagai identitas
  - Field:
    - **Rating per kategori** (masing-masing 1–5 bintang):
      - Kecepatan — seberapa cepat proses pengerjaan
      - Ketepatan — hasil sesuai ekspektasi
      - Pelayanan — keramahan & komunikasi tim
    - **Overall Rating** (1–5 bintang, diisi manual oleh pelanggan)
    - **Deskripsi** — textarea untuk cerita/kesan pelanggan
  - Tombol Submit
  - State sukses: halaman terima kasih
- Validasi: semua rating wajib diisi, deskripsi minimal 10 karakter

### 2. `/review/[invoice_id]` — Review Terikat Invoice (Opsional, Fase 2)

- Pra-isi nama dari data order jika invoice ditemukan
- Tampilkan detail order sebagai konteks (sepatu apa yang dicuci)

### 3. Komponen `CustomerReviewCard`

- Path: `components/customer-review-card.tsx`
- Props: `reviewerPhone`, `ratingSpeed`, `ratingAccuracy`, `ratingService`, `overallRating`, `description`, `createdAt`
- UI: Kartu dengan nomor telepon ter-mask (contoh: `0812****5678`), overall rating bintang besar, 3 metric kecil, deskripsi, tanggal

### 4. Section `CustomerToCustomer` di Home

- Path: `components/customer-to-customer.tsx`
- Tampil di `app/(dashboard)/home/page.tsx` setelah section Recent Orders
- Fetch `customer_reviews` dengan `status = 'approved'`, limit 10, order by `is_featured DESC, created_at DESC`
- Tampilan: Horizontal scroll carousel di mobile

---

## API / Service Layer

### `lib/reviews/service.ts`

```typescript
// Cek nomor telepon ke tabel customers (kolom whatsapp)
// Return: { valid: true, customerId: string } atau { valid: false }
verifyPhone(phone: string): Promise<{ valid: boolean; customerId?: string }>

// Ambil review yang sudah approved untuk ditampilkan di home
getApprovedReviews(limit?: number): Promise<CustomerReview[]>

// Submit review — dipanggil setelah verifyPhone berhasil
submitReview(data: ReviewSubmitData): Promise<{ success: boolean; error?: string }>
```

### Types

```typescript
interface ReviewSubmitData {
  customer_id: string; // Dari hasil verifyPhone
  reviewer_phone: string; // Nomor yang diverifikasi
  rating_speed: number;
  rating_accuracy: number;
  rating_service: number;
  overall_rating: number;
  description: string;
}

interface CustomerReview {
  id: number;
  reviewer_phone: string; // Akan di-mask saat ditampilkan: 0812****5678
  rating_speed: number;
  rating_accuracy: number;
  rating_service: number;
  overall_rating: number;
  description: string;
  is_featured: boolean;
  created_at: string;
}
```

---

## Update `lib/supabase.ts`

Tambah type `customer_reviews` ke interface `Database`.

---

## Implementation Plan

### Phase 1 (MVP)

1. Buat tabel `customer_reviews` di Supabase + RLS policies
2. Update `lib/supabase.ts` dengan tipe baru
3. Buat `lib/reviews/service.ts`
4. Buat halaman publik `/review` (form submit)
5. Buat komponen `CustomerReviewCard`
6. Buat komponen `CustomerToCustomer` (section di home)
7. Integrasikan section ke Home page

### Phase 2 (Enhancement)

- `/review/[invoice_id]` untuk review terikat order spesifik
- Push notif ke admin saat ada review baru (pending)
- Admin panel sederhana untuk approve/reject review

---

## Design Notes

- Public review form: clean & minimal, nuansa brand Shine (gelap / premium)
- Section C2C di home: kartu dengan shadow ringan, avatar placeholder jika tidak ada foto
- Rating bintang: warna kuning/amber, interaktif di form, display-only di kartu
- Di kartu review: tampilkan 3 metric kecil (Kecepatan / Ketepatan / Pelayanan) + Overall Rating besar
- Mobile-first: form full-width, section C2C horizontal scroll

---

## Pertimbangan Teknis

| Hal                 | Keputusan                                                                        |
| ------------------- | -------------------------------------------------------------------------------- |
| Auth di form review | Tidak butuh login — verifikasi cukup lewat nomor telepon terdaftar               |
| Spam protection     | Hanya nomor terdaftar di `customers.whatsapp` yang bisa submit — natural barrier |
| Moderasi            | Manual approve di Supabase dashboard (Phase 1), admin panel (Phase 2)            |
| Privasi nomor       | Nomor disimpan di DB untuk audit, ditampilkan ter-mask di UI: `0812****5678`     |
| Foto                | Tidak ada upload foto (out of scope)                                             |
| Routing             | Form di luar `(dashboard)` group agar bisa diakses tanpa login                   |

---

## File yang Akan Dibuat / Diubah

| File                                  | Aksi                        |
| ------------------------------------- | --------------------------- |
| `app/review/page.tsx`                 | Buat baru                   |
| `components/customer-review-card.tsx` | Buat baru                   |
| `components/customer-to-customer.tsx` | Buat baru                   |
| `lib/reviews/service.ts`              | Buat baru                   |
| `lib/supabase.ts`                     | Update (tambah tipe)        |
| `app/(dashboard)/home/page.tsx`       | Update (tambah section C2C) |

```customer_reviews.sql
create table public.customer_reviews (
  id bigint generated always as identity not null,
  customer_id text not null,
  reviewer_phone text not null,
  invoice_id text null,
  rating_speed smallint not null,
  rating_accuracy smallint not null,
  rating_service smallint not null,
  overall_rating smallint not null,
  description text not null,
  status text not null default 'pending'::text,
  is_featured boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customer_reviews_pkey primary key (id),
  constraint customer_reviews_invoice_id_fkey foreign KEY (invoice_id) references orders (invoice_id) on delete set null,
  constraint customer_reviews_customer_id_fkey foreign KEY (customer_id) references customers (customer_id) on delete CASCADE,
  constraint customer_reviews_overall_rating_check check (
    (
      (overall_rating >= 1)
      and (overall_rating <= 5)
    )
  ),
  constraint customer_reviews_description_check check ((char_length(description) >= 10)),
  constraint customer_reviews_rating_accuracy_check check (
    (
      (rating_accuracy >= 1)
      and (rating_accuracy <= 5)
    )
  ),
  constraint customer_reviews_rating_service_check check (
    (
      (rating_service >= 1)
      and (rating_service <= 5)
    )
  ),
  constraint customer_reviews_rating_speed_check check (
    (
      (rating_speed >= 1)
      and (rating_speed <= 5)
    )
  ),
  constraint customer_reviews_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_customer_reviews_featured on public.customer_reviews using btree (is_featured, created_at desc) TABLESPACE pg_default
where
  (is_featured = true);

create index IF not exists idx_customer_reviews_customer_id on public.customer_reviews using btree (customer_id) TABLESPACE pg_default;

create trigger trg_customer_reviews_updated_at BEFORE
update on customer_reviews for EACH row
execute FUNCTION set_updated_at ();
```
