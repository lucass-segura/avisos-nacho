"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSession } from "./auth"
import { revalidatePath } from "next/cache"

export async function createSolicitud(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { success: false, error: "No estás autenticado" }
  }

  const nombreSolicitante = session.nombre_completo || session.username
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
  estado?: string
}) {
  const session = await getSession()

  if (!session || session.rol !== "admin") {
    return { success: false, error: "No tienes permisos", solicitudes: [] }
  }

  const supabase = await createAdminClient()

  let query = supabase
    .from("solicitudes")
    .select(
      `
      *,
      usuario:usuarios!solicitudes_usuario_id_fkey(username)
    `,
    )
    .order("created_at", { ascending: false })

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
  if (filters?.estado) {
    query = query.eq("estado", filters.estado)
  }

  if (filters?.fechaInicio) {
    const [day, month, year] = filters.fechaInicio.split("/")
    const fechaInicioArgentina = `${year}-${month}-${day}T00:00:00.000-03:00`
    query = query.gte("created_at", fechaInicioArgentina)
  }

  if (filters?.fechaFin) {
    const [day, month, year] = filters.fechaFin.split("/")
    const fechaFinArgentina = `${year}-${month}-${day}T23:59:59.999-03:00`
    query = query.lte("created_at", fechaFinArgentina)
  }

  const { data: solicitudes, error } = await query

  if (error) {
    return { success: false, error: "Error al obtener solicitudes", solicitudes: [] }
  }

  return { success: true, solicitudes: solicitudes || [] }
}


export async function updateSolicitud(id: string, data: any) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false, error: "No autorizado" }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from("solicitudes")
    .update(data)
    .eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/solicitudes")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function addObservacion(id: string, text: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false, error: "No autorizado" }
  }

  const supabase = await createAdminClient()

  // Obtener observaciones actuales
  const { data: current } = await supabase.from("solicitudes").select("observaciones").eq("id", id).single()

  const currentObs = current?.observaciones || []
  const newObs = {
    id: crypto.randomUUID(),
    text,
    date: new Date().toISOString(),
    author: session.username
  }

  const { error } = await supabase
    .from("solicitudes")
    .update({ observaciones: [...currentObs, newObs] })
    .eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/solicitudes")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteObservacion(solicitudId: string, noteId: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false, error: "No autorizado" }
  }

  const supabase = await createAdminClient()

  const { data: current } = await supabase.from("solicitudes").select("observaciones").eq("id", solicitudId).single()

  // Filtrar la nota a eliminar
  const updatedObs = (current?.observaciones || []).filter((obs: any) => obs.id !== noteId)

  const { error } = await supabase
    .from("solicitudes")
    .update({ observaciones: updatedObs })
    .eq("id", solicitudId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/solicitudes")
  revalidatePath("/dashboard")
  return { success: true }
}