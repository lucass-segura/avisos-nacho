"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteUser, adminChangeUserPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminPasswordDialog } from "@/components/admin-password-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Shield, User, HardHat, UserCog, KeyRound, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import type { Usuario, RolUsuario } from "@/types"

const ROLE_ICONS: Record<RolUsuario, typeof Shield> = {
  admin: Shield,
  supervisor: UserCog,
  tecnico: HardHat,
  solicitante: User,
}

const ROLE_LABELS: Record<RolUsuario, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  tecnico: "Tecnico",
  solicitante: "Solicitante",
}

const ROLE_BADGE: Record<RolUsuario, "default" | "secondary" | "outline"> = {
  admin: "default",
  supervisor: "secondary",
  tecnico: "outline",
  solicitante: "outline",
}

interface UsersListProps {
  users: Usuario[]
  canDelete: boolean
  isAdmin: boolean
}

export function UsersList({ users, canDelete, isAdmin }: UsersListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const router = useRouter()

  async function confirmDelete() {
    if (!userToDelete) return
    const id = userToDelete
    setDeletingId(id)

    const result = await deleteUser(id)
    if (result.success) {
      toast.success("Usuario eliminado")
      router.refresh()
    } else {
      toast.error(result.error || "Error al eliminar usuario")
    }
    setDeletingId(null)
  }

  async function handleChangePassword() {
    if (!passwordTarget) return
    if (newPassword.length < 5) {
      toast.error("La contraseña debe tener al menos 5 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setChangingPassword(true)
    const res = await adminChangeUserPassword(passwordTarget.id, newPassword)
    if (res.success) {
      toast.success(`Contraseña de ${passwordTarget.name} cambiada`)
      closePasswordDialog()
    } else {
      toast.error(res.error)
    }
    setChangingPassword(false)
  }

  function closePasswordDialog() {
    setPasswordTarget(null)
    setNewPassword("")
    setConfirmPassword("")
    setShowPassword(false)
  }

  return (
    <>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay usuarios registrados
          </p>
        ) : (
          users.map((user) => {
            const Icon = ROLE_ICONS[user.rol] || User
            return (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl glass p-3 shadow-glass hover:shadow-glass-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.nombre_completo || user.username}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={ROLE_BADGE[user.rol] || "outline"}>
                    {ROLE_LABELS[user.rol] || user.rol}
                  </Badge>
                  {isAdmin && user.rol !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Cambiar contraseña"
                      onClick={() => setPasswordTarget({ id: user.id, name: user.nombre_completo || user.username })}
                    >
                      <KeyRound className="h-4 w-4 text-sky-600" />
                    </Button>
                  )}
                  {canDelete && user.rol !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setUserToDelete(user.id)}
                      disabled={deletingId === user.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete dialog */}
      <AdminPasswordDialog
        open={!!userToDelete}
        onOpenChange={(open) => { if (!open) setUserToDelete(null) }}
        onConfirm={confirmDelete}
        title="Eliminar usuario"
        description="Esta accion no se puede deshacer. El usuario sera eliminado permanentemente. Ingresa tu contraseña de administrador para confirmar."
      />

      {/* Change password dialog */}
      <Dialog open={!!passwordTarget} onOpenChange={(open) => { if (!open) closePasswordDialog() }}>
        <DialogContent className="sm:max-w-sm glass-solid border-0 shadow-glass-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gradient">
              Cambiar contraseña de {passwordTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 5 caracteres"
                  className="h-10 pr-10"
                  autoComplete="off"
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
              <Label>Confirmar contraseña</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10"
                autoComplete="off"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || newPassword.length < 5 || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md transition-all"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
