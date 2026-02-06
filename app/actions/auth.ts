"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { RolUsuario, UserSession } from "@/types"

const SESSION_COOKIE = "user_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

// --- Sesión ---

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)

  if (!session) return null

  try {
    return JSON.parse(session.value) as UserSession
  } catch {
    return null
  }
}

async function setSession(user: UserSession) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
  })
}

// --- Login / Logout ---

export async function login(username: string, password: string) {
  if (!username?.trim() || !password?.trim()) {
    return { success: false as const, error: "Usuario y contraseña son requeridos" }
  }

  const supabase = await createClient()

  const { data: validUser } = await supabase.rpc("verify_user_password", {
    p_username: username.trim(),
    p_password: password,
  })

  if (!validUser) {
    return { success: false as const, error: "Usuario o contraseña incorrectos" }
  }

  const { data: userData } = await supabase
    .from("usuarios")
    .select("id, username, nombre_completo, rol, avatar_url")
    .eq("username", username.trim())
    .single()

  if (!userData) {
    return { success: false as const, error: "Error al obtener datos del usuario" }
  }

  await setSession(userData as UserSession)

  return { success: true as const, user: userData as UserSession }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/login")
}

// --- Gestión de usuarios ---

export async function createUser(formData: FormData) {
  const session = await getSession()

  if (!session || (session.rol !== "admin" && session.rol !== "supervisor")) {
    return { success: false as const, error: "No tienes permisos para crear usuarios" }
  }

  const username = (formData.get("username") as string)?.trim()
  const password = formData.get("password") as string
  const nombre_completo = (formData.get("nombre_completo") as string)?.trim()
  const rol = formData.get("rol") as RolUsuario

  if (!username || !password || !rol || !nombre_completo) {
    return { success: false as const, error: "Todos los campos son requeridos" }
  }

  if (username.includes(" ")) {
    return { success: false as const, error: "El nombre de usuario no puede contener espacios" }
  }

  if (password.length < 5) {
    return { success: false as const, error: "La contraseña debe tener al menos 5 caracteres" }
  }

  if (password.includes(" ")) {
    return { success: false as const, error: "La contraseña no puede contener espacios" }
  }

  const validRoles: RolUsuario[] = ["admin", "supervisor", "tecnico", "solicitante"]
  if (!validRoles.includes(rol)) {
    return { success: false as const, error: "Rol inválido" }
  }

  if (session.rol === "supervisor" && rol !== "tecnico" && rol !== "solicitante") {
    return { success: false as const, error: "Los supervisores solo pueden crear técnicos y solicitantes" }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc("create_user_with_password", {
    p_username: username,
    p_password: password,
    p_nombre_completo: nombre_completo,
    p_rol: rol,
  })

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("already exists")) {
      return { success: false as const, error: "El nombre de usuario ya existe" }
    }
    return { success: false as const, error: "Error al crear usuario: " + error.message }
  }

  return { success: true as const }
}

export async function deleteUser(userId: string) {
  const session = await getSession()

  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "No tienes permisos para eliminar usuarios" }
  }

  if (session.id === userId) {
    return { success: false as const, error: "No puedes eliminarte a ti mismo" }
  }

  const supabase = await createClient()

  const { data: userToDelete } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", userId)
    .single()

  if (userToDelete?.rol === "admin") {
    return { success: false as const, error: "No puedes eliminar usuarios administradores" }
  }

  const { error } = await supabase.from("usuarios").delete().eq("id", userId)

  if (error) {
    return { success: false as const, error: "Error al eliminar usuario: " + error.message }
  }

  return { success: true as const }
}

export async function verifyAdminPassword(password: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "No autorizado" }
  }

  const supabase = await createClient()

  const { data: valid } = await supabase.rpc("verify_user_password", {
    p_username: session.username,
    p_password: password,
  })

  if (!valid) {
    return { success: false as const, error: "Contraseña incorrecta" }
  }

  return { success: true as const }
}

// --- Cambio de contraseña (propia) ---

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No estás autenticado" }
  }

  if (!newPassword || newPassword.length < 5) {
    return { success: false as const, error: "La nueva contraseña debe tener al menos 5 caracteres" }
  }

  if (newPassword.includes(" ")) {
    return { success: false as const, error: "La contraseña no puede contener espacios" }
  }

  const supabase = await createClient()

  // Verificar contraseña actual
  const { data: valid } = await supabase.rpc("verify_user_password", {
    p_username: session.username,
    p_password: currentPassword,
  })

  if (!valid) {
    return { success: false as const, error: "Contraseña actual incorrecta" }
  }

  // Cambiar contraseña
  const { error } = await supabase.rpc("change_user_password", {
    p_user_id: session.id,
    p_new_password: newPassword,
  })

  if (error) {
    return { success: false as const, error: "Error al cambiar contraseña: " + error.message }
  }

  return { success: true as const }
}

// --- Cambio de contraseña (admin cambia la de otro usuario) ---

export async function adminChangeUserPassword(userId: string, newPassword: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "No autorizado" }
  }

  if (!newPassword || newPassword.length < 5) {
    return { success: false as const, error: "La contraseña debe tener al menos 5 caracteres" }
  }

  if (newPassword.includes(" ")) {
    return { success: false as const, error: "La contraseña no puede contener espacios" }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc("change_user_password", {
    p_user_id: userId,
    p_new_password: newPassword,
  })

  if (error) {
    return { success: false as const, error: "Error al cambiar contraseña: " + error.message }
  }

  return { success: true as const }
}

// --- Actualizar perfil (nombre completo) ---

export async function updateProfile(nombreCompleto: string) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No estás autenticado" }
  }

  if (!nombreCompleto.trim()) {
    return { success: false as const, error: "El nombre completo es requerido" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("usuarios")
    .update({ nombre_completo: nombreCompleto.trim() })
    .eq("id", session.id)

  if (error) {
    return { success: false as const, error: "Error al actualizar perfil: " + error.message }
  }

  // Actualizar sesión
  await setSession({ ...session, nombre_completo: nombreCompleto.trim() })

  return { success: true as const }
}

// --- Subir avatar ---

export async function uploadAvatar(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No estás autenticado" }
  }

  const imagen = formData.get("avatar") as File | null
  if (!imagen || imagen.size === 0) {
    return { success: false as const, error: "No se seleccionó imagen" }
  }

  if (imagen.size > 5 * 1024 * 1024) {
    return { success: false as const, error: "La imagen no puede superar 5MB" }
  }

  const supabase = await createClient()
  const ext = imagen.name.split(".").pop() || "jpg"
  const fileName = `${session.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("avatares")
    .upload(fileName, imagen, {
      cacheControl: "60",
      upsert: true,
    })

  if (uploadError) {
    return { success: false as const, error: "Error al subir imagen: " + uploadError.message }
  }

  const { data: urlData } = supabase.storage
    .from("avatares")
    .getPublicUrl(fileName)

  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  // Guardar en DB
  const { error: dbError } = await supabase
    .from("usuarios")
    .update({ avatar_url: avatarUrl })
    .eq("id", session.id)

  if (dbError) {
    return { success: false as const, error: "Error al guardar avatar: " + dbError.message }
  }

  // Actualizar sesión
  await setSession({ ...session, avatar_url: avatarUrl })

  return { success: true as const, avatar_url: avatarUrl }
}

// --- Obtener todos los usuarios ---

export async function getAllUsers() {
  const session = await getSession()

  if (!session || (session.rol !== "admin" && session.rol !== "supervisor")) {
    return { success: false as const, error: "No tienes permisos", users: [] }
  }

  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from("usuarios")
    .select("id, username, nombre_completo, rol, activo, avatar_url, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false as const, error: "Error al obtener usuarios", users: [] }
  }

  return { success: true as const, users: users || [] }
}
