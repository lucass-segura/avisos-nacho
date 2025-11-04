"use client"

import { useEffect, useState } from "react"
import { getAllSolicitudes } from "@/app/actions/solicitudes"
import { getAllUsers } from "@/app/actions/auth"
import { AdminSolicitudesList } from "@/components/admin-solicitudes-list"
import { SolicitudesFilters } from "@/components/solicitudes-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
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
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData(filters?: any) {
    setLoading(true)
    setCurrentPage(1) // Reset a primera página cuando cambian filtros
    const [solicitudesResult, usuariosResult] = await Promise.all([getAllSolicitudes(filters), getAllUsers()])

    if (solicitudesResult.success) {
      setAllSolicitudes(solicitudesResult.solicitudes as any)
    }

    if (usuariosResult.success) {
      setUsuarios(usuariosResult.users as any)
    }

    setLoading(false)
  }

  function handleFilterChange(filters: any) {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== "__all__") {
        acc[key] = value
      }
      return acc
    }, {} as any)

    loadData(cleanFilters)
  }

  function downloadCSV() {
    // Ordenar por fecha (más reciente primero)
    const sortedSolicitudes = [...allSolicitudes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    // Crear encabezados CSV
    const headers = [
      "Fecha",
      "Nombre del Solicitante",
      "Tipo de Solicitud",
      "Criticidad",
      "Descripción",
      "Usuario",
      "Tiene Imagen",
    ]

    // Crear filas CSV
    const rows = sortedSolicitudes.map((sol) => {
      const fecha = new Date(sol.created_at).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      })

      return [
        fecha,
        sol.nombre_solicitante,
        sol.tipo_solicitud,
        sol.criticidad,
        `"${sol.descripcion.replace(/"/g, '""')}"`, // Escapar comillas en descripción
        sol.usuario.username,
        sol.imagen_base64 ? "Sí" : "No",
      ]
    })

    // Combinar encabezados y filas
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Crear blob y descargar
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
              <CardTitle>Solicitudes</CardTitle>
              <CardDescription>Visualiza y filtra todas las solicitudes del sistema</CardDescription>
            </div>
            <Button onClick={downloadCSV} disabled={allSolicitudes.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <SolicitudesFilters onFilterChange={handleFilterChange} usuarios={usuarios} />

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando solicitudes...</p>
          ) : (
            <>
              <AdminSolicitudesList solicitudes={currentSolicitudes} />

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              <p className="text-sm text-muted-foreground text-center">
                Mostrando {startIndex + 1}-{Math.min(endIndex, allSolicitudes.length)} de {allSolicitudes.length}{" "}
                solicitudes
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
