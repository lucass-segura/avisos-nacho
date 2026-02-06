import { getSession } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gradient">Mi Perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tu informacion personal y seguridad
        </p>
      </div>
      <ProfileForm session={session} />
    </div>
  )
}
