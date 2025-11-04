-- Función para crear usuarios con password hasheado
CREATE OR REPLACE FUNCTION create_user_with_password(
  p_username TEXT,
  p_password TEXT,
  p_nombre_completo TEXT,
  p_rol TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usuarios (username, password_hash, nombre_completo, rol)
  VALUES (p_username, crypt(p_password, gen_salt('bf')), p_nombre_completo, p_rol);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
