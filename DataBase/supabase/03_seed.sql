-- =============================================================
-- TryOnWeb - Datos Semilla (Seed) y Demo
-- Contiene: Datos iniciales obligatorios y datos de demostración
-- =============================================================

-- 1. Configuración Inicial (Storage & Bodegas)

-- Crear bucket de storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('tryon-snapshots', 'tryon-snapshots', true)
ON CONFLICT (id) DO NOTHING;

-- Crear Bodega Principal
INSERT INTO public.inventario_bodegas (nombre, descripcion)
VALUES ('Bodega Principal', 'Ubicación por defecto para inventario general')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Datos Básicos (Categorías, Prendas Base)

-- Categorías base
INSERT INTO public.categorias (id, nombre, descripcion)
VALUES
    (gen_random_uuid(), 'Accesorios', 'Gafas, relojes y complementos'),
    (gen_random_uuid(), 'Exterior', 'Chaquetas y prendas de abrigo'),
    (gen_random_uuid(), 'Calzado', 'Zapatillas y botas para probador virtual')
ON CONFLICT (nombre) DO NOTHING;

-- Prenda de ejemplo (Gafas AR)
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
    120000,
    jsonb_build_object('material', 'acetato', 'genero', 'unisex')
FROM cat
ON CONFLICT (sku) DO NOTHING;

-- Lens asset para la prenda
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

-- Inventario base para la prenda
WITH prenda AS (
    SELECT id FROM public.prendas WHERE sku = 'SKU-AR-001' LIMIT 1
),
bodega AS (
    SELECT id FROM public.inventario_bodegas WHERE nombre = 'Bodega Principal' LIMIT 1
)
INSERT INTO public.inventario_items (id, prenda_id, bodega_id, ubicacion, cantidad, cantidad_minima)
SELECT gen_random_uuid(), prenda.id, bodega.id, 'Bodega Principal', 25, 5 
FROM prenda, bodega
ON CONFLICT (prenda_id, bodega_id) DO NOTHING;

-- 3. Datos Demo (Dashboard, Analytics, Más Prendas)
-- Nota: Elimina datos previos marcados como 'demo-dashboard' para evitar duplicados al re-ejecutar

DELETE FROM public.tryon_items
WHERE session_id IN (
    SELECT id FROM public.tryon_sessions WHERE metadata ->> 'seed' = 'demo-dashboard'
);
DELETE FROM public.tryon_sessions WHERE metadata ->> 'seed' = 'demo-dashboard';
DELETE FROM public.product_events WHERE metadata ->> 'seed' = 'demo-dashboard';
DELETE FROM public.inventario_movimientos WHERE metadata ->> 'seed' = 'demo-dashboard';

-- Categorías extras
INSERT INTO public.categorias (id, nombre, descripcion)
VALUES
    (gen_random_uuid(), 'Athleisure', 'Estilos deportivos para uso diario'),
    (gen_random_uuid(), 'Sastrería', 'Trajes, blazers y prendas formales'),
    (gen_random_uuid(), 'Resort', 'Prendas ligeras para clima cálido'),
    (gen_random_uuid(), 'Hybrid Tech', 'Materiales técnicos para commuting urbano')
ON CONFLICT (nombre) DO NOTHING;

-- Prendas Demo
WITH catalogo AS (
    SELECT nombre, id FROM public.categorias WHERE nombre IN ('Athleisure','Sastrería','Resort','Hybrid Tech')
),
prendas_nuevas AS (
    SELECT * FROM (VALUES
        ('ATH-NEB-001','Set Jogger Nebula','Athleisure','Jogger','Lila Nebula','unisex', 189000, jsonb_build_object('material','DryFlex','fit','relajado')),
        ('ATH-ION-002','Top Vapor Ion','Athleisure','Top','Azul Vapor','mujer', 129000, jsonb_build_object('material','IonMesh','fit','slim')),
        ('SAS-GRA-101','Blazer Graphite','Sastrería','Blazer','Grafito','hombre', 420000, jsonb_build_object('estructura','semi entallada')),
        ('RES-LIM-210','Guayabera Lima','Resort','Guayabera','Lima','hombre', 210000, jsonb_build_object('material','lino','coleccion','Resort 25')),
        ('HYB-MTR-350','Chaqueta Metro Shell','Hybrid Tech','Chaqueta','Azul profundo','unisex', 560000, jsonb_build_object('impermeable',true,'bolsillos',4))
    ) AS data(sku, nombre, categoria_nombre, tipo_prenda, color, genero, valor_unitario, metadata)
)
INSERT INTO public.prendas (id, categoria_id, nombre, tipo_prenda, descripcion, talla, color, sku, valor_unitario, metadata)
SELECT gen_random_uuid(), c.id, p.nombre, p.tipo_prenda, CONCAT(p.nombre,' ',p.color), 'M', p.color, p.sku, p.valor_unitario, p.metadata
FROM prendas_nuevas p
JOIN catalogo c ON c.nombre = p.categoria_nombre
ON CONFLICT (sku) DO NOTHING;

