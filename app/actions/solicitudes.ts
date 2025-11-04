"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSession } from "./auth"
import { revalidatePath } from "next/cache"

export async function createSolicitud(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { success: false, error: "No estás autenticado" }
  }

  const nombreSolicitante = formData.get("nombre_solicitante") as string
  const tipoSolicitud = formData.get("tipo_solicitud") as string
  const criticidad = formData.get("criticidad") as string
  const descripcion = formData.get("descripcion") as string
  const imagen = formData.get("imagen") as File | null

  if (!nombreSolicitante || !tipoSolicitud || !criticidad || !descripcion) {
    return { success: false, error: "Todos los campos son requeridos" }
  }

  const supabase = await createAdminClient()

  let imagenBase64 = null
  let imagenTipo = null

  if (imagen && imagen.size > 0) {
    const arrayBuffer = await imagen.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    imagenBase64 = buffer.toString("base64")
    imagenTipo = imagen.type
  }

  const { error } = await supabase.from("solicitudes").insert({
    usuario_id: session.id,
    nombre_solicitante: nombreSolicitante,
    tipo_solicitud: tipoSolicitud,
    criticidad: criticidad,
    descripcion: descripcion,
    imagen_base64: imagenBase64,
    imagen_tipo: imagenTipo,
  })

  if (error) {
    return { success: false, error: "Error al crear solicitud: " + error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getUserSolicitudes() {
  const session = await getSession()

  if (!session) {
    return { success: false, error: "No estás autenticado", solicitudes: [] }
  }

  const supabase = await createAdminClient()

  const { data: solicitudes, error } = await supabase
    .from("solicitudes")
    .select("*")
    .eq("usuario_id", session.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: "Error al obtener solicitudes", solicitudes: [] }
  }

  return { success: true, solicitudes: solicitudes || [] }
}

export async function getAllSolicitudes(filters?: {
  nombreSolicitante?: string
  tipoSolicitud?: string
  criticidad?: string
  usuarioId?: string
  fechaInicio?: string
  fechaFin?: string
}) {
  const session = await getSession()

  if (!session || session.rol !== "admin") {
    return { success: false, error: "No tienes permisos", solicitudes: [] }
  }

  const supabase = await createAdminClient()

  let query = supabase
    .from("solicitudes")
    .select(`
      *,
      usuario:usuarios!solicitudes_usuario_id_fkey(username)
    `)
    .order("created_at", { ascending: false })

  // Aplicar filtros
  if (filters?.nombreSolicitante) {
    query = query.eq("nombre_solicitante", filters.nombreSolicitante)
  }
  if (filters?.tipoSolicitud) {
    query = query.eq("tipo_solicitud", filters.tipoSolicitud)
  }
  if (filters?.criticidad) {
    query = query.eq("criticidad", filters.criticidad)
  }
  if (filters?.usuarioId) {
    query = query.eq("usuario_id", filters.usuarioId)
  }

  if (filters?.fechaInicio) {
    // Parsear fecha en formato dd/mm/yyyy
    const [day, month, year] = filters.fechaInicio.split("/")
    const date = new Date(`${year}-${month}-${day}`)

    // Inicio del día en Argentina (00:00:00)
    date.setHours(0, 0, 0, 0)

    query = query.gte("created_at", date.toISOString())
  }

  if (filters?.fechaFin) {
    // Parsear fecha en formato dd/mm/yyyy
    const [day, month, year] = filters.fechaFin.split("/")
    const date = new Date(`${year}-${month}-${day}`)

    // Fin del día en Argentina (23:59:59)
    date.setHours(23, 59, 59, 999)

    query = query.lte("created_at", date.toISOString())
  }

  const { data: solicitudes, error } = await query

  if (error) {
    return { success: false, error: "Error al obtener solicitudes", solicitudes: [] }
  }

  return { success: true, solicitudes: solicitudes || [] }
}
