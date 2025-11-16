-- =============================================================
-- Row Level Security (RLS) & Policies para TryOnWeb
-- Ejecutar después de crear las tablas.
-- =============================================================

-- Helper: función para obtener rol del perfil --------------------------------
CREATE OR REPLACE FUNCTION public.profile_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Habilitar RLS -------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lens_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- Policies ------------------------------------------------------------------
-- Profiles: cada usuario gestiona su registro, admins tienen acceso completo.
CREATE POLICY profiles_self_access ON public.profiles
  FOR SELECT USING (id = auth.uid() OR profile_role() = 'admin');
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT WITH CHECK (profile_role() = 'admin');

-- Prendas & categorías: lectura pública, escritura solo admin
CREATE POLICY prendas_read ON public.prendas
  FOR SELECT USING (true);
CREATE POLICY prendas_admin_write ON public.prendas
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');

CREATE POLICY categorias_read ON public.categorias
  FOR SELECT USING (true);
CREATE POLICY categorias_admin_write ON public.categorias
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');

-- Lens assets: lectura general, escritura admin
CREATE POLICY lens_assets_read ON public.lens_assets
  FOR SELECT USING (true);
CREATE POLICY lens_assets_admin ON public.lens_assets
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');

-- Inventario: solo admin puede ver/editar stock detallado
CREATE POLICY inventario_admin ON public.inventario_items
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');
CREATE POLICY inventario_mov_admin ON public.inventario_movimientos
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');

-- Try-on: cada usuario ve sus sesiones; admin ve todas
CREATE POLICY tryon_sessions_self ON public.tryon_sessions
  FOR SELECT USING (profile_id = auth.uid() OR profile_role() = 'admin');
CREATE POLICY tryon_sessions_insert_self ON public.tryon_sessions
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY tryon_sessions_admin_write ON public.tryon_sessions
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');

CREATE POLICY tryon_items_self ON public.tryon_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tryon_sessions s
      WHERE s.id = tryon_items.session_id
        AND (s.profile_id = auth.uid() OR profile_role() = 'admin')
    )
  );
CREATE POLICY tryon_items_insert_self ON public.tryon_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tryon_sessions s
      WHERE s.id = tryon_items.session_id AND s.profile_id = auth.uid()
    )
  );

-- Recomendaciones: usuario ve sus recomendaciones
CREATE POLICY recommendations_self ON public.recommendations
  FOR SELECT USING (profile_id = auth.uid() OR profile_role() = 'admin');
CREATE POLICY recommendation_items_self ON public.recommendation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recommendations r
      WHERE r.id = recommendation_items.recommendation_id
        AND (r.profile_id = auth.uid() OR profile_role() = 'admin')
    )
  );
CREATE POLICY recommendations_admin_write ON public.recommendations
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');

-- Product events: usuarios pueden insertar eventos propios, admin ve todo
CREATE POLICY product_events_read ON public.product_events
  FOR SELECT USING (profile_role() = 'admin' OR profile_id = auth.uid());
CREATE POLICY product_events_insert_self ON public.product_events
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Body measurements: cada perfil maneja su historial
CREATE POLICY body_measurements_self ON public.body_measurements
  FOR SELECT USING (profile_id = auth.uid() OR profile_role() = 'admin');
CREATE POLICY body_measurements_insert_self ON public.body_measurements
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Reportes: solo admin
CREATE POLICY reportes_admin ON public.reportes
  FOR ALL USING (profile_role() = 'admin') WITH CHECK (profile_role() = 'admin');

-- Nota: las policies dependen de que el usuario tenga un registro en profiles.
-- Considera crear triggers para insertar profiles en signup.
