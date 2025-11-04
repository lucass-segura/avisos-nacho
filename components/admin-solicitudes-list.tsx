"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

export function AdminSolicitudesList({ solicitudes }: { solicitudes: Solicitud[] }) {
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    })
  }

  function getCriticidadColor(criticidad: string) {
    if (criticidad.includes("Crítico")) return "destructive"
    if (criticidad === "Alto") return "default"
    if (criticidad === "Medio") return "secondary"
    return "outline"
  }

  function handleCardClick(solicitud: Solicitud) {
    setSelectedSolicitud(solicitud)
  }

  function handleCloseDialog() {
    setSelectedSolicitud(null)
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {solicitudes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 col-span-full">No hay solicitudes disponibles</p>
        ) : (
          solicitudes.map((solicitud) => (
            <Card
              key={solicitud.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick(solicitud)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{solicitud.nombre_solicitante}</CardTitle>
                  <Badge variant={getCriticidadColor(solicitud.criticidad)} className="shrink-0">
                    {solicitud.criticidad}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {solicitud.usuario.username}
                </div>
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

      <Dialog open={!!selectedSolicitud} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedSolicitud?.nombre_solicitante}</DialogTitle>
            <DialogDescription>Detalles de la solicitud</DialogDescription>
          </DialogHeader>
          {selectedSolicitud && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getCriticidadColor(selectedSolicitud.criticidad)}>{selectedSolicitud.criticidad}</Badge>
                <Badge variant="outline">{selectedSolicitud.tipo_solicitud}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Usuario: {selectedSolicitud.usuario.username}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(selectedSolicitud.created_at)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Descripción:</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedSolicitud.descripcion}</p>
              </div>

              {selectedSolicitud.imagen_base64 && selectedSolicitud.imagen_tipo && (
                <div>
                  <h4 className="font-semibold mb-2">Imagen:</h4>
                  <img
                    src={`data:${selectedSolicitud.imagen_tipo};base64,${selectedSolicitud.imagen_base64}`}
                    alt="Solicitud"
                    className="w-full h-auto rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
