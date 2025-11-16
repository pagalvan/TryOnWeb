# TryOnWeb - Supabase Database Scripts

Scripts alineados con los módulos del proyecto (inventario, probador virtual, gestión de usuarios, recomendaciones y reportes). Todos los archivos están diseñados para ejecutarse en Supabase/PostgreSQL.

## Archivos

| Archivo | Descripción |
| --- | --- |
| `01_create_tables.sql` | Esquema principal con tablas, llaves foráneas e índices. Incluye `profiles`, `prendas`, `lens_assets`, inventario, probador virtual, recomendaciones y reportes. |
| `02_seed_data.sql` | Datos de referencia mínimos (categorías, una prenda, asset lens e inventario). Útil para pruebas iniciales. |
| `03_row_level_security.sql` | Función helper + activación de RLS y policies basadas en `auth.uid()` y el rol almacenado en `profiles`. |

## Orden sugerido de ejecución

1. `01_create_tables.sql`
2. `02_seed_data.sql` (opcional)
3. `03_row_level_security.sql`

Puedes ejecutar cada archivo desde la consola SQL de Supabase o mediante `psql`:

```sql
\i DataBase/supabase/01_create_tables.sql;
\i DataBase/supabase/02_seed_data.sql;
\i DataBase/supabase/03_row_level_security.sql;
```

## Notas importantes

- `profiles.id` debe coincidir con `auth.users.id`. Asegúrate de insertar un registro en `profiles` tras el signup (mediante trigger o edge function).
- Todas las tablas usan UUID (`gen_random_uuid()`), por lo que es necesario que la extensión `pgcrypto` esté habilitada (el script ya la crea si no existe).
- No se incluye lógica de ventas. El inventario se usa para control interno y el probador virtual se apoya en `lens_assets` y `tryon_sessions`.
- Ajusta las policies según los requerimientos de tu app (por ejemplo, permitir que clientes lean catálogos completos aunque no estén autenticados).
- Para métricas (prendas más consultadas) usa la tabla `product_events` o genera reportes periódicos almacenados en `reportes`.
