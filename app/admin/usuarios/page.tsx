import { getSession, getAllUsers } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateUserForm } from "@/components/create-user-form"
import { UsersList } from "@/components/users-list"
import type { RolUsuario, Usuario } from "@/types"

export default async function UsuariosPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  if (session.rol !== "admin" && session.rol !== "supervisor") {
    redirect("/admin")
  }

  const { users } = await getAllUsers()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="glass-strong border-0 rounded-2xl shadow-glass-lg">
        <CardHeader>
          <CardTitle className="text-gradient">Crear Usuario</CardTitle>
          <CardDescription>Agrega un nuevo usuario al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm currentRole={session.rol as RolUsuario} />
        </CardContent>
      </Card>

      <Card className="glass-strong border-0 rounded-2xl shadow-glass-lg">
        <CardHeader>
          <CardTitle className="text-gradient">Usuarios Registrados</CardTitle>
          <CardDescription>{users.length} usuarios en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersList
            users={users as Usuario[]}
            canDelete={session.rol === "admin"}
            isAdmin={session.rol === "admin"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
