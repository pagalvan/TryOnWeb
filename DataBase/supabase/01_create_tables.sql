-- =============================================================
-- TryOnWeb - Base de datos para Supabase (PostgreSQL)
-- Enfoque: Gestión de inventario + probador virtual + recomendaciones
-- Nota: Este script está pensado para ejecutarse en Supabase.
-- =============================================================

-- Extensiones necesarias ----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ===========================================================================
-- Tabla: profiles (metadatos de usuarios enlazados a Supabase Auth)
-- Cada registro corresponde a auth.users.id
-- ===========================================================================
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

-- ===========================================================================
-- Tabla: categorias
-- Agrupa las prendas por tipo, colección u otro criterio.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.categorias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text UNIQUE NOT NULL,
    descripcion text,
    estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva')),
    icon text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================================================================
-- Tabla: prendas (catálogo administrado)
-- No representa ventas; "valor_unitario" sirve para valoración de inventario.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.prendas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
    nombre text NOT NULL,
    tipo_prenda text,
    descripcion text,
    talla text,
    color text,
    fit text, -- regular, slim, oversized, etc.
    sku text UNIQUE,
    estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','reservada','inactiva')),
    valor_unitario numeric(12,2) CHECK (valor_unitario >= 0),
    metadata jsonb,
    destacado boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================================================================
-- Tabla: lens_assets (aplicación de lenses / activos AR por prenda)
-- Permite conectar con Snap Lens / modelos glb / imágenes de referencia.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.lens_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('glb','lens','image','video','anchor')),
    url text NOT NULL,
    provider text, -- snap, custom, unity, etc.
    version text,
    metadata jsonb,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================================================================
-- Tabla: inventario_items (stock por prenda y ubicación)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.inventario_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    ubicacion text NOT NULL,
    cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    cantidad_minima integer NOT NULL DEFAULT 5 CHECK (cantidad_minima >= 0),
    estado text NOT NULL DEFAULT 'ok' CHECK (estado IN ('ok','bajo','sin_stock','bloqueado')),
    notas text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (prenda_id, ubicacion)
);

-- ===========================================================================
-- Tabla: inventario_movimientos (historial de ajustes y conteos)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id uuid NOT NULL REFERENCES public.inventario_items(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','conteo')),
    cantidad integer NOT NULL,
    motivo text,
    referencia text, -- opcional: número de documento o enlace externo
    realizado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================================================================
-- Tabla: body_measurements (historial de medidas por usuario)
-- ===========================================================================
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

-- ===========================================================================
-- Tabla: tryon_sessions (probador virtual)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.tryon_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dispositivo text,
    plataforma text, -- ios, android, web, mirror, etc.
    origen text, -- catálogo, recomendacion, buscador, etc.
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    metadata jsonb
);

-- Items probados en cada sesión
CREATE TABLE IF NOT EXISTS public.tryon_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.tryon_sessions(id) ON DELETE CASCADE,
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    lens_asset_id uuid REFERENCES public.lens_assets(id) ON DELETE SET NULL,
    estado text CHECK (estado IN ('exito','parcial','descartado','pendiente')),
    duracion_seg integer CHECK (duracion_seg >= 0),
    feedback jsonb, -- calificaciones, reacciones, etc.
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, prenda_id)
);

-- ===========================================================================
-- Tabla: recommendation_runs (ejecuciones del motor de recomendaciones)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.recommendation_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    estrategia text NOT NULL, -- e.g. collaborative, content-based, manual
    version text,
    parametros jsonb,
    ejecutado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Recomendaciones emitidas a cada perfil
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

-- ===========================================================================
-- Tabla: product_events (para reportes de uso/consultas)
-- Guarda eventos de vista, búsqueda, favorito, etc.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.product_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    prenda_id uuid REFERENCES public.prendas(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('view','tryon','favorite','share')),
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================================================================
-- Tabla: reportes (snapshots de información)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.reportes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    tipo text NOT NULL CHECK (tipo IN ('inventario','tryon','recomendaciones','catalogo')),
    parametros jsonb,
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================================================================
-- Índices recomendados ------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_prendas_categoria ON public.prendas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_prendas_estado ON public.prendas(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_prenda ON public.inventario_items(prenda_id);
CREATE INDEX IF NOT EXISTS idx_inventario_estado ON public.inventario_items(estado);
CREATE INDEX IF NOT EXISTS idx_tryon_sessions_profile ON public.tryon_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_tryon_items_prenda ON public.tryon_items(prenda_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_profile ON public.recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_product_events_prenda ON public.product_events(prenda_id);
CREATE INDEX IF NOT EXISTS idx_product_events_type ON public.product_events(event_type);

-- ===========================================================================
-- Trigger: autogenera perfiles cuando se crea un usuario en auth.users
-- ===========================================================================
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

-- ===========================================================================
-- Comentarios útiles --------------------------------------------------------
COMMENT ON TABLE public.prendas IS 'Catálogo administrado; no representa ventas.';
COMMENT ON COLUMN public.lens_assets.tipo IS 'Tipo de activo (glb, lens, image, etc.) para el probador virtual.';
COMMENT ON TABLE public.tryon_sessions IS 'Sesiones de probador virtual iniciadas por los clientes.';
COMMENT ON TABLE public.recommendations IS 'Recomendaciones generadas según preferencias/medidas.';
COMMENT ON TABLE public.product_events IS 'Eventos para analytics (prendas más consultadas, etc.).';

-- Fin de archivo ------------------------------------------------------------
