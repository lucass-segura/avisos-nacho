"use client"

"use client"

export const dynamic = "force-dynamic"
import { useEffect, useState, useCallback } from "react"
import { getAllSolicitudes } from "@/app/actions/solicitudes"
import { SolicitudesWorkflowTabs } from "@/components/solicitudes-workflow-tabs" // Importamos el nuevo componente
import { getAllUsers, getSession } from "@/app/actions/auth"
import { SolicitudesTable } from "@/components/solicitudes-table"
import { SolicitudesFilters } from "@/components/solicitudes-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type Solicitud = {
  id: string
  nombre_solicitante: string
  tipo_solicitud: string
  criticidad: string
  descripcion: string
  imagen_base64: string | null
  imagen_tipo: string | null
  created_at: string
  fecha_recepcion: string | null
  fecha_derivacion: string | null
  derivado_a: string | null
  fecha_estimada: string | null
  estado: string
  observaciones: any[]
  usuario: { username: string }
}

type Usuario = {
  id: string
  username: string
}

const ITEMS_PER_PAGE = 4

export default function AdminSolicitudesPage() {
  const [allSolicitudes, setAllSolicitudes] = useState<Solicitud[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState({})

  useEffect(() => {
    async function fetchSession() {
      const session = await getSession();
      if (session) setUserRole(session.rol);
    }
    fetchSession();
    loadData(true);
  }, []);

  useEffect(() => {
    loadData(true) // true indica que es la carga inicial
  }, [])

  async function loadData(isInitial = false, filters?: any) {
    if (isInitial) setInitialLoading(true)

    const filtersToUse = filters || activeFilters

    if (filters) setCurrentPage(1)

    const [solicitudesResult, usuariosResult] = await Promise.all([
      getAllSolicitudes(filters),
      getAllUsers()
    ])

    if (solicitudesResult.success) {
      setAllSolicitudes(solicitudesResult.solicitudes as any)
    }

    if (usuariosResult.success) {
      setUsuarios(usuariosResult.users as any)
    }

    if (isInitial) setInitialLoading(false)
  }

  function handleFilterChange(filters: any) {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== "__all__") {
        acc[key] = value
      }
      return acc
    }, {} as any)

    setActiveFilters(cleanFilters)
    loadData(false, cleanFilters) // false = recarga silenciosa
  }

  const handleRefresh = useCallback(() => {
    loadData(false) // false = recarga silenciosa
  }, [activeFilters])

  // ... (La función downloadCSV se mantiene igual)
  function downloadCSV() {
    // ... (mismo código de antes)
    const sortedSolicitudes = [...allSolicitudes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    const headers = [
      "Fecha", "Nombre del Solicitante", "Tipo de Solicitud", "Criticidad",
      "Descripción", "Usuario", "Tiene Imagen", "Estado", "Derivado A"
    ]

    const rows = sortedSolicitudes.map((sol) => {
      const fecha = new Date(sol.created_at).toLocaleString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      })
      return [
        fecha, sol.nombre_solicitante, sol.tipo_solicitud, sol.criticidad,
        `"${sol.descripcion.replace(/"/g, '""')}"`, sol.usuario.username,
        sol.imagen_base64 ? "Sí" : "No", sol.estado || "Pendiente", sol.derivado_a || "-"
      ]
    })

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `solicitudes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = Math.ceil(allSolicitudes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentSolicitudes = allSolicitudes.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Gestión de Solicitudes</CardTitle>
              <CardDescription>Flujo de trabajo para {userRole}</CardDescription>
            </div>
            {/* Botones de descarga */}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <SolicitudesFilters onFilterChange={(f) => loadData(false, f)} usuarios={usuarios} />

          {initialLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Cargando tablero...</p>
            </div>
          ) : (
            /* AQUÍ IMPLEMENTAMOS LAS NUEVAS PESTAÑAS */
            <SolicitudesWorkflowTabs
              solicitudes={allSolicitudes}
              rolUsuario={userRole}
              onRefresh={() => loadData(false)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}