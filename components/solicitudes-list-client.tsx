"use client"

import { useEffect, useState } from "react"
import { getUserSolicitudes } from "@/app/actions/solicitudes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Solicitud = {
  id: string
  nombre_solicitante: string
  tipo_solicitud: string
  criticidad: string
  descripcion: string
  imagen_base64: string | null
  imagen_tipo: string | null
  created_at: string
}

export function SolicitudesListClient() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{ base64: string; tipo: string } | null>(null)

  useEffect(() => {
    async function loadSolicitudes() {
      const result = await getUserSolicitudes()
      if (result.success) {
        setSolicitudes(result.solicitudes)
      }
      setLoading(false)
    }
    loadSolicitudes()
  }, [])

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {solicitudes.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No tienes solicitudes aún</p>
            </CardContent>
          </Card>
        ) : (
          solicitudes.map((solicitud) => (
            <Card key={solicitud.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{solicitud.nombre_solicitante}</CardTitle>
                  <Badge variant={getCriticidadColor(solicitud.criticidad)}>{solicitud.criticidad}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(solicitud.created_at)}
                </div>
                <div>
                  <p className="text-sm font-semibold">Tipo: {solicitud.tipo_solicitud}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Descripción:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{solicitud.descripcion}</p>
                </div>
                {solicitud.imagen_base64 && solicitud.imagen_tipo && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Imagen:</p>
                    <img
                      src={`data:${solicitud.imagen_tipo};base64,${solicitud.imagen_base64}`}
                      alt="Solicitud"
                      className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        setSelectedImage({ base64: solicitud.imagen_base64!, tipo: solicitud.imagen_tipo! })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Imagen de la solicitud</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={`data:${selectedImage.tipo};base64,${selectedImage.base64}`}
              alt="Solicitud"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
