-- Optional seed data for local/dev use. Comment out or remove before production.
-- Create some categories, products, a user/admin, a cliente, a venta and a credito.

-- Users
INSERT INTO users (id, email, full_name, phone, is_admin)
VALUES (gen_random_uuid(), 'admin@example.com', 'Admin Demo', '3001112233', true)
ON CONFLICT DO NOTHING;

-- Categorias
INSERT INTO categorias (id, nombre, slug, descripcion)
VALUES
  (gen_random_uuid(), 'Ropa', 'ropa', 'Prendas de vestir'),
  (gen_random_uuid(), 'Electronica', 'electronica', 'Dispositivos y accesorios')
ON CONFLICT DO NOTHING;

-- Productos (example - adjust prices)
INSERT INTO productos (id, sku, nombre, descripcion, precio, categoria_id, disponible)
SELECT gen_random_uuid(), 'SKU-1001', 'Camiseta Negra', 'Camiseta de algodón', 19.99, id, true FROM categorias WHERE slug = 'ropa' LIMIT 1
ON CONFLICT DO NOTHING;

-- Inventario
INSERT INTO inventario (id, producto_id, cantidad, ubicacion)
SELECT gen_random_uuid(), p.id, 50, 'Almacen A' FROM productos p WHERE p.sku = 'SKU-1001' LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente
INSERT INTO clientes (id, cedula, nombre, telefono, email, deuda_total, direccion, limite_credito, estado, strikes)
VALUES (gen_random_uuid(), '1234567890', 'Cliente Demo', '3009998888', 'cliente@example.com', 0, 'Calle Demo 123', 1000, 'Activo', 0)
ON CONFLICT DO NOTHING;

-- Venta + credito example
WITH c AS (
  SELECT id AS cliente_id FROM clientes WHERE cedula = '1234567890' LIMIT 1
), u AS (
  SELECT id AS user_id FROM users WHERE email = 'admin@example.com' LIMIT 1
)
INSERT INTO ventas (id, fecha, descripcion, cliente_id, total, created_by)
SELECT gen_random_uuid(), now(), 'Venta demo prueba', c.cliente_id, 100.00, u.user_id FROM c, u
ON CONFLICT DO NOTHING;

-- The seed file is minimal. Expand as needed for testing.
