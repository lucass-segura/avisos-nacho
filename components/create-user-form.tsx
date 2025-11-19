"use client"

import { useState } from "react"
import { createUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function CreateUserForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")
    setSuccess("")

    const result = await createUser(formData)

    if (result.success) {
      setSuccess("Usuario creado exitosamente")
      const form = document.getElementById("create-user-form") as HTMLFormElement
      form?.reset()
      router.refresh()
    } else {
      setError(result.error || "Error al crear usuario")
    }

    setLoading(false)
  }

  return (
    <form id="create-user-form" action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre_completo">Nombre Completo</Label>
        <Input id="nombre_completo" name="nombre_completo" required disabled={loading} placeholder="Ej: Ignacio Suñé" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Nombre de Usuario</Label>
        <Input id="username" name="username" required disabled={loading} placeholder="sin espacios" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          disabled={loading}
          placeholder="más de 4 caracteres, sin espacios"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rol">Rol</Label>
        <Select name="rol" required disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuario</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando...
          </>
        ) : (
          "Crear Usuario"
        )}
      </Button>
    </form>
  )
}