-- =============================================================
-- TryOnWeb - Esquema de Base de Datos Unificado
-- Contiene: Tablas, Índices, Triggers y Funciones
-- =============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    phone text,
    role text NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente','admin')),
    preferences jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Categorías
CREATE TABLE IF NOT EXISTS public.categorias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text UNIQUE NOT NULL,
    descripcion text,
    estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva')),
    icon text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Prendas (Catálogo)
CREATE TABLE IF NOT EXISTS public.prendas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
    nombre text NOT NULL,
    tipo_prenda text,
    descripcion text,
    talla text,
    color text,
    fit text,
    sku text UNIQUE,
    estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','reservada','inactiva')),
    valor_unitario numeric(12,2) CHECK (valor_unitario >= 0),
    metadata jsonb,
    destacado boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Activos AR (Lens Assets)
CREATE TABLE IF NOT EXISTS public.lens_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('glb','lens','image','video','anchor')),
    url text NOT NULL,
    provider text,
    version text,
    metadata jsonb,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Bodegas de Inventario
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

-- 6. Items de Inventario (Stock)
CREATE TABLE IF NOT EXISTS public.inventario_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    bodega_id uuid NOT NULL REFERENCES public.inventario_bodegas(id),
    ubicacion text, -- Se mantiene por compatibilidad, debe coincidir con bodega.nombre
    cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    cantidad_minima integer NOT NULL DEFAULT 5 CHECK (cantidad_minima >= 0),
    estado text NOT NULL DEFAULT 'ok' CHECK (estado IN ('ok','bajo','sin_stock','bloqueado')),
    notas text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (prenda_id, bodega_id)
);

-- 7. Movimientos de Inventario
CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id uuid NOT NULL REFERENCES public.inventario_items(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','conteo')),
    cantidad integer NOT NULL,
    motivo text,
    referencia text,
    realizado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Medidas Corporales
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    altura_cm numeric(5,2) CHECK (altura_cm > 0),
    peso_kg numeric(6,2) CHECK (peso_kg > 0),
    pecho_cm numeric(6,2) CHECK (pecho_cm >= 0),
    cintura_cm numeric(6,2) CHECK (cintura_cm >= 0),
    cadera_cm numeric(6,2) CHECK (cadera_cm >= 0),
    complexion text CHECK (complexion IN ('delgada','media','atletica','robusta')),
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Sesiones de Probador Virtual
CREATE TABLE IF NOT EXISTS public.tryon_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dispositivo text,
    plataforma text,
    origen text,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    metadata jsonb
);

-- 10. Items Probados
CREATE TABLE IF NOT EXISTS public.tryon_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.tryon_sessions(id) ON DELETE CASCADE,
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    lens_asset_id uuid REFERENCES public.lens_assets(id) ON DELETE SET NULL,
    estado text CHECK (estado IN ('exito','parcial','descartado','pendiente')),
    duracion_seg integer CHECK (duracion_seg >= 0),
    feedback jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, prenda_id)
);

-- 11. Ejecuciones de Recomendación
CREATE TABLE IF NOT EXISTS public.recommendation_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    estrategia text NOT NULL,
    version text,
    parametros jsonb,
    ejecutado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Recomendaciones
CREATE TABLE IF NOT EXISTS public.recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    run_id uuid REFERENCES public.recommendation_runs(id) ON DELETE SET NULL,
    tipo text NOT NULL CHECK (tipo IN ('automatica','manual','estacional','personalizada')),
    estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','vista','aplicada','descartada')),
    contexto jsonb,
    mensaje text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Items Recomendados
CREATE TABLE IF NOT EXISTS public.recommendation_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id uuid NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    score numeric(5,2) CHECK (score BETWEEN 0 AND 100),
    razon text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (recommendation_id, prenda_id)
);

-- 14. Eventos de Producto (Analytics)
CREATE TABLE IF NOT EXISTS public.product_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    prenda_id uuid REFERENCES public.prendas(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('view','tryon','favorite','share')),
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. Reportes
CREATE TABLE IF NOT EXISTS public.reportes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    tipo text NOT NULL CHECK (tipo IN ('inventario','tryon','recomendaciones','catalogo')),
    parametros jsonb,
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 16. Favoritos de Producto
CREATE TABLE IF NOT EXISTS public.product_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (profile_id, prenda_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_prendas_categoria ON public.prendas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_prendas_estado ON public.prendas(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_prenda ON public.inventario_items(prenda_id);
CREATE INDEX IF NOT EXISTS idx_inventario_bodega ON public.inventario_items(bodega_id);
CREATE INDEX IF NOT EXISTS idx_bodegas_nombre ON public.inventario_bodegas(LOWER(nombre));
CREATE INDEX IF NOT EXISTS idx_tryon_sessions_profile ON public.tryon_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_profile ON public.recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_product_events_prenda ON public.product_events(prenda_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_profile ON public.product_favorites(profile_id);

-- Trigger para creación automática de perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, phone, preferences, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
        NEW.raw_user_meta_data->>'telefono',
        '{}'::jsonb,
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        phone = EXCLUDED.phone,
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
