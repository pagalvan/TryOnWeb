-- ============================================================================
-- 05_inventory_locations.sql
-- Objetivo: normalizar ubicaciones de inventario y habilitar bodegas reutilizables
-- Ejecutar después de 01_create_tables.sql (y antes de datos demo opcionales).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Crear catálogo de bodegas si no existe
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventario_bodegas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text UNIQUE NOT NULL,
    descripcion text,
    direccion text,
    ciudad text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Garantizar al menos una bodega base
INSERT INTO public.inventario_bodegas (nombre, descripcion)
VALUES ('Bodega Principal', 'Ubicación por defecto para inventario general')
ON CONFLICT (nombre) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) Añadir referencia a bodegas desde inventario_items
-- ---------------------------------------------------------------------------
ALTER TABLE public.inventario_items
ADD COLUMN IF NOT EXISTS bodega_id uuid REFERENCES public.inventario_bodegas(id);

-- ---------------------------------------------------------------------------
-- 3) Crear bodegas a partir de ubicaciones existentes (si no estaban normalizadas)
-- ---------------------------------------------------------------------------
WITH existing_locations AS (
    SELECT DISTINCT TRIM(ubicacion) AS nombre
    FROM public.inventario_items
    WHERE ubicacion IS NOT NULL AND TRIM(ubicacion) <> ''
)
INSERT INTO public.inventario_bodegas (nombre)
SELECT nombre FROM existing_locations
WHERE nombre IS NOT NULL
ON CONFLICT (nombre) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) Actualizar inventario_items para enlazar bodegas y normalizar nombres
-- ---------------------------------------------------------------------------
-- Asignar "Bodega Principal" a registros sin ubicación definida
WITH default_bodega AS (
    SELECT id FROM public.inventario_bodegas WHERE nombre = 'Bodega Principal' LIMIT 1
)
UPDATE public.inventario_items
SET ubicacion = 'Bodega Principal'
WHERE (ubicacion IS NULL OR TRIM(ubicacion) = '')
  AND EXISTS (SELECT 1 FROM default_bodega);

-- Vincular cada registro con su bodega correspondiente
UPDATE public.inventario_items AS ii
SET bodega_id = b.id
FROM public.inventario_bodegas AS b
WHERE (ii.ubicacion IS NOT NULL AND TRIM(ii.ubicacion) = b.nombre)
  AND (ii.bodega_id IS DISTINCT FROM b.id);

-- Asegurar que la columna bodega_id no quede nula
WITH default_bodega AS (
    SELECT id FROM public.inventario_bodegas WHERE nombre = 'Bodega Principal' LIMIT 1
)
UPDATE public.inventario_items
SET bodega_id = (SELECT id FROM default_bodega)
WHERE bodega_id IS NULL
  AND EXISTS (SELECT 1 FROM default_bodega);

ALTER TABLE public.inventario_items
ALTER COLUMN bodega_id SET NOT NULL;

-- Mantener el nombre sincronizado con la bodega asociada
UPDATE public.inventario_items AS ii
SET ubicacion = b.nombre
FROM public.inventario_bodegas AS b
WHERE ii.bodega_id = b.id
  AND ii.ubicacion IS DISTINCT FROM b.nombre;

-- ---------------------------------------------------------------------------
-- 5) Índices de apoyo
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inventario_bodega ON public.inventario_items(bodega_id);
CREATE INDEX IF NOT EXISTS idx_bodegas_nombre ON public.inventario_bodegas(LOWER(nombre));

COMMIT;
