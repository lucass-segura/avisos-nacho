import { getSession } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { DashboardStats } from "@/components/dashboard-stats"

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gradient">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de solicitudes
        </p>
      </div>
      <DashboardStats userRole={session.rol} userId={session.id} />
    </div>
  )
}
