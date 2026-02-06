"use client"

import { useEffect, useState } from "react"
import { getUserSolicitudes } from "@/app/actions/solicitudes"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RefreshCw,
  Calendar,
  ImageIcon,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Solicitud } from "@/types"

export function SolicitudesList() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await getUserSolicitudes()
    if (res.success) setSolicitudes(res.solicitudes as Solicitud[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading && solicitudes.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const estadoStyle: Record<string, string> = {
    Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Recibida: "bg-blue-50 text-blue-700 border-blue-200",
    Derivada: "bg-purple-50 text-purple-700 border-purple-200",
    "En proceso": "bg-sky-100 text-sky-800 border-sky-200",
    Finalizada: "bg-green-100 text-green-800 border-green-200",
  }

  const critVariant = (c: string): "destructive" | "default" | "secondary" | "outline" => {
    if (c === "Crítico" || c === "Alto") return "destructive"
    if (c === "Medio") return "default"
    return "secondary"
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-2 glass border-white/40 hover:bg-white/60 transition-all"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {solicitudes.length === 0 ? (
        <Card className="glass border-0 rounded-xl">
          <CardContent className="py-10 text-center text-muted-foreground">
            No tienes solicitudes aún. Crea una desde la pestaña &quot;Nueva Solicitud&quot;.
          </CardContent>
        </Card>
      ) : (
        solicitudes.map((sol) => (
          <Card key={sol.id} className="glass hover:shadow-glass transition-all duration-200 border-0 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Header: tipo + criticidad */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{sol.tipo_solicitud}</span>
                    <Badge variant={critVariant(sol.criticidad)} className="text-[10px]">
                      {sol.criticidad}
                    </Badge>
                  </div>

                  {/* Descripcion */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sol.descripcion}
                  </p>

                  {/* Metadata row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(sol.created_at), "dd/MM/yy HH:mm", { locale: es })}
                    </span>
                    {sol.sector?.nombre && (
                      <span>{sol.sector.nombre}</span>
                    )}
                    {sol.tecnico?.nombre_completo && (
                      <span className="flex items-center gap-0.5">
                        <ChevronRight className="h-3 w-3" />
                        Tec: {sol.tecnico.nombre_completo}
                      </span>
                    )}
                    {sol.derivado_por?.nombre_completo && (
                      <span className="text-violet-600">
                        Deriv: {sol.derivado_por.nombre_completo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: estado + imagen */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    className={cn("text-[10px] whitespace-nowrap", estadoStyle[sol.estado])}
                    variant="outline"
                  >
                    {sol.estado}
                  </Badge>
                  {sol.imagen_url && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                        <DialogTitle className="sr-only">Vista previa de imagen</DialogTitle>
                        <div className="relative w-full h-[80vh] flex items-center justify-center">
                          <img
                            src={sol.imagen_url}
                            alt="Imagen de solicitud"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
