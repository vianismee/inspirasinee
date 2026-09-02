-- Gate /admin via admin_users role lookup.
-- Run manually in Supabase SQL Editor. Jangan dijalankan oleh agent/tools.

-- (a) Audit policy existing pada admin_users
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_users';

-- (b) Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- (c) Authenticated users boleh SELECT (dibutuhkan middleware anon client + session cookie)
CREATE POLICY "authenticated read" ON public.admin_users
  FOR SELECT TO authenticated
  USING (true);

-- (d) Seed email admin
-- TODO: ganti placeholder email di bawah dengan email admin asli SEBELUM run.
INSERT INTO public.admin_users (email) VALUES ('admin@example.com')
ON CONFLICT (email) DO NOTHING;
