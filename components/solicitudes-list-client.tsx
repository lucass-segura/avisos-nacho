"use client"

import { useEffect, useState } from "react"
import { getUserSolicitudes } from "@/app/actions/solicitudes"
import { Skeleton } from "@/components/ui/skeleton"
import { SolicitudesTable } from "@/components/solicitudes-table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function SolicitudesListClient() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Función para cargar datos
  async function loadSolicitudes() {
    setLoading(true)
    const result = await getUserSolicitudes()
    if (result.success) {
      setSolicitudes(result.solicitudes)
    }
    setLoading(false)
    router.refresh() // Actualiza componentes servidor si los hubiera
  }

  useEffect(() => {
    loadSolicitudes()
  }, [])

  if (loading && solicitudes.length === 0) {
    return <Skeleton className="h-64 w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={loadSolicitudes}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Solicitudes
        </Button>
      </div>

      {solicitudes.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No tienes solicitudes aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-4">
          <SolicitudesTable solicitudes={solicitudes} isAdmin={false} />
        </div>
      )}
    </div>
  )
}