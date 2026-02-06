import { getSession } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { SolicitudForm } from "@/components/solicitud-form"

export default async function FormularioPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto">
      <SolicitudForm />
    </div>
  )
}
