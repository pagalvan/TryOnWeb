-- Supabase / PostgreSQL schema for TryOnWeb frontend features
-- Tables for: users/admins, clientes, productos, categorias, inventario, ventas, credito, abono, settings, ar_assets
-- Compatible with Supabase (Postgres). Uses UUID primary keys and standard FK constraints.

-- Enable uuid-ossp or pgcrypto as needed (Supabase typically uses gen_random_uuid from pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS / ADMINS
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  full_name varchar(120),
  phone varchar(32),
  is_admin boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- CLIENTES (customers)
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula varchar(32) UNIQUE NOT NULL,
  nombre varchar(120) NOT NULL,
  telefono varchar(32),
  email varchar(255),
  deuda_total numeric(12,2) DEFAULT 0 CHECK (deuda_total >= 0),
  direccion varchar(255),
  limite_credito numeric(12,2) DEFAULT 0 CHECK (limite_credito >= 0),
  estado varchar(20) DEFAULT 'Activo', -- values: Activo, Riesgo, Bloqueado
  strikes integer DEFAULT 0 CHECK (strikes >= 0),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clientes
  ADD CONSTRAINT chk_estado_cliente CHECK (estado IN ('Activo','Riesgo','Bloqueado'));

-- CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(120) NOT NULL,
  slug varchar(140) UNIQUE,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku varchar(64) UNIQUE,
  nombre varchar(200) NOT NULL,
  descripcion text,
  precio numeric(12,2) NOT NULL CHECK (precio >= 0),
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  disponible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- INVENTARIO (almacena stock por producto / ubicación opcional)
CREATE TABLE IF NOT EXISTS inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid REFERENCES productos(id) ON DELETE CASCADE,
  cantidad integer DEFAULT 0 CHECK (cantidad >= 0),
  ubicacion varchar(120),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventario_producto ON inventario(producto_id);

-- ACTIVOS PARA PROBADOR-VIRTUAL (AR assets / modelos / URL a Snap Lens, glb, etc.)
CREATE TABLE IF NOT EXISTS ar_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid REFERENCES productos(id) ON DELETE CASCADE,
  tipo varchar(50), -- e.g., 'glb','lens','image'
  url text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- VENTAS (orders)
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha timestamptz DEFAULT now(),
  descripcion varchar(250),
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ITEMS DE VENTA (line items)
CREATE TABLE IF NOT EXISTS venta_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal numeric(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- CREDITO (link a venta)
CREATE TABLE IF NOT EXISTS creditos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estado varchar(30) DEFAULT 'Pendiente', -- Pendiente, Pagado, Vencido
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  fecha_vencimiento date,
  created_at timestamptz DEFAULT now()
);

-- ABONOS (payments for credit)
CREATE TABLE IF NOT EXISTS abonos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credito_id uuid REFERENCES creditos(id) ON DELETE CASCADE,
  fecha_abono timestamptz DEFAULT now(),
  monto_abonado numeric(12,2) NOT NULL CHECK (monto_abonado > 0),
  metodo_pago varchar(80),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- SETTINGS / CONFIG
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

-- REPORTES (materialized view candidates, here a simple table for report metadata)
CREATE TABLE IF NOT EXISTS reportes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo varchar(80),
  parametros jsonb,
  resultado jsonb,
  generado_por uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes useful for queries
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_creditos_vencimiento ON creditos(fecha_vencimiento);

-- Audit trigger helper (simple last_updated column) - add updated_at columns as needed per table

-- This file defines the schema. Functions, triggers and sample data are in separate files.
