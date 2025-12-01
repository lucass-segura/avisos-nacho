"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSession } from "./auth"
import { revalidatePath } from "next/cache"

// --- SECTORES ---

export async function getSectores() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from("sectores").select("*").order("nombre")

    if (error) return { success: false, error: error.message }
    return { success: true, data }
}

export async function createSector(nombre: string) {
    const session = await getSession()
    if (!session || (session.rol !== "admin" && session.rol !== "supervisor")) {
        return { success: false, error: "No autorizado" }
    }

    const supabase = await createAdminClient()
    const { error } = await supabase.from("sectores").insert({ nombre })

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/configuracion")
    return { success: true }
}

export async function deleteSector(id: string) {
    const session = await getSession()
    if (!session || (session.rol !== "admin" && session.rol !== "supervisor")) {
        return { success: false, error: "No autorizado" }
    }

    const supabase = await createAdminClient()
    const { error } = await supabase.from("sectores").delete().eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/configuracion")
    return { success: true }
}

// --- EQUIPOS / MAQUINAS ---

export async function getEquipos() {
    const supabase = await createAdminClient()
    // Traemos también el nombre del sector para mostrarlo si es necesario
    const { data, error } = await supabase
        .from("equipos_maquinas")
        .select("*, sector:sectores(nombre)")
        .order("nombre")

    if (error) return { success: false, error: error.message }
    return { success: true, data }
}

export async function createEquipo(nombre: string, sectorId?: string) {
    const session = await getSession()
    if (!session || (session.rol !== "admin" && session.rol !== "supervisor")) {
        return { success: false, error: "No autorizado" }
    }

    const supabase = await createAdminClient()
    const payload: any = { nombre }
    if (sectorId && sectorId !== "null") payload.sector_id = sectorId

    const { error } = await supabase.from("equipos_maquinas").insert(payload)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/configuracion")
    return { success: true }
}

export async function deleteEquipo(id: string) {
    const session = await getSession()
    if (!session || (session.rol !== "admin" && session.rol !== "supervisor")) {
        return { success: false, error: "No autorizado" }
    }

    const supabase = await createAdminClient()
    const { error } = await supabase.from("equipos_maquinas").delete().eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/configuracion")
    return { success: true }
}