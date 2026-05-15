## Context

Invoice editing menyentuh tiga tabel sekaligus (`order_item`, `order_discounts`, `orders`) tanpa dukungan client-side transaction di Supabase. Selain itu, beberapa kolom di tabel `orders` (referral, points, membership) sudah memiliki efek samping di tabel lain yang tidak boleh di-undo secara otomatis.

## Goals / Non-Goals

**Goals:**
- Admin bisa mengoreksi items dan diskon tanpa delete-recreate invoice
- Subtotal & total_price selalu konsisten dengan isi items + discounts setelah save
- UX tidak meninggalkan halaman (gunakan Sheet/Drawer)

**Non-Goals:**
- Ganti customer pada invoice yang sudah ada
- Reverse/edit transaksi poin atau referral yang sudah tercatat
- Multi-user concurrent editing (tidak ada optimistic lock)
- Edit field `payment` dan `status` — sudah ada aksi terpisah

## Decisions

### D1: Sheet bukan page navigasi
Edit dibuka sebagai side sheet (`src/components/ui/sheet.tsx` sudah tersedia) di atas tabel, bukan route baru. Ini konsisten dengan pola Shadcn/ui dan menghindari hilangnya filter/pagination tabel saat kembali.

### D2: State lokal di komponen, bukan store baru
Data edit di-seed dari `orderStore.singleOrders` saat sheet dibuka, lalu dikelola dengan `useState` lokal mengikuti pola yang sama dengan `CartApp`. Tidak perlu store baru — scope editnya terbatas pada satu invoice dalam satu session.

### D3: Delete + reinsert, bukan UPDATE per-row untuk order_item
`order_item` tidak punya unique key yang stabil untuk di-diff. Menghapus semua baris lama dan menginsert ulang lebih sederhana dan bebas dari edge case "item berubah tapi id tidak match". Trade-off: jika insert baru gagal setelah delete berhasil, data item hilang. Mitigasi: urutan operasi — insert baru dulu, baru delete lama (lihat bagian Migration Plan).

### D4: Revisi urutan operasi — insert-first untuk keamanan
Urutan yang aman:
1. INSERT `order_item` baru (dengan invoice_id yang sama)
2. DELETE `order_item` lama (berdasarkan id yang sudah diambil di awal)
3. INSERT `order_discounts` baru
4. DELETE `order_discounts` lama
5. UPDATE `orders` (subtotal, total_price)

Catatan: karena `order_item` tidak punya unique constraint selain PK, step 1 dan 2 bisa bersamaan tanpa konflik.

### D5: Konversi flat → grouped saat load, grouped → flat saat save
`order_item` di DB = flat (1 baris per layanan per sepatu).
`CartItem` di cartStore = grouped (1 item = 1 sepatu + array layanan).

Fungsi konversi diperlukan:
- `flatToGrouped(orderItems[])` → `CartItem[]` — dipakai saat seed state edit
- `groupedToFlat(cartItems[])` → `OrderItemInsert[]` — dipakai saat save

Fungsi ini reuse logika yang sudah ada di `orderStore.ts` (`groupOrderItems`) dan `cartStore.ts` (`handleSubmit`).

### D6: Referral/points sebagai read-only display
Jumlah referral discount, points discount, dan membership discount ditampilkan di ringkasan total tapi tidak bisa diedit. Total price = new_subtotal - new_discounts_total - referral_discount_amount - points_discount_amount - membership_discount_amount.

## Risks / Trade-offs

| Risiko | Mitigation |
|---|---|
| Insert berhasil tapi delete gagal → duplikat item | Tampilkan error eksplisit, data bisa manual di-clean via Supabase dashboard |
| Concurrent edit oleh dua admin pada invoice yang sama | Out of scope; terima risk untuk sekarang (single admin assumption) |
| Diskon yang diedit tidak sinkron dengan `order_discounts_pkey` constraint | Delete lama by `order_invoice_id`, insert baru — tidak akan conflict |

## Migration Plan

Tidak ada perubahan schema. Semua tabel yang diperlukan sudah ada:
- `order_item` — delete by `id[]` + insert
- `order_discounts` — delete by `order_invoice_id` + insert
- `orders` — update by `invoice_id`

## Open Questions

- Q: Apakah setelah edit invoice perlu kirim ulang notif WhatsApp ke customer? → Bisa jadi tombol opsional "Kirim Ulang Invoice" setelah save berhasil, tapi **out of scope** untuk proposal ini.
- Q: Apakah admin perlu bisa mengubah jumlah `referral_discount_amount` secara manual (override)? → Saat ini **tidak**; referral dan points tidak diedit.
