"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSession } from "./auth"
import { revalidatePath } from "next/cache"

export async function getObservaciones(solicitudId: string) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No autenticado", observaciones: [] }
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("observaciones")
    .select("*")
    .eq("solicitud_id", solicitudId)
    .order("created_at", { ascending: true })

  if (error) {
    return { success: false as const, error: error.message, observaciones: [] }
  }

  return { success: true as const, observaciones: data || [] }
}

export async function addObservacion(solicitudId: string, texto: string) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No autenticado" }
  }

  if (!texto.trim()) {
    return { success: false as const, error: "El texto no puede estar vacío" }
  }

  const supabase = await createAdminClient()

  const { error } = await supabase.from("observaciones").insert({
    solicitud_id: solicitudId,
    autor_id: session.id,
    autor_nombre: session.nombre_completo || session.username,
    autor_rol: session.rol,
    texto: texto.trim(),
  })

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath("/admin/solicitudes")
  revalidatePath("/dashboard")
  return { success: true as const }
}

export async function addObservacionConImagen(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No autenticado" }
  }

  const solicitudId = formData.get("solicitud_id") as string
  const texto = (formData.get("texto") as string)?.trim() || ""
  const imagen = formData.get("imagen") as File | null

  if (!texto && (!imagen || imagen.size === 0)) {
    return { success: false as const, error: "Debes escribir un texto o adjuntar una imagen" }
  }

  const supabase = await createAdminClient()
  let imagenUrl: string | null = null

  if (imagen && imagen.size > 0) {
    const ext = imagen.name.split(".").pop() || "jpg"
    const fileName = `notas/${session.id}/${Date.now()}.${ext}`

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

  const { error } = await supabase.from("observaciones").insert({
    solicitud_id: solicitudId,
    autor_id: session.id,
    autor_nombre: session.nombre_completo || session.username,
    autor_rol: session.rol,
    texto: texto || (imagenUrl ? "📷 Imagen" : ""),
    imagen_url: imagenUrl,
  })

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath("/admin/solicitudes")
  revalidatePath("/dashboard")
  return { success: true as const }
}

export async function deleteObservacion(observacionId: string) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "No autenticado" }
  }

  const supabase = await createAdminClient()

  // Solo el autor o admin pueden borrar
  if (session.rol !== "admin") {
    const { data: obs } = await supabase
      .from("observaciones")
      .select("autor_id")
      .eq("id", observacionId)
      .single()

    if (!obs || obs.autor_id !== session.id) {
      return { success: false as const, error: "Solo puedes eliminar tus propias notas" }
    }
  }

  const { error } = await supabase
    .from("observaciones")
    .delete()
    .eq("id", observacionId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath("/admin/solicitudes")
  revalidatePath("/dashboard")
  return { success: true as const }
}
