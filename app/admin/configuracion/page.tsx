import { GestionConfiguracion } from "@/components/gestion-configuracion"

export default function AdminConfiguracionPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Gestión de Equipos y Sectores</h1>
            <GestionConfiguracion />
        </div>
    )
}