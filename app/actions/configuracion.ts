"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSession } from "./auth"
import { revalidatePath } from "next/cache"

// --- SECTORES ---

export async function getSectores() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from("sectores")
    .select("*")
    .eq("activo", true)
    .order("nombre")

  if (error) return { success: false as const, error: error.message, data: [] }
  return { success: true as const, data: data || [] }
}

export async function createSector(nombre: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  if (!nombre.trim()) {
    return { success: false as const, error: "El nombre es requerido" }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.from("sectores").insert({ nombre: nombre.trim() })

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { success: false as const, error: "Ya existe un sector con ese nombre" }
    }
    return { success: false as const, error: error.message }
  }

  revalidatePath("/admin/configuracion")
  return { success: true as const }
}

export async function updateSector(id: string, nombre: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "Solo administradores pueden editar" }
  }

  if (!nombre.trim()) {
    return { success: false as const, error: "El nombre es requerido" }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from("sectores")
    .update({ nombre: nombre.trim() })
    .eq("id", id)

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { success: false as const, error: "Ya existe un sector con ese nombre" }
    }
    return { success: false as const, error: error.message }
  }

  revalidatePath("/admin/configuracion")
  return { success: true as const }
}

export async function deleteSector(id: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "Solo administradores pueden eliminar" }
  }

  const supabase = await createAdminClient()

  // Verificar si tiene máquinas activas asignadas
  const { data: machines } = await supabase
    .from("equipos_maquinas")
    .select("nombre")
    .eq("sector_id", id)
    .eq("activo", true)

  if (machines && machines.length > 0) {
    const names = machines.map((m) => m.nombre).join(", ")
    return {
      success: false as const,
      error: `No se puede eliminar. Tiene máquinas asignadas: ${names}`,
    }
  }

  // Soft delete
  const { error } = await supabase
    .from("sectores")
    .update({ activo: false })
    .eq("id", id)

  if (error) return { success: false as const, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true as const }
}

// --- EQUIPOS / MÁQUINAS ---

export async function getEquipos() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from("equipos_maquinas")
    .select("*, sector:sectores(nombre)")
    .eq("activo", true)
    .order("nombre")

  if (error) return { success: false as const, error: error.message, data: [] }
  return { success: true as const, data: data || [] }
}

export async function createEquipo(nombre: string, sectorId?: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  if (!nombre.trim()) {
    return { success: false as const, error: "El nombre es requerido" }
  }

  const supabase = await createAdminClient()
  const payload: { nombre: string; sector_id?: string } = { nombre: nombre.trim() }
  if (sectorId && sectorId !== "null") {
    payload.sector_id = sectorId
  }

  const { error } = await supabase.from("equipos_maquinas").insert(payload)

  if (error) return { success: false as const, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true as const }
}

export async function updateEquipo(id: string, nombre: string, sectorId?: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "Solo administradores pueden editar" }
  }

  if (!nombre.trim()) {
    return { success: false as const, error: "El nombre es requerido" }
  }

  const supabase = await createAdminClient()
  const payload: { nombre: string; sector_id?: string | null } = { nombre: nombre.trim() }
  if (sectorId && sectorId !== "null") {
    payload.sector_id = sectorId
  } else {
    payload.sector_id = null
  }

  const { error } = await supabase
    .from("equipos_maquinas")
    .update(payload)
    .eq("id", id)

  if (error) return { success: false as const, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true as const }
}

export async function deleteEquipo(id: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "Solo administradores pueden eliminar" }
  }

  const supabase = await createAdminClient()
  // Soft delete
  const { error } = await supabase
    .from("equipos_maquinas")
    .update({ activo: false })
    .eq("id", id)

  if (error) return { success: false as const, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true as const }
}