-- Lens Assets Demo
WITH nuevas AS (
    SELECT id, sku FROM public.prendas WHERE sku IN ('ATH-NEB-001','ATH-ION-002','SAS-GRA-101','RES-LIM-210','HYB-MTR-350')
)
INSERT INTO public.lens_assets (id, prenda_id, tipo, url, provider, version)
SELECT gen_random_uuid(), n.id, 'lens',
       CONCAT('https://cdn.tryonweb.dev/lens/', lower(n.sku)),
       'snap',
       'v1.1'
FROM nuevas n
ON CONFLICT DO NOTHING;

-- Inventario Demo (Bodega Principal)
WITH prendas_objetivo AS (
    SELECT id, sku FROM public.prendas WHERE sku IN ('ATH-NEB-001','ATH-ION-002','SAS-GRA-101','RES-LIM-210','HYB-MTR-350')
),
bodega AS (
    SELECT id FROM public.inventario_bodegas WHERE nombre = 'Bodega Principal' LIMIT 1
)
INSERT INTO public.inventario_items (id, prenda_id, bodega_id, ubicacion, cantidad, cantidad_minima, estado)
SELECT gen_random_uuid(), p.id, bodega.id, 'Bodega Principal', (random()*50)::int + 5, 5, 'ok'
FROM prendas_objetivo p, bodega
ON CONFLICT (prenda_id, bodega_id) DO NOTHING;

-- Movimientos Demo
WITH items AS (
    SELECT ii.id, ii.prenda_id
    FROM public.inventario_items ii
    JOIN public.prendas p ON p.id = ii.prenda_id
    WHERE p.sku IN ('ATH-NEB-001','ATH-ION-002','SAS-GRA-101','RES-LIM-210','HYB-MTR-350')
),
plantilla AS (
    SELECT * FROM (VALUES
        ('entrada', 35, 'Reposición central'),
        ('salida', 14, 'Transferencia a tienda'),
        ('entrada', 22, 'Llegada colección cápsula')
    ) AS t(tipo, cantidad, motivo)
)
INSERT INTO public.inventario_movimientos (id, inventario_id, tipo, cantidad, motivo, referencia, metadata)
SELECT gen_random_uuid(), i.id, t.tipo, t.cantidad, t.motivo,
       CONCAT('RF-', to_char(now(), 'MMDD'), '-', lpad((row_number() OVER())::text, 3, '0')),
       jsonb_build_object('seed','demo-dashboard')
FROM items i
CROSS JOIN plantilla t
ON CONFLICT DO NOTHING;

-- Eventos Demo
WITH prendas_demo AS (
    SELECT id, sku FROM public.prendas WHERE sku IN ('ATH-NEB-001','ATH-ION-002','SAS-GRA-101','RES-LIM-210','HYB-MTR-350')
),
calendar AS (
    SELECT generate_series(0, 29) AS day_offset
),
event_types AS (
    SELECT * FROM (VALUES ('view', 0.55), ('tryon', 0.25), ('favorite', 0.12), ('share', 0.08)) AS e(event_type, weight)
)
INSERT INTO public.product_events (id, prenda_id, event_type, metadata, created_at)
SELECT gen_random_uuid(), p.id, e.event_type,
       jsonb_build_object('seed','demo-dashboard','sku', p.sku),
       now() - (c.day_offset || ' days')::interval - make_interval(hours => (random()*12)::int)
FROM prendas_demo p
CROSS JOIN calendar c
CROSS JOIN event_types e
WHERE random() < e.weight;

-- Reportes Demo
INSERT INTO public.reportes (id, tipo, parametros, payload)
VALUES
    (gen_random_uuid(), 'inventario', jsonb_build_object('fuente','demo-dashboard'), jsonb_build_object('resumen','Reabastecimiento Athleisure confirmado.')),
    (gen_random_uuid(), 'tryon', jsonb_build_object('fuente','demo-dashboard'), jsonb_build_object('resumen','Sesiones espejo smart mirror completadas.')),
    (gen_random_uuid(), 'catalogo', jsonb_build_object('fuente','demo-dashboard'), jsonb_build_object('resumen','Colección Resort destacada en el home.'))
ON CONFLICT DO NOTHING;
