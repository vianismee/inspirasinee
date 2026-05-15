## 1. Store — Action updateInvoice

- [ ] 1.1 Tambah tipe `OrderItemUpdate` dan `OrderDiscountUpdate` di `orderStore.ts`
- [ ] 1.2 Buat helper `flatToGrouped(items[]) → CartItem[]` untuk konversi flat DB rows → format edit (reuse logika `groupOrderItems`)
- [ ] 1.3 Buat helper `groupedToFlat(cartItems[], invoiceId) → OrderItemInsert[]` untuk konversi sebelum save
- [ ] 1.4 Implementasi action `updateInvoice(invoiceId, { cartItems, discounts })` di `orderStore.ts`:
  - Insert order_item baru
  - Delete order_item lama (by id array yang disimpan saat load)
  - Delete order_discounts lama (by order_invoice_id)
  - Insert order_discounts baru
  - Update orders (subtotal, total_price)
- [ ] 1.5 Tambah `fetchSingleOrder(invoice_id)` di `orderStore` (atau pastikan `fetchOrder({ invoice })` sudah bisa dipanggil standalone)

## 2. Komponen — EditInvoiceSheet

- [ ] 2.1 Buat `src/components/Invoice/EditInvoiceSheet.tsx` menggunakan `Sheet` dari `@/components/ui/sheet`
- [ ] 2.2 Implementasi state lokal: `cartItems` (CartItem[]), `activeDiscounts` (Discount[]), `isLoading` (boolean)
- [ ] 2.3 Seed state dari props `order` saat sheet dibuka (gunakan `useEffect` on `open` prop)
- [ ] 2.4 Embed komponen `<Services />` yang sudah ada — atau buat versi lite yang menerima state lokal sebagai props (hindari coupling ke `useCartStore`)
- [ ] 2.5 Embed komponen `<Discount />` yang sudah ada — sama seperti 2.4, terima state lokal sebagai props
- [ ] 2.6 Buat section "Ringkasan Harga" read-only: tampilkan subtotal, diskon manual, referral discount (jika ada), points discount (jika ada), total
- [ ] 2.7 Implementasi kalkulasi `subtotal` dan `totalPrice` lokal mengikuti logika `recalculateTotals` di `cartStore`
- [ ] 2.8 Tombol "Simpan" — validasi, panggil `updateInvoice`, tutup sheet, refresh data
- [ ] 2.9 Tombol "Batal" — tutup sheet tanpa save

## 3. Integrasi ke Tabel Orders

- [ ] 3.1 Identifikasi komponen tabel orders yang aktif (cek `src/app/(admin)/admin/` dan komponen terkait)
- [ ] 3.2 Tambah item "Edit" di dropdown actions baris invoice
- [ ] 3.3 Kontrol state `open` dan `selectedInvoice` di level komponen tabel
- [ ] 3.4 Render `<EditInvoiceSheet open={...} invoice={selectedInvoice} onClose={...} />` di luar tabel

## 4. Validasi Manual

- [ ] 4.1 Test edit item: tambah item, hapus item, ubah layanan → simpan → cek tabel orders di Supabase
- [ ] 4.2 Test edit diskon: tambah diskon, hapus diskon → simpan → cek order_discounts di Supabase
- [ ] 4.3 Cek total_price terhitung benar setelah edit
- [ ] 4.4 Cek invoice dengan referral/points: pastikan nilai read-only tidak berubah setelah simpan
- [ ] 4.5 Cek behavior error: simpan tanpa nama sepatu → harus gagal validasi
