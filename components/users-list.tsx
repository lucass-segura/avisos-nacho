"use client"

import { useState } from "react"
import { deleteUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Shield, User, HardHat, UserCog } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Usuario = {
  id: string
  username: string
  nombre_completo: string | null
  rol: string
  created_at: string
}

export function UsersList({ users }: { users: Usuario[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const router = useRouter()

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case "admin":
        return <Shield className="h-5 w-5 text-primary" />
      case "supervisor":
        return <UserCog className="h-5 w-5 text-primary" />
      case "tecnico":
        return <HardHat className="h-5 w-5 text-primary" />
      case "solicitante":
        return <User className="h-5 w-5 text-primary" />
      default:
        return <User className="h-5 w-5 text-primary" />
    }
  }

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return "Admin";
      case 'supervisor': return "Supervisor";
      case 'tecnico': return "Técnico";
      case 'solicitante': return "Solicitante";
      default: return rol;
    }
  }

  const getBadgeVariant = (rol: string): "default" | "secondary" | "destructive" | "outline" => {
    if (rol === 'admin') return "default";
    if (rol === 'supervisor') return "secondary"; // O un color custom si prefieres
    return "outline";
  }

  function handleDeleteClick(userId: string) {
    setUserToDelete(userId)
    setShowDialog(true)
  }

  async function confirmDelete() {
    if (!userToDelete) return

    setDeletingId(userToDelete)
    setShowDialog(false)

    const result = await deleteUser(userToDelete)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }

    setDeletingId(null)
    setUserToDelete(null)
  }

  return (
    <>
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay usuarios registrados</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  {getRoleIcon(user.rol)}
                </div>
                <div>
                  <p className="font-medium text-sm">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.nombre_completo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getBadgeVariant(user.rol)}>
                  {getRoleLabel(user.rol)}
                </Badge>
                {/* Evitar borrar admins si no es necesario, o lógica adicional de permisos aquí */}
                {user.rol !== "admin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(user.id)}
                    disabled={deletingId === user.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
