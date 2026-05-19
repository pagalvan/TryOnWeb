-- Create table for saved try-on history
CREATE TABLE IF NOT EXISTS public.saved_tryons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prenda_id uuid REFERENCES public.prendas(id) ON DELETE SET NULL,
    image_url text NOT NULL,
    tryon_type text NOT NULL CHECK (tryon_type IN ('ai', 'lens')),
    created_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb
);

-- Add index for faster queries by profile
CREATE INDEX IF NOT EXISTS idx_saved_tryons_profile ON public.saved_tryons(profile_id);

-- Add RLS policies
ALTER TABLE public.saved_tryons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved try-ons
CREATE POLICY "Users can view their own saved try-ons"
    ON public.saved_tryons
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Policy: Users can insert their own saved try-ons
CREATE POLICY "Users can insert their own saved try-ons"
    ON public.saved_tryons
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can delete their own saved try-ons
CREATE POLICY "Users can delete their own saved try-ons"
    ON public.saved_tryons
    FOR DELETE
    USING (auth.uid() = profile_id);

-- Create bucket for try-on results
INSERT INTO storage.buckets (id, name, public)
VALUES ('tryon-results', 'tryon-results', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for tryon-results
CREATE POLICY "Public Access TryOn Results"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tryon-results' );

CREATE POLICY "Authenticated Upload TryOn Results"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tryon-results' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own tryon results"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tryon-results' 
  AND auth.uid() = owner
);
