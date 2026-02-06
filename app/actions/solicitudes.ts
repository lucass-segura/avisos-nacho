"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSession } from "./auth"
import { revalidatePath } from "next/cache"
import type { FiltrosSolicitud, EstadoSolicitud } from "@/types"

export async function createSolicitud(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No estás autenticado" }
  }

  const nombreSolicitante = session.nombre_completo || session.username
  const tipoSolicitud = formData.get("tipo_solicitud") as string
  const criticidad = formData.get("criticidad") as string
  const descripcion = formData.get("descripcion") as string
  const imagen = formData.get("imagen") as File | null
  const sectorId = formData.get("sector_id") as string | null
  const equipoId = formData.get("equipo_id") as string | null

  if (!tipoSolicitud || !criticidad || !descripcion) {
    return { success: false as const, error: "Todos los campos son requeridos" }
  }

  const supabase = await createAdminClient()
  let imagenUrl: string | null = null

  // Subir imagen al bucket si existe
  if (imagen && imagen.size > 0) {
    const ext = imagen.name.split(".").pop() || "jpg"
    const fileName = `${session.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("solicitudes-imagenes")
      .upload(fileName, imagen, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      return { success: false as const, error: "Error al subir imagen: " + uploadError.message }
    }

    const { data: urlData } = supabase.storage
      .from("solicitudes-imagenes")
      .getPublicUrl(fileName)

    imagenUrl = urlData.publicUrl
  }

  const { error } = await supabase.from("solicitudes").insert({
    usuario_id: session.id,
    nombre_solicitante: nombreSolicitante,
    tipo_solicitud: tipoSolicitud,
    criticidad,
    descripcion,
    imagen_url: imagenUrl,
    sector_id: sectorId || null,
    equipo_id: equipoId || null,
    estado: "Pendiente",
  })

  if (error) {
    return { success: false as const, error: "Error al crear solicitud: " + error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/admin/solicitudes")
  return { success: true as const }
}

export async function getUserSolicitudes() {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No estás autenticado", solicitudes: [] }
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("solicitudes")
    .select(`
      *,
      sector:sectores(nombre),
      equipo:equipos_maquinas(nombre),
      tecnico:usuarios!solicitudes_tecnico_asignado_id_fkey(username, nombre_completo),
      derivado_por:usuarios!solicitudes_derivado_por_id_fkey(username, nombre_completo)
    `)
    .eq("usuario_id", session.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false as const, error: "Error al obtener solicitudes", solicitudes: [] }
  }

  return { success: true as const, solicitudes: data || [] }
}

export async function getAllSolicitudes(filters?: FiltrosSolicitud) {
  const session = await getSession()
  if (!session || !["admin", "supervisor", "tecnico"].includes(session.rol)) {
    return { success: false as const, error: "No tienes permisos", solicitudes: [] }
  }

  const supabase = await createAdminClient()

  let query = supabase
    .from("solicitudes")
    .select(`
      *,
      usuario:usuarios!solicitudes_usuario_id_fkey(username, nombre_completo),
      tecnico:usuarios!solicitudes_tecnico_asignado_id_fkey(username, nombre_completo),
      derivado_por:usuarios!solicitudes_derivado_por_id_fkey(username, nombre_completo),
      sector:sectores(nombre),
      equipo:equipos_maquinas(nombre)
    `)
    .order("created_at", { ascending: false })

  // Filtros para técnico: solo ve las asignadas a él
  if (session.rol === "tecnico") {
    query = query.eq("tecnico_asignado_id", session.id)
  }

  if (filters?.estado) {
    query = query.eq("estado", filters.estado)
  }
  if (filters?.tipo_solicitud) {
    query = query.eq("tipo_solicitud", filters.tipo_solicitud)
  }
  if (filters?.criticidad) {
    query = query.eq("criticidad", filters.criticidad)
  }
  if (filters?.sector_id) {
    query = query.eq("sector_id", filters.sector_id)
  }
  if (filters?.equipo_id) {
    query = query.eq("equipo_id", filters.equipo_id)
  }
  if (filters?.busqueda) {
    query = query.ilike("nombre_solicitante", `%${filters.busqueda}%`)
  }
  if (filters?.fecha_desde) {
    query = query.gte("created_at", `${filters.fecha_desde}T00:00:00`)
  }
  if (filters?.fecha_hasta) {
    query = query.lte("created_at", `${filters.fecha_hasta}T23:59:59`)
  }

  const { data, error } = await query

  if (error) {
    return { success: false as const, error: "Error al obtener solicitudes", solicitudes: [] }
  }

  return { success: true as const, solicitudes: data || [] }
}

// Actualización general (solo admin/supervisor)
export async function updateSolicitud(id: string, data: Record<string, unknown>) {
  const session = await getSession()
  if (!session || !["admin", "supervisor"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  return _updateSolicitudInternal(id, data)
}

// Internal: actualiza sin check de rol (ya verificado por la función que llama)
async function _updateSolicitudInternal(id: string, data: Record<string, unknown>) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from("solicitudes")
    .update(data)
    .eq("id", id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath("/admin/solicitudes")
  revalidatePath("/dashboard")
  return { success: true as const }
}

// Marcar como recibida por supervisor
export async function recepcionarSolicitud(id: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  return _updateSolicitudInternal(id, {
    estado: "Recibida" as EstadoSolicitud,
    fecha_recepcion_supervisor: new Date().toISOString(),
    fecha_vista_supervisor: new Date().toISOString(),
  })
}

// Derivar a técnico
export async function derivarSolicitud(id: string, tecnicoId: string, fechaEstimada?: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  return _updateSolicitudInternal(id, {
    estado: "Derivada" as EstadoSolicitud,
    tecnico_asignado_id: tecnicoId,
    derivado_por_id: session.id,
    fecha_derivacion_tecnico: new Date().toISOString(),
    ...(fechaEstimada && { fecha_estimada: fechaEstimada }),
  })
}

// Técnico marca inicio de trabajo (acepta fecha estimada opcional)
export async function iniciarTrabajo(id: string, fechaEstimada?: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor", "tecnico"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  return _updateSolicitudInternal(id, {
    estado: "En proceso" as EstadoSolicitud,
    fecha_inicio_trabajo: new Date().toISOString(),
    fecha_vista_tecnico: new Date().toISOString(),
    ...(fechaEstimada && { fecha_estimada: fechaEstimada }),
  })
}

// Finalizar solicitud
export async function finalizarSolicitud(id: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor", "tecnico"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  return _updateSolicitudInternal(id, {
    estado: "Finalizada" as EstadoSolicitud,
    fecha_finalizacion: new Date().toISOString(),
  })
}

// Registrar vista de supervisor (primera vez que abre la solicitud)
export async function registrarVistaSupervisor(id: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  const supabase = await createAdminClient()

  // Solo registrar si no tiene fecha_vista_supervisor
  const { data: sol } = await supabase
    .from("solicitudes")
    .select("fecha_vista_supervisor")
    .eq("id", id)
    .single()

  if (sol && !sol.fecha_vista_supervisor) {
    return _updateSolicitudInternal(id, {
      fecha_vista_supervisor: new Date().toISOString(),
    })
  }

  return { success: true as const }
}

// Registrar vista de técnico (primera vez que abre la solicitud)
export async function registrarVistaTecnico(id: string) {
  const session = await getSession()
  if (!session || !["admin", "supervisor", "tecnico"].includes(session.rol)) {
    return { success: false as const, error: "No autorizado" }
  }

  const supabase = await createAdminClient()

  // Solo registrar si no tiene fecha_vista_tecnico
  const { data: sol } = await supabase
    .from("solicitudes")
    .select("fecha_vista_tecnico")
    .eq("id", id)
    .single()

  if (sol && !sol.fecha_vista_tecnico) {
    return _updateSolicitudInternal(id, {
      fecha_vista_tecnico: new Date().toISOString(),
    })
  }

  return { success: true as const }
}

// Eliminar solicitud (solo admin)
export async function deleteSolicitud(id: string) {
  const session = await getSession()
  if (!session || session.rol !== "admin") {
    return { success: false as const, error: "No autorizado" }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.from("solicitudes").delete().eq("id", id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath("/admin/solicitudes")
  return { success: true as const }
}
