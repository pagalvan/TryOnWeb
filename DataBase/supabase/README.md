TryOnWeb - Supabase SQL scripts

Purpose
- Provide a structured set of SQL files ready to apply to a Supabase (Postgres) project.
- Files included:
  - schema.sql     -- DDL for tables used by the frontend (productos, categorias, clientes, ventas, creditos, abonos, inventario, ar_assets, settings, reportes)
  - functions.sql  -- PL/pgSQL functions and triggers (validations, update deuda, abono handling, strikes updater)
  - seed.sql       -- Optional sample data for local/dev testing
  - policies.sql   -- Example RLS policies and notes for Supabase

How to use
1) Open your Supabase project and go to the SQL editor (or use psql).
2) Run files in order:
   - schema.sql
   - functions.sql
   - policies.sql (review and adjust policies to your auth model)
   - seed.sql (optional)

If using psql locally:
psql -h <host> -p <port> -U <user> -d <db> -f schema.sql
psql -f functions.sql
psql -f policies.sql
psql -f seed.sql

Notes / Differences vs Oracle example
- This is Postgres (Supabase) SQL, not Oracle PL/SQL. Sequences/IDENTITY handled via UUIDs (gen_random_uuid()).
- Scheduling the `actualizar_strikes_vencidos` function is not done here; use Supabase Scheduled Functions or pg_cron.
- RLS policies must be adapted to how you map auth users to the `users` table. Review `policies.sql` before enabling RLS.

Recommended next steps
- Add an `auth_id` (uuid) column to `users` or `clientes` if you want to map Supabase auth users directly.
- Add more granular policies per table (ventas, creditos, abonos).
- Add migrations integration (pgm or freight) for production deployments.

If quieres, puedo:
- Añadir columnas `auth_id` y ejemplos de políticas para que los usuarios autenticados solo vean sus propios clientes/ventas.
- Generar migraciones SQL separadas (timestamped) para integrarlas en un CI/CD.
