-- Deshabilitar RLS temporalmente para simplificar
-- La seguridad se maneja en el código de la aplicación usando el service role key
ALTER TABLE solicitudes DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Users can create own solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Admins can view all solicitudes" ON solicitudes;
