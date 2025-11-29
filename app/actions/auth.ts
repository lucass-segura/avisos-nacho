"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

type UserSession = {
  id: string
  username: string
  nombre_completo: string | null
  rol: string
}

export async function loginWithUsername(username: string, password: string) {
  const supabase = await createClient()

  const { data: validUser } = await supabase.rpc("verify_user_password", {
    p_username: username,
    p_password: password,
  })

  if (!validUser) {
    return { success: false, error: "Usuario o contraseña incorrectos" }
  }

  const { data: userData } = await supabase
    .from("usuarios")
    .select("id, username, nombre_completo, rol")
    .eq("username", username)
    .single()

  if (!userData) {
    return { success: false, error: "Error al obtener datos del usuario" }
  }

  // Guardar sesión en cookie
  const cookieStore = await cookies()
  cookieStore.set("user_session", JSON.stringify(userData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })

  return { success: true, user: userData }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("user_session")
  redirect("/login")
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get("user_session")

  if (!session) {
    return null
  }

  try {
    return JSON.parse(session.value)
  } catch {
    return null
  }
}

export async function createUser(formData: FormData) {
  const session = await getSession()

  if (!session || (session.rol !== "admin" && session.rol !== "supervisor")) {
    return { success: false, error: "No tienes permisos para crear usuarios" }
  }

  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const nombre_completo = formData.get("nombre_completo") as string
  const rol = formData.get("rol") as string

  if (!username || !password || !rol || !nombre_completo) {
    return { success: false, error: "Todos los campos son requeridos" }
  }

  // Validar que el username no contenga espacios
  if (username.includes(" ")) {
    return { success: false, error: "El nombre de usuario no puede contener espacios" }
  }

  // Validar que la contraseña tenga más de 4 caracteres
  if (password.length <= 4) {
    return { success: false, error: "La contraseña debe tener más de 4 caracteres" }
  }

  // Validar que la contraseña no contenga espacios
  if (password.includes(" ")) {
    return { success: false, error: "La contraseña no puede contener espacios" }
  }

  if (rol !== "admin" && rol !== "user") {
    return { success: false, error: "Rol inválido" }
  }

  const validRoles = ["admin", "supervisor", "tecnico", "solicitante"];
  if (!validRoles.includes(rol)) {
    return { success: false, error: "Rol inválido" }
  }

  if (session.rol === "supervisor" && rol === "admin") {
    return { success: false, error: "Los supervisores no pueden crear administradores." }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc("create_user_with_password", {
    p_username: username,
    p_password: password,
    p_nombre_completo: nombre_completo,
    p_rol: rol,
  })

  if (error) {
    return { success: false, error: "Error al crear usuario: " + error.message }
  }

  return { success: true }
}

export async function deleteUser(userId: string) {
  const session = await getSession()

  if (!session || session.rol !== "admin") {
    return { success: false, error: "No tienes permisos para eliminar usuarios" }
  }

  const supabase = await createClient()

  // Verificar que el usuario a eliminar no sea admin
  const { data: userToDelete } = await supabase.from("usuarios").select("rol").eq("id", userId).single()

  if (userToDelete?.rol === "admin") {
    return { success: false, error: "No puedes eliminar usuarios administradores" }
  }

  const { error } = await supabase.from("usuarios").delete().eq("id", userId)

  if (error) {
    return { success: false, error: "Error al eliminar usuario: " + error.message }
  }

  return { success: true }
}

export async function getAllUsers() {
  const session = await getSession()

  if (!session || session.rol !== "admin") {
    return { success: false, error: "No tienes permisos", users: [] }
  }

  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from("usuarios")
    .select("id, username, nombre_completo, rol, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: "Error al obtener usuarios", users: [] }
  }

  return { success: true, users: users || [] }
}
