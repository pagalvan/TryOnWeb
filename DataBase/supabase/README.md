# TryOnWeb - Supabase Database Scripts

Scripts alineados con los módulos del proyecto (inventario, probador virtual, gestión de usuarios, recomendaciones y reportes). Todos los archivos están diseñados para ejecutarse en Supabase/PostgreSQL.

## Archivos

| Archivo | Descripción |
| --- | --- |
| `01_schema.sql` | Esquema completo de la base de datos. Incluye todas las tablas (`profiles`, `prendas`, `inventario`, `tryon_sessions`, etc.), índices, triggers y funciones. |
| `02_policies.sql` | Configuración de seguridad. Habilita Row Level Security (RLS) en todas las tablas y define las políticas de acceso para lectura y escritura. |
| `03_seed.sql` | Datos iniciales y de demostración. Incluye categorías, prendas de prueba, datos para el dashboard, y configuración de Storage Buckets. |

## Orden sugerido de ejecución

1. `01_schema.sql` - Crea la estructura.
2. `02_policies.sql` - Aplica la seguridad.
3. `03_seed.sql` - Carga datos y configura almacenamiento.

Puedes ejecutar cada archivo desde la consola SQL de Supabase o mediante `psql`:

```sql
\i DataBase/supabase/01_schema.sql;
\i DataBase/supabase/02_policies.sql;
\i DataBase/supabase/03_seed.sql;
```

## Notas importantes

- **Estructura Consolidada**: Se han unificado múltiples scripts de migración en estos 3 archivos principales para facilitar el mantenimiento y despliegue.
- `profiles.id` debe coincidir con `auth.users.id`. Asegúrate de insertar un registro en `profiles` tras el signup (mediante trigger o edge function).
- Todas las tablas usan UUID (`gen_random_uuid()`), por lo que es necesario que la extensión `pgcrypto` esté habilitada (el script ya la crea si no existe).
- No se incluye lógica de ventas. El inventario se usa para control interno y el probador virtual se apoya en `lens_assets` y `tryon_sessions`.
- Ajusta las policies según los requerimientos de tu app (por ejemplo, permitir que clientes lean catálogos completos aunque no estén autenticados).
- Para métricas (prendas más consultadas) usa la tabla `product_events` o genera reportes periódicos almacenados en `reportes`.
