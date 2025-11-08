-- Supabase / PostgreSQL functions and triggers adapted from Oracle examples
-- 1) Validations for nombres, telefono, email
-- 2) Triggers to update cliente.deuda_total when a venta is inserted
-- 3) Prevent deletion of clientes with deuda > 0
-- 4) Validations for abono to not exceed venta total

-- 1) Validation functions
CREATE OR REPLACE FUNCTION validar_nombre(p_nombre text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF p_nombre IS NULL THEN
    RETURN FALSE;
  END IF;
  -- Allow letters, spaces and accented characters
  RETURN p_nombre ~ '^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$';
END;
$$;

CREATE OR REPLACE FUNCTION validar_telefono(p_telefono text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF p_telefono IS NULL THEN
    RETURN FALSE;
  END IF;
  -- Accept different formats; example: start with digit, total 7-15 digits
  RETURN p_telefono ~ '^\d{7,15}$';
END;
$$;

CREATE OR REPLACE FUNCTION validar_email(p_email text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF p_email IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- 2) Trigger: after insert on ventas -> update clientes.deuda_total
CREATE OR REPLACE FUNCTION ventas_after_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.cliente_id IS NOT NULL THEN
    UPDATE clientes
    SET deuda_total = COALESCE(deuda_total,0) + NEW.total
    WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ventas_after_insert ON ventas;
CREATE TRIGGER trg_ventas_after_insert
AFTER INSERT ON ventas
FOR EACH ROW EXECUTE FUNCTION ventas_after_insert();

-- 3) Prevent delete cliente with deuda_total > 0
CREATE OR REPLACE FUNCTION prevent_delete_cliente_with_debt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.deuda_total IS NOT NULL AND OLD.deuda_total > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar un cliente con deuda pendiente.';
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_delete_cliente ON clientes;
CREATE TRIGGER trg_prevent_delete_cliente
BEFORE DELETE ON clientes
FOR EACH ROW EXECUTE FUNCTION prevent_delete_cliente_with_debt();

-- 4) Trigger: before insert on creditos -> validate fecha_vencimiento
CREATE OR REPLACE FUNCTION creditos_before_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_fecha_venta timestamp;
BEGIN
  SELECT fecha INTO v_fecha_venta FROM ventas WHERE id = NEW.venta_id;
  IF v_fecha_venta IS NOT NULL AND NEW.fecha_vencimiento IS NOT NULL THEN
    IF NEW.fecha_vencimiento < date(v_fecha_venta) THEN
      RAISE EXCEPTION 'La fecha de vencimiento no puede ser anterior a la fecha de la venta.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_creditos_before_insert ON creditos;
CREATE TRIGGER trg_creditos_before_insert
BEFORE INSERT ON creditos
FOR EACH ROW EXECUTE FUNCTION creditos_before_insert();

-- 5) Trigger: before insert on abonos -> validations and prevent overpayment
CREATE OR REPLACE FUNCTION abonos_before_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_total_venta numeric(14,2);
  v_total_abonado numeric(14,2);
BEGIN
  IF NEW.monto_abonado IS NULL OR NEW.monto_abonado <= 0 THEN
    RAISE EXCEPTION 'El monto del abono debe ser mayor que cero.';
  END IF;
  IF NEW.credito_id IS NULL THEN
    RAISE EXCEPTION 'El credito asociado es obligatorio.';
  END IF;

  SELECT v.total INTO v_total_venta
  FROM ventas v
  JOIN creditos c ON c.venta_id = v.id
  WHERE c.id = NEW.credito_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credito asociado no existe.';
  END IF;

  SELECT COALESCE(SUM(monto_abonado),0) INTO v_total_abonado
  FROM abonos
  WHERE credito_id = NEW.credito_id;

  IF (v_total_abonado + NEW.monto_abonado) > v_total_venta THEN
    RAISE EXCEPTION 'El monto abonado excede el total de la venta.';
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_abonos_before_insert ON abonos;
CREATE TRIGGER trg_abonos_before_insert
BEFORE INSERT ON abonos
FOR EACH ROW EXECUTE FUNCTION abonos_before_insert();

-- 6) After insert abono -> update credito.estado and update cliente.deuda_total
CREATE OR REPLACE FUNCTION abonos_after_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_total_abonado numeric(14,2);
  v_total_venta numeric(14,2);
  v_cliente_id uuid;
BEGIN
  SELECT COALESCE(SUM(monto_abonado),0) INTO v_total_abonado FROM abonos WHERE credito_id = NEW.credito_id;
  SELECT v.total, v.cliente_id INTO v_total_venta, v_cliente_id
  FROM ventas v
  JOIN creditos c ON c.venta_id = v.id
  WHERE c.id = NEW.credito_id;

  IF v_total_abonado >= v_total_venta THEN
    UPDATE creditos SET estado = 'Pagado' WHERE id = NEW.credito_id;
  END IF;

  -- actualizar deuda del cliente
  IF v_cliente_id IS NOT NULL THEN
    UPDATE clientes SET deuda_total = COALESCE(deuda_total,0) - NEW.monto_abonado WHERE id = v_cliente_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_abonos_after_insert ON abonos;
CREATE TRIGGER trg_abonos_after_insert
AFTER INSERT ON abonos
FOR EACH ROW EXECUTE FUNCTION abonos_after_insert();

-- 7) Procedure (function) to update strikes for overdue credits
-- This is a simple function; scheduling must be done via pg_cron or Supabase scheduled functions
CREATE OR REPLACE FUNCTION actualizar_strikes_vencidos() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.id, v.cliente_id, cl.strikes
    FROM creditos c
    JOIN ventas v ON c.venta_id = v.id
    JOIN clientes cl ON v.cliente_id = cl.id
    WHERE c.fecha_vencimiento < CURRENT_DATE
      AND cl.estado <> 'Bloqueado'
  LOOP
    UPDATE clientes
    SET strikes = COALESCE(strikes,0) + 1,
        estado = CASE
                   WHEN COALESCE(strikes,0) + 1 >= 3 THEN 'Bloqueado'
                   WHEN COALESCE(strikes,0) + 1 = 2 THEN 'Riesgo'
                   ELSE 'Activo'
                 END
    WHERE id = rec.cliente_id;
  END LOOP;
END;
$$;

-- Note: To schedule this regularly on Supabase, use the "Scheduled Functions" feature or pg_cron if enabled.

-- End of functions/triggers file
