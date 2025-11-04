-- Cambiar imagen_data de BYTEA a TEXT para almacenar base64
ALTER TABLE solicitudes DROP COLUMN IF EXISTS imagen_data;
ALTER TABLE solicitudes ADD COLUMN imagen_base64 TEXT;
