"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

type Solicitud = {
  id: string
  nombre_solicitante: string
  tipo_solicitud: string
  criticidad: string
  descripcion: string
  imagen_data: any
  imagen_tipo: string | null
  created_at: string
}

export function SolicitudesList({ solicitudes }: { solicitudes: Solicitud[] }) {
  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getCriticidadColor(criticidad: string) {
    if (criticidad.includes("Crítico")) return "destructive"
    if (criticidad === "Alto") return "default"
    if (criticidad === "Medio") return "secondary"
    return "outline"
  }

  return (
    <div className="space-y-4">
      {solicitudes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No has realizado solicitudes aún</p>
      ) : (
        solicitudes.map((solicitud) => (
          <Card key={solicitud.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{solicitud.nombre_solicitante}</CardTitle>
                <Badge variant={getCriticidadColor(solicitud.criticidad)}>{solicitud.criticidad}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(solicitud.created_at)}
              </div>
              <p className="text-sm">
                <span className="font-semibold">Tipo:</span> {solicitud.tipo_solicitud}
              </p>
              <p className="text-sm line-clamp-2">{solicitud.descripcion}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
