"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SolicitudesTable } from "@/components/solicitudes-table"
import { Badge } from "@/components/ui/badge"
import { Solicitud } from "@/types"

interface SolicitudesWorkflowTabsProps {
    solicitudes: Solicitud[];
    rolUsuario: string;
    onRefresh?: () => void;
}

export function SolicitudesWorkflowTabs({ solicitudes, rolUsuario, onRefresh }: SolicitudesWorkflowTabsProps) {

    // Lógica de filtrado según el estado para cada pestaña
    // Nota: Mapeamos los estados de la DB a las pestañas visuales

    const recibidas = solicitudes.filter(s => s.estado === 'Pendiente' || s.estado === 'Derivada');
    const pendientes = solicitudes.filter(s => s.estado === 'Derivada'); // Para el técnico, "Recibidas" son las derivadas
    const enProceso = solicitudes.filter(s => s.estado === 'En proceso');
    const finalizadas = solicitudes.filter(s => s.estado === 'Finalizada');

    // Definimos las pestañas según lo solicitado
    // "recibidas", "pendientes", "en proceso", "finalizadas"

    return (
        <Tabs defaultValue="recibidas" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
                <TabsTrigger value="recibidas" className="gap-2">
                    Recibidas
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">{recibidas.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pendientes" className="gap-2">
                    Pendientes
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">{pendientes.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="en_proceso" className="gap-2">
                    En Proceso
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">{enProceso.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="finalizadas" className="gap-2">
                    Finalizadas
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">{finalizadas.length}</Badge>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="recibidas" className="mt-4">
                <SolicitudesTable
                    solicitudes={recibidas}
                    isAdmin={rolUsuario === 'admin' || rolUsuario === 'supervisor'}
                    onRefresh={onRefresh}
                />
            </TabsContent>

            <TabsContent value="pendientes" className="mt-4">
                <SolicitudesTable
                    solicitudes={pendientes}
                    isAdmin={rolUsuario === 'admin' || rolUsuario === 'supervisor' || rolUsuario === 'tecnico'}
                    onRefresh={onRefresh}
                />
            </TabsContent>

            <TabsContent value="en_proceso" className="mt-4">
                <SolicitudesTable
                    solicitudes={enProceso}
                    isAdmin={rolUsuario === 'admin' || rolUsuario === 'supervisor' || rolUsuario === 'tecnico'}
                    onRefresh={onRefresh}
                />
            </TabsContent>

            <TabsContent value="finalizadas" className="mt-4">
                <SolicitudesTable
                    solicitudes={finalizadas}
                    isAdmin={false} // Generalmente las finalizadas son solo lectura salvo para admin
                    onRefresh={onRefresh}
                />
            </TabsContent>
        </Tabs>
    )
}