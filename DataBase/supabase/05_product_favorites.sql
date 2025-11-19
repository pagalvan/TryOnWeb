-- Tabla: product_favorites (estado actual de favoritos por usuario)
CREATE TABLE IF NOT EXISTS public.product_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prenda_id uuid NOT NULL REFERENCES public.prendas(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (profile_id, prenda_id)
);

COMMENT ON TABLE public.product_favorites IS 'Relación de prendas marcadas como favoritas por perfil.';

ALTER TABLE public.product_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_favorites_select_self ON public.product_favorites
  FOR SELECT USING (profile_role() = 'admin' OR profile_id = auth.uid());

CREATE POLICY product_favorites_insert_self ON public.product_favorites
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY product_favorites_delete_self ON public.product_favorites
  FOR DELETE USING (profile_role() = 'admin' OR profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_product_favorites_profile ON public.product_favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_prenda ON public.product_favorites(prenda_id);
