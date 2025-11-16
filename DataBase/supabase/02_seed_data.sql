-- Seed básico para TryOnWeb
-- Ejecutar después de 01_create_tables.sql

-- Categorías base ----------------------------------------------------------
INSERT INTO public.categorias (id, nombre, descripcion)
VALUES
    (gen_random_uuid(), 'Accesorios', 'Gafas, relojes y complementos'),
    (gen_random_uuid(), 'Exterior', 'Chaquetas y prendas de abrigo'),
    (gen_random_uuid(), 'Calzado', 'Zapatillas y botas para probador virtual')
ON CONFLICT (nombre) DO NOTHING;

-- Prendas de ejemplo -------------------------------------------------------
WITH cat AS (
    SELECT id FROM public.categorias WHERE nombre = 'Accesorios' LIMIT 1
)
INSERT INTO public.prendas (id, categoria_id, nombre, tipo_prenda, talla, color, sku, valor_unitario, metadata)
SELECT
    gen_random_uuid(),
    cat.id,
    'Gafas Moderno AR',
    'Gafas',
    'Única',
    'Negro',
    'SKU-AR-001',
    120.00,
    jsonb_build_object('material', 'acetato', 'genero', 'unisex')
FROM cat
ON CONFLICT (sku) DO NOTHING;

-- Lens asset para la prenda ------------------------------------------------
WITH prenda AS (
    SELECT id FROM public.prendas WHERE sku = 'SKU-AR-001' LIMIT 1
)
INSERT INTO public.lens_assets (id, prenda_id, tipo, url, provider, version)
SELECT
    gen_random_uuid(),
    prenda.id,
    'lens',
    'https://cdn.tryonweb/lens/gafas-modernas',
    'snap',
    'v1.0'
FROM prenda
ON CONFLICT DO NOTHING;

-- Inventario base ----------------------------------------------------------
WITH prenda AS (
    SELECT id FROM public.prendas WHERE sku = 'SKU-AR-001' LIMIT 1
)
INSERT INTO public.inventario_items (id, prenda_id, ubicacion, cantidad, cantidad_minima)
SELECT gen_random_uuid(), prenda.id, 'Bodega Principal', 25, 5 FROM prenda
ON CONFLICT (prenda_id, ubicacion) DO NOTHING;

-- Reporte inicial ----------------------------------------------------------
INSERT INTO public.reportes (id, tipo, parametros, payload)
VALUES (
    gen_random_uuid(),
    'inventario',
    jsonb_build_object('fuente','seed'),
    jsonb_build_object('resumen','Inventario inicial cargado desde seed')
);
