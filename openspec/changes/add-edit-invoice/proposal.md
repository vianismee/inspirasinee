## Why

Admin perlu bisa mengoreksi isi invoice yang sudah dibuat — misalnya item sepatu yang salah dicatat, layanan yang tidak jadi diambil, atau diskon yang terlewat — tanpa harus menghapus invoice dan membuat ulang dari awal.

## What Changes

- **BARU** — Sheet/drawer "Edit Invoice" yang bisa dibuka dari tabel orders di admin dashboard
- **BARU** — Edit item (nama sepatu + layanan): tambah, hapus, dan ubah item yang ada
- **BARU** — Edit diskon manual (`order_discounts`): tambah dan hapus diskon yang ter-apply ke invoice
- **BARU** — Recalculate otomatis `subtotal` dan `total_price` setelah perubahan item/diskon
- **BARU** — Action `updateInvoice` di `orderStore` yang melakukan atomic update ke DB (delete + reinsert items/discounts, lalu update orders)
- **TIDAK BERUBAH** — Referral, points, membership discount: sudah di-commit ke DB (transactions tercatat), hanya ditampilkan sebagai read-only info di UI edit

## Impact

- Affected specs: `invoice-edit` (baru)
- Affected code:
  - `src/stores/orderStore.ts` — tambah action `updateInvoice`
  - `src/components/Dashboard/` atau `src/components/Invoice/` — komponen `EditInvoiceSheet`
  - `src/app/(admin)/admin/...` — table kolom actions perlu trigger edit

## Constraints & Risks

### Yang TIDAK bisa diedit di proposal ini

| Field | Alasan |
|---|---|
| `invoice_id` | Primary key, immutable |
| `customer_id` | Mengubah customer dari invoice yang sudah ada akan merusak history |
| `referral_code` / `referral_discount_amount` | Referral sudah tercatat di `referral_usage` dan points sudah di-award ke referrer |
| `points_used` / `points_discount_amount` | Poin sudah di-deduct via `points_transactions` |
| `membership_discount_amount` | Membership benefit terikat ke snapshot level saat transaksi |

### Risiko utama: partial failure

Operasi edit melibatkan beberapa tabel (order_item, order_discounts, orders). Supabase client tidak mendukung multi-table transaction. Urutan operasi dirancang untuk meminimalkan state yang rusak:
1. Delete order_item lama → insert baru
2. Delete order_discounts lama → insert baru  
3. Update orders (subtotal, total_price)

Jika step 3 gagal, subtotal di tabel orders tidak update tapi items sudah berubah — ini bisa mengakibatkan inkonsistensi. Mitigasi: tampilkan error toast yang jelas dan minta admin refresh data.
