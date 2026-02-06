"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SolicitudesTable } from "@/components/solicitudes-table"
import { Badge } from "@/components/ui/badge"
import type { Solicitud, RolUsuario } from "@/types"

interface Props {
  solicitudes: Solicitud[]
  userRole: RolUsuario
  userId: string
  onRefresh?: () => void
}

export function SolicitudesWorkflowTabs({ solicitudes, userRole, userId, onRefresh }: Props) {
  const pendientes = solicitudes.filter((s) => s.estado === "Pendiente")
  const recibidas = solicitudes.filter((s) => s.estado === "Recibida")
  const derivadas = solicitudes.filter((s) => s.estado === "Derivada")
  const enProceso = solicitudes.filter((s) => s.estado === "En proceso")
  const finalizadas = solicitudes.filter((s) => s.estado === "Finalizada")

  // Tabla de visibilidad por rol:
  // Pendientes: admin + supervisor
  // Recibidas: admin + supervisor
  // Derivadas: todos (admin, supervisor, tecnico)
  // En Proceso: todos
  // Finalizadas: todos
  const allTabs = [
    { value: "pendientes", label: "Pendientes", data: pendientes, roles: ["admin", "supervisor"] },
    { value: "recibidas", label: "Recibidas", data: recibidas, roles: ["admin", "supervisor"] },
    { value: "derivadas", label: "Derivadas", data: derivadas, roles: ["admin", "supervisor", "tecnico"] },
    { value: "en_proceso", label: "En Proceso", data: enProceso, roles: ["admin", "supervisor", "tecnico"] },
    { value: "finalizadas", label: "Finalizadas", data: finalizadas, roles: ["admin", "supervisor", "tecnico"] },
  ]

  const tabs = allTabs.filter((tab) => tab.roles.includes(userRole))

  const defaultTab = tabs[0]?.value || "derivadas"

  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-4">
      <TabsList className="grid w-full glass-strong rounded-xl p-1 shadow-glass" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
            <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px] data-[state=active]:bg-white/20 data-[state=active]:text-white">
              {tab.data.length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <SolicitudesTable
            solicitudes={tab.data}
            userRole={userRole}
            userId={userId}
            onRefresh={onRefresh}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
