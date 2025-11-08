-- Example Row-Level Security (RLS) policies for Supabase
-- Note: Supabase Auth provides a jwt with "sub" = auth.uid. Many projects keep a "users" table mirrored with that uuid.
-- Enable RLS per-table and add policies that fit your auth model.

-- Enable RLS for relevant tables
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
-- (Note: there is no 'usuarios' table in schema by default; adjust to 'users' if you mirror auth users)

-- Example for 'productos' - public can SELECT but only admins can INSERT/UPDATE/DELETE
ALTER TABLE IF EXISTS productos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT productos
CREATE POLICY IF NOT EXISTS "productos_select_public" ON productos
  FOR SELECT USING (true);

-- Allow only admins (users.is_admin) to INSERT/UPDATE/DELETE
CREATE POLICY IF NOT EXISTS "productos_manage_admins" ON productos
  FOR ALL USING (EXISTS (SELECT 1 FROM users u WHERE u.id = current_setting('request.jwt.claims.sub', true)::uuid AND u.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = current_setting('request.jwt.claims.sub', true)::uuid AND u.is_admin = true));

-- Example for 'clientes' - only admins or the client owner may view/update
ALTER TABLE IF EXISTS clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "clientes_select_admins" ON clientes
  FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = current_setting('request.jwt.claims.sub', true)::uuid AND u.is_admin = true));

-- Optionally allow a client to view their own record if you store auth_id in clientes
-- ALTER TABLE clientes ADD COLUMN auth_id uuid;
-- CREATE POLICY "clientes_select_owner" ON clientes
--   FOR SELECT USING (auth_id = current_setting('request.jwt.claims.sub', true)::uuid);

-- Note: policies must reflect your authentication mapping (Supabase auth sub claim to users table). Adjust as needed.

-- Important: To use current_setting('request.jwt.claims.sub', true) you must set the config in your Supabase edge function or DB connection: set_config('request.jwt.claims.sub', auth.uid::text, true)

-- This file should be adapted to your exact security model before enabling RLS in production.
