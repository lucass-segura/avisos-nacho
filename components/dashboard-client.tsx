"use client"

import { useEffect, useState } from "react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SolicitudForm } from "@/components/solicitud-form"
import { SolicitudesListClient } from "@/components/solicitudes-list-client"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardClient({ username }: { username: string }) {
  const [mounted, setMounted] = useState(false)

  // Esperar a que el componente se monte en el cliente para renderizar los Tabs
  // Esto evita el error de hidratación por los IDs de Radix UI
  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    await logout()
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ¡Hola {username}!
          </h1>
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {mounted ? (
          <Tabs defaultValue="formulario" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="formulario">Formulario</TabsTrigger>
              <TabsTrigger value="solicitudes">Mis Solicitudes</TabsTrigger>
            </TabsList>

            <TabsContent value="formulario" className="space-y-4">
              <div className="max-w-2xl mx-auto">
                <SolicitudForm />
              </div>
            </TabsContent>

            <TabsContent value="solicitudes" className="space-y-4">
              <div className="max-w-4xl mx-auto">
                <SolicitudesListClient />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Skeleton de carga para evitar saltos de diseño mientras se hidrata */
          <div className="space-y-6 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-full max-w-md mx-auto rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        )}
      </div>
    </div>
  )
}