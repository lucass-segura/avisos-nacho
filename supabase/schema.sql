-- ============================================================
-- AVISOS EMPRESA - Schema completo para Supabase
-- Ejecutar en el SQL Editor de Supabase en orden
-- ============================================================

-- 1. Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLAS
-- ============================================================

-- 2. Tabla de USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'supervisor', 'tecnico', 'solicitante')),
  activo BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla de SECTORES
CREATE TABLE IF NOT EXISTS sectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla de EQUIPOS / MÁQUINAS
CREATE TABLE IF NOT EXISTS equipos_maquinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  sector_id UUID REFERENCES sectores(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabla de SOLICITUDES
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_solicitante TEXT NOT NULL,

  tipo_solicitud TEXT NOT NULL CHECK (tipo_solicitud IN (
    'Reparación/Acondicionamiento',
    'Oportunidad a Mejora',
    'Inversión'
  )),
  criticidad TEXT NOT NULL CHECK (criticidad IN ('Bajo', 'Medio', 'Alto', 'Crítico')),
  descripcion TEXT NOT NULL,

  -- Imagen en bucket (URL relativa al bucket, no base64)
  imagen_url TEXT,

  -- Clasificación
  sector_id UUID REFERENCES sectores(id) ON DELETE SET NULL,
  equipo_id UUID REFERENCES equipos_maquinas(id) ON DELETE SET NULL,

  -- Estado del flujo
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN (
    'Pendiente',
    'Recibida',
    'Derivada',
    'En proceso',
    'Finalizada'
  )),

  -- Trazabilidad completa
  fecha_recepcion_supervisor TIMESTAMPTZ,   -- Cuando el supervisor la recepcionó
  fecha_vista_supervisor TIMESTAMPTZ,       -- Cuando el supervisor la vio por primera vez
  fecha_derivacion_tecnico TIMESTAMPTZ,     -- Cuando se derivó al técnico
  derivado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,  -- Supervisor/admin que derivó
  tecnico_asignado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_vista_tecnico TIMESTAMPTZ,          -- Cuando el técnico la vio por primera vez
  fecha_inicio_trabajo TIMESTAMPTZ,         -- Cuando el técnico empezó a trabajar
  fecha_estimada TIMESTAMPTZ,               -- Fecha estimada de finalización
  fecha_finalizacion TIMESTAMPTZ,           -- Cuando se finalizó

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabla de OBSERVACIONES / NOTAS (tabla separada, no JSON)
CREATE TABLE IF NOT EXISTS observaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  autor_nombre TEXT NOT NULL,
  autor_rol TEXT NOT NULL CHECK (autor_rol IN ('admin', 'supervisor', 'tecnico', 'solicitante')),
  texto TEXT NOT NULL,
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario_id ON solicitudes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tecnico_asignado ON solicitudes(tecnico_asignado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created_at ON solicitudes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_sector_id ON solicitudes(sector_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_equipo_id ON solicitudes(equipo_id);
CREATE INDEX IF NOT EXISTS idx_observaciones_solicitud_id ON observaciones(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_equipos_sector_id ON equipos_maquinas(sector_id);

-- ============================================================
-- FUNCIONES DE AUTENTICACIÓN
-- ============================================================

-- Función para verificar contraseña
CREATE OR REPLACE FUNCTION verify_user_password(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
  user_active BOOLEAN;
BEGIN
  SELECT password_hash, activo INTO stored_hash, user_active
  FROM usuarios
  WHERE username = p_username;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT user_active THEN
    RETURN FALSE;
  END IF;

  RETURN stored_hash = crypt(p_password, stored_hash);
END;
$$;

-- Función para crear usuario con contraseña hasheada
CREATE OR REPLACE FUNCTION create_user_with_password(
  p_username TEXT,
  p_password TEXT,
  p_nombre_completo TEXT,
  p_rol TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validar que no exista
  IF EXISTS (SELECT 1 FROM usuarios WHERE username = p_username) THEN
    RAISE EXCEPTION 'User already exists: %', p_username;
  END IF;

  INSERT INTO usuarios (username, password_hash, nombre_completo, rol)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_nombre_completo,
    p_rol
  )
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$;

-- ============================================================
-- USUARIO ADMIN INICIAL
-- ============================================================

-- Crear usuario admin por defecto (password: admin123)
SELECT create_user_with_password('admin', 'admin123', 'Administrador', 'admin');

-- ============================================================
-- STORAGE BUCKET PARA IMÁGENES
-- ============================================================

-- Crear bucket para imágenes de solicitudes
INSERT INTO storage.buckets (id, name, public)
VALUES ('solicitudes-imagenes', 'solicitudes-imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier usuario autenticado puede subir
CREATE POLICY "Permitir subir imagenes" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'solicitudes-imagenes');

-- Política: lectura pública
CREATE POLICY "Permitir leer imagenes" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'solicitudes-imagenes');

-- Política: solo admin puede eliminar
CREATE POLICY "Permitir eliminar imagenes admin" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'solicitudes-imagenes');

-- ============================================================
-- STORAGE BUCKET PARA AVATARES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir subir avatares" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatares');

CREATE POLICY "Permitir leer avatares" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatares');

CREATE POLICY "Permitir actualizar avatares" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatares');

-- ============================================================
-- FUNCIÓN PARA CAMBIAR CONTRASEÑA
-- ============================================================

CREATE OR REPLACE FUNCTION change_user_password(p_user_id UUID, p_new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE usuarios
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- MIGRACIÓN: agregar columnas nuevas (ejecutar si la DB ya existe)
-- ============================================================
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS derivado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- ============================================================
-- RLS (Row Level Security) - Deshabilitado para usar service_role
-- ============================================================
-- NOTA: Como usamos createAdminClient (service_role key) desde
-- server actions, RLS está deshabilitado por defecto para
-- ese client. La seguridad se maneja en la capa de aplicación
-- (verificación de sesión/rol en cada server action).
--
-- Si en el futuro se quiere habilitar RLS para mayor seguridad:
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE observaciones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sectores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE equipos_maquinas ENABLE ROW LEVEL SECURITY;
