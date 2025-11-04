import { getAllUsers } from "@/app/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateUserForm } from "@/components/create-user-form"
import { UsersList } from "@/components/users-list"

export default async function AdminUsuariosPage() {
  const { users } = await getAllUsers()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Usuario</CardTitle>
          <CardDescription>Agrega un nuevo usuario al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>Total: {users.length} usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersList users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
