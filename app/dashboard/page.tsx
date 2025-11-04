import { redirect } from "next/navigation"
import { getSession } from "@/app/actions/auth"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.rol === "admin") {
    redirect("/admin")
  }

  return <DashboardClient username={session.username} />
}
