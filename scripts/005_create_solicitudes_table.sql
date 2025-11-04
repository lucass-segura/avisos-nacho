-- Crear tabla de solicitudes
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_solicitante TEXT NOT NULL,
  tipo_solicitud TEXT NOT NULL,
  criticidad TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  imagen_url TEXT,
  imagen_data BYTEA,
  imagen_tipo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario_id ON solicitudes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_nombre_solicitante ON solicitudes(nombre_solicitante);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo_solicitud ON solicitudes(tipo_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_criticidad ON solicitudes(criticidad);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created_at ON solicitudes(created_at DESC);

-- Habilitar RLS
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view own solicitudes"
  ON solicitudes FOR SELECT
  USING (auth.uid()::text = usuario_id::text OR EXISTS (
    SELECT 1 FROM usuarios WHERE id::text = auth.uid()::text AND rol = 'admin'
  ));

-- Política: Los usuarios pueden crear sus propias solicitudes
CREATE POLICY "Users can create own solicitudes"
  ON solicitudes FOR INSERT
  WITH CHECK (auth.uid()::text = usuario_id::text);

-- Política: Los admins pueden ver todas las solicitudes
CREATE POLICY "Admins can view all solicitudes"
  ON solicitudes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM usuarios WHERE id::text = auth.uid()::text AND rol = 'admin'
  ));
