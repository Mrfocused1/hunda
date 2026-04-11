-- ========================================
-- RLS LOCKDOWN — run this AFTER adding SUPABASE_SERVICE_ROLE_KEY to Vercel
-- and confirming the /api/admin/* endpoints work from the admin panel.
--
-- Before running this:
--   1. Set SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (all environments).
--   2. Redeploy.
--   3. Log into /admin-login and try adding/editing a product. It should
--      still work because admin.js now routes writes through /api/admin/products
--      using the Supabase Auth JWT.
--   4. ONLY THEN run this migration. It removes public write access from
--      products, media_items and site_settings so only the service_role
--      key (used by the admin API) can modify them.
--
-- If you run this too early, the admin panel will stop being able to save
-- changes. That's recoverable: re-run with the DROP POLICY lines from the
-- "rollback" block at the bottom, and the public-write policies come back.
-- ========================================

-- Products: SELECT-only for anon
DROP POLICY IF EXISTS "Public write products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Media items: SELECT-only for anon
DROP POLICY IF EXISTS "Public write media" ON media_items;
CREATE POLICY "Public read media items" ON media_items FOR SELECT USING (true);

-- Site settings: SELECT-only for anon (writes via service_role only)
DROP POLICY IF EXISTS "Public write settings" ON site_settings;
CREATE POLICY "Public read settings items" ON site_settings FOR SELECT USING (true);

-- Storage: keep media bucket uploads permissive for now (files are already
-- stored via the client, tightening this requires moving uploads behind
-- /api/admin/upload which is a bigger change).

-- ========================================
-- ROLLBACK (uncomment and run if you need to restore public writes)
-- ========================================
-- CREATE POLICY "Public write products" ON products FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Public write media" ON media_items FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Public write settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
