-- ============================================================
-- TIGHTEN RLS — drop public read, authenticated-only
-- JALANKAN DI SUPABASE SQL EDITOR SETELAH:
--   1. Task 4 (/api/track) & Task 5 (/api/customer-dashboard) sudah LIVE di Vercel
--   2. database/gate-admin-add-email.sql sudah dijalankan & email admin terisi
-- URUTAN PENTING: jika dijalankan sebelum API live → tracking & dashboard produksi OUTAGE.
-- ============================================================

-- 0. AUDIT DULU — catat hasil sebelum lanjut (bandingkan dengan sesudah)
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- 1. Drop SEMUA policy public-read lama
DROP POLICY IF EXISTS "Orders - Public Read Access" ON orders;
DROP POLICY IF EXISTS "Customers - Public Read Access" ON customers;
DROP POLICY IF EXISTS "Points Transactions - Public Read Access" ON points_transactions;
DROP POLICY IF EXISTS "Order Item - Public Read Access" ON order_item;
DROP POLICY IF EXISTS "Referral Usage - Public Read Access" ON referral_usage;
DROP POLICY IF EXISTS "Enable select for all users" ON orders;
DROP POLICY IF EXISTS "Enable select for all users" ON customers;
DROP POLICY IF EXISTS "Enable select for all users" ON points_transactions;
DROP POLICY IF EXISTS "Enable select for all users" ON order_item;
DROP POLICY IF EXISTS "Enable select for all users" ON referral_usage;

-- 2. RLS ON di tabel inti
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_usage ENABLE ROW LEVEL SECURITY;

-- 3. Hanya user ter-authenticated (admin login) boleh SELECT
--    (tracking & dashboard publik sudah lewat API service-role yang bypass RLS)
CREATE POLICY "authenticated read" ON orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON points_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON order_item
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read" ON referral_usage
  FOR SELECT TO authenticated USING (true);

-- 4. VERIFIKASI SESUDAH
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename;

-- 5. SMOKE TEST (dari terminal lokal, ganti <ANON_KEY> dengan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY):
--    curl "https://yrknpwyindvfevhkionn.supabase.co/rest/v1/customers?select=*" -H "apikey: <ANON_KEY>"
--    EXPECTED: permission denied / rows kosong — BUKAN list customer.

-- CATATAN:
-- - Policy WRITE (INSERT/UPDATE dari admin UI) TIDAK diubah oleh script ini.
--   Jika setelah script ini admin UI gagal menyimpan data, jalankan per tabel yang rusak:
--     CREATE POLICY "authenticated write" ON <tabel>
--       FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- - Referral flow publik (validasi kode referral tanpa login) query customers dari
--   server component anon — setelah script ini tetap jalan HANYA jika policy
--   "authenticated read" di atas cukup. Jika referral publik rusak, lapor ke Hermes
--   untuk dibuat route handler pengganti (pola sama dengan /api/track).
