"use client"

import { useEffect, useState, useCallback } from "react"
import { getAllSolicitudes } from "@/app/actions/solicitudes"
import { getSession } from "@/app/actions/auth"
import { createClient } from "@/lib/supabase/client"
import { SolicitudesWorkflowTabs } from "@/components/solicitudes-workflow-tabs"
import { SolicitudesFilters } from "@/components/solicitudes-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import type { Solicitud, FiltrosSolicitud, RolUsuario } from "@/types"

export default function AdminSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<RolUsuario>("admin")
  const [userId, setUserId] = useState("")
  const [activeFilters, setActiveFilters] = useState<FiltrosSolicitud>({})

  const loadData = useCallback(async (filters?: FiltrosSolicitud, showLoader = false) => {
    if (showLoader) setLoading(true)
    const f = filters ?? activeFilters
    const res = await getAllSolicitudes(f)
    if (res.success) setSolicitudes(res.solicitudes as Solicitud[])
    if (showLoader) setLoading(false)
  }, [activeFilters])

  useEffect(() => {
    getSession().then((s) => {
      if (s) {
        setUserRole(s.rol as RolUsuario)
        setUserId(s.id)
      }
    })
    loadData({}, true)
  }, [])

  // Realtime: escuchar cambios en solicitudes a nivel de página
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("rt-solicitudes-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitudes" }, () => {
        loadData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  function handleFilterChange(filters: FiltrosSolicitud) {
    setActiveFilters(filters)
    loadData(filters)
  }

  function downloadCSV() {
    const sorted = [...solicitudes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const headers = [
      "Fecha", "Solicitante", "Tipo", "Criticidad",
      "Descripción", "Estado", "Técnico Asignado", "Tiene Imagen",
    ]

    const rows = sorted.map((sol) => {
      const fecha = new Date(sol.created_at).toLocaleString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      })
      const tecnico = sol.tecnico?.nombre_completo || sol.tecnico?.username || "-"
      return [
        fecha,
        sol.nombre_solicitante,
        sol.tipo_solicitud,
        sol.criticidad,
        `"${sol.descripcion.replace(/"/g, '""')}"`,
        sol.estado,
        tecnico,
        sol.imagen_url ? "Sí" : "No",
      ]
    })

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `solicitudes_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong shadow-glass-lg border-0 rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-gradient">Bandeja de Entrada</CardTitle>
              <CardDescription>
                {solicitudes.length} solicitudes &middot; <span className="capitalize font-medium text-sky-600">{userRole}</span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2 glass border-white/40 hover:bg-white/60 transition-all" onClick={downloadCSV} disabled={solicitudes.length === 0}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SolicitudesFilters onFilterChange={handleFilterChange} />

          {loading ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Cargando solicitudes...</p>
            </div>
          ) : (
            <SolicitudesWorkflowTabs
              solicitudes={solicitudes}
              userRole={userRole}
              userId={userId}
              onRefresh={() => loadData()}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
