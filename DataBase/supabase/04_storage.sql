-- =============================================================
-- TryOnWeb - Configuración de Storage
-- Contiene: Creación de buckets y políticas de seguridad
-- =============================================================

-- 1. Crear bucket 'products' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de seguridad para 'products'
-- Usamos nombres específicos para evitar conflictos con otras políticas existentes

-- Eliminar políticas si ya existen con estos nombres específicos
DROP POLICY IF EXISTS "Public Access Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Products" ON storage.objects;

-- Permitir acceso público de lectura a todas las imágenes del bucket products
CREATE POLICY "Public Access Products"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Permitir a usuarios autenticados subir imágenes al bucket products
CREATE POLICY "Authenticated Upload Products"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Permitir a usuarios autenticados actualizar sus imágenes en el bucket products
CREATE POLICY "Authenticated Update Products"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Permitir a usuarios autenticados borrar imágenes del bucket products
CREATE POLICY "Authenticated Delete Products"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);
