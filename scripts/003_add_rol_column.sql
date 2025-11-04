-- Agregar columna de rol a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'user';

-- Actualizar el usuario admin existente
UPDATE usuarios SET rol = 'admin' WHERE username = 'admin';

-- Agregar constraint para validar roles
ALTER TABLE usuarios ADD CONSTRAINT check_rol CHECK (rol IN ('admin', 'user'));

-- Actualizar políticas RLS para permitir a admins gestionar usuarios
CREATE POLICY "admins_manage_users"
  ON usuarios FOR ALL
  USING (true)
  WITH CHECK (true);
