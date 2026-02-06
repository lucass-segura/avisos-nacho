import { getSession } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { GestionConfiguracion } from "@/components/gestion-configuracion"
import type { RolUsuario } from "@/types"

export default async function ConfiguracionPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  if (session.rol !== "admin" && session.rol !== "supervisor") {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gradient">Configuracion</h2>
        <p className="text-muted-foreground">
          Gestiona sectores, equipos y maquinas del sistema
        </p>
      </div>
      <GestionConfiguracion userRole={session.rol as RolUsuario} />
    </div>
  )
}
