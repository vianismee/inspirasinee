## ADDED Requirements

### Requirement: Buka Edit Invoice Sheet
Admin MUST be able to open an edit panel for an active invoice from the orders table without navigating away.

#### Scenario: Buka dari action menu
- **WHEN** admin menekan tombol "Edit" pada baris invoice di tabel orders
- **THEN** sebuah Sheet (side drawer) terbuka berisi form edit untuk invoice tersebut
- **AND** form di-seed dengan data terkini: items (digroup per sepatu), diskon aktif, serta informasi referral/points sebagai read-only

#### Scenario: Invoice tidak ditemukan
- **WHEN** data invoice gagal dimuat saat sheet dibuka
- **THEN** sheet menampilkan pesan error dan tombol "Coba Lagi"

---

### Requirement: Edit Item Invoice
Admin MUST be able to add, remove, and modify items (shoe name + services) on an existing invoice.

#### Scenario: Tambah item baru
- **WHEN** admin menekan "+ Tambah Item" di dalam sheet edit
- **THEN** baris item baru muncul dengan field nama sepatu kosong dan belum ada layanan

#### Scenario: Tambah layanan ke item
- **WHEN** admin memilih layanan dari combobox pada sebuah item
- **THEN** layanan tersebut ditambahkan ke daftar layanan item
- **AND** subtotal di ringkasan bawah langsung terupdate

#### Scenario: Hapus layanan dari item
- **WHEN** admin menekan tombol × pada badge layanan
- **THEN** layanan dihapus dari item tersebut
- **AND** subtotal langsung terupdate

#### Scenario: Hapus item
- **WHEN** admin menekan tombol hapus (trash) pada sebuah item
- **AND** masih ada minimal 1 item lain
- **THEN** item tersebut dihapus dari daftar
- **AND** subtotal langsung terupdate

#### Scenario: Tidak bisa hapus item terakhir
- **WHEN** hanya tersisa 1 item di daftar
- **THEN** tombol hapus item tersebut dalam keadaan disabled

---

### Requirement: Edit Diskon Invoice
Admin MUST be able to add and remove manual discounts (`order_discounts`) on an invoice.

#### Scenario: Tambah diskon
- **WHEN** admin memilih diskon dari dropdown yang tersedia
- **THEN** diskon ditambahkan ke daftar diskon aktif
- **AND** total_price di ringkasan langsung terupdate

#### Scenario: Hapus diskon
- **WHEN** admin menekan tombol × pada diskon aktif
- **THEN** diskon dihapus dari daftar
- **AND** total_price langsung terupdate

#### Scenario: Tidak ada opsi diskon tersisa
- **WHEN** semua diskon yang tersedia sudah diterapkan
- **THEN** dropdown diskon menampilkan pesan "Tidak Ada Diskon Lagi" dan dalam keadaan disabled

---

### Requirement: Ringkasan Harga Read-Only untuk Referral dan Poin
The system SHALL display referral discount and points discount as read-only information in the edit sheet, incorporated into the total_price calculation but not editable.

#### Scenario: Tampil referral discount
- **WHEN** `orders.referral_discount_amount > 0`
- **THEN** sheet edit menampilkan baris "Referral (kode)" dengan nilai diskon
- **AND** baris ini tidak memiliki tombol hapus atau input apapun

#### Scenario: Tampil points discount
- **WHEN** `orders.points_discount_amount > 0`
- **THEN** sheet edit menampilkan baris "Poin (X poin)" dengan nilai diskon
- **AND** baris ini tidak memiliki tombol hapus atau input apapun

#### Scenario: Total price ikut diperhitungkan
- **WHEN** admin mengubah items atau diskon
- **THEN** total_price = subtotal_baru - diskon_manual_baru - referral_discount (lama, fixed) - points_discount (lama, fixed)

---

### Requirement: Simpan Perubahan Invoice
The system MUST save all invoice changes in one consistent save operation across order_item, order_discounts, and orders tables.

#### Scenario: Simpan berhasil
- **WHEN** admin menekan tombol "Simpan"
- **AND** semua item memiliki nama sepatu dan minimal 1 layanan
- **THEN** sistem melakukan:
  1. Insert `order_item` baru untuk invoice ini
  2. Delete `order_item` lama untuk invoice ini
  3. Delete `order_discounts` lama untuk invoice ini
  4. Insert `order_discounts` baru (jika ada)
  5. Update `orders.subtotal` dan `orders.total_price`
- **AND** toast sukses ditampilkan
- **AND** sheet ditutup
- **AND** data tabel orders di-refresh

#### Scenario: Validasi gagal sebelum simpan
- **WHEN** admin menekan "Simpan"
- **AND** ada item yang belum memiliki nama sepatu atau belum ada layanan
- **THEN** toast error ditampilkan
- **AND** sheet tetap terbuka

#### Scenario: Simpan gagal (error DB)
- **WHEN** operasi simpan ke database mengalami error
- **THEN** toast error ditampilkan dengan pesan yang jelas
- **AND** sheet tetap terbuka agar admin bisa mencoba lagi
