"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Eye, EyeOff } from "lucide-react"
import type { RolUsuario } from "@/types"

const ROLES: { value: RolUsuario; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "tecnico", label: "Técnico" },
  { value: "solicitante", label: "Solicitante" },
]

interface CreateUserFormProps {
  currentRole: RolUsuario
}

export function CreateUserForm({ currentRole }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()

  const availableRoles = currentRole === "supervisor"
    ? ROLES.filter((r) => r.value === "tecnico" || r.value === "solicitante")
    : ROLES

  function validatePassword(): string | null {
    if (password.length < 5) return "La contraseña debe tener al menos 5 caracteres"
    if (password.includes(" ")) return "La contraseña no puede contener espacios"
    if (password !== confirmPassword) return "Las contraseñas no coinciden"
    return null
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")
    setSuccess("")

    const passError = validatePassword()
    if (passError) {
      setError(passError)
      setLoading(false)
      return
    }

    formData.set("password", password)
    const result = await createUser(formData)

    if (result.success) {
      setSuccess("Usuario creado exitosamente")
      setPassword("")
      setConfirmPassword("")
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
        <Input
          id="nombre_completo"
          name="nombre_completo"
          required
          disabled={loading}
          placeholder="Ej: Juan Pérez"
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Nombre de Usuario</Label>
        <Input
          id="username"
          name="username"
          required
          disabled={loading}
          placeholder="Sin espacios"
          className="h-10"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password_display"
            type={showPassword ? "text" : "password"}
            required
            disabled={loading}
            placeholder="Mínimo 5 caracteres, sin espacios"
            className="h-10 pr-10"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirmar Contraseña</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            type={showConfirm ? "text" : "password"}
            required
            disabled={loading}
            placeholder="Repetir contraseña"
            className="h-10 pr-10"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password && confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rol">Rol</Label>
        <Select name="rol" required disabled={loading}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-2.5 text-sm text-green-700">
          {success}
        </div>
      )}

      <Button type="submit" className="w-full h-10 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md shadow-sky-500/20 transition-all" disabled={loading}>
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
