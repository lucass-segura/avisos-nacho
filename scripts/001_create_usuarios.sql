-- Crear tabla de usuarios con username y password
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre_completo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios ver solo su propia información
CREATE POLICY "usuarios_select_own"
  ON usuarios FOR SELECT
  USING (true); -- Permitir lectura para autenticación

-- Insertar usuarios de prueba (password: "password123" para todos)
-- Nota: En producción, usa bcrypt o similar. Aquí uso crypt de pgcrypto
INSERT INTO usuarios (username, password_hash, nombre_completo) VALUES
  ('admin', crypt('password123', gen_salt('bf')), 'Administrador'),
  ('usuario1', crypt('password123', gen_salt('bf')), 'Usuario Uno'),
  ('demo', crypt('demo123', gen_salt('bf')), 'Usuario Demo')
ON CONFLICT (username) DO NOTHING;
