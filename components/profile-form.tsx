"use client"

import { useState, useRef } from "react"
import { changeOwnPassword, updateProfile, uploadAvatar } from "@/app/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Camera, User } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import imageCompression from "browser-image-compression"
import type { UserSession } from "@/types"

interface ProfileFormProps {
  session: UserSession
}

export function ProfileForm({ session }: ProfileFormProps) {
  const router = useRouter()

  // Profile state
  const [nombreCompleto, setNombreCompleto] = useState(session.nombre_completo || "")
  const [savingProfile, setSavingProfile] = useState(false)

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(session.avatar_url || "")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveProfile = async () => {
    if (!nombreCompleto.trim()) {
      toast.error("El nombre completo es requerido")
      return
    }
    setSavingProfile(true)
    const res = await updateProfile(nombreCompleto)
    if (res.success) {
      toast.success("Perfil actualizado")
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setSavingProfile(false)
  }

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB")
      return
    }

    setUploadingAvatar(true)

    try {
      // Comprimir imagen
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        useWebWorker: true,
        initialQuality: 0.7,
      })

      const formData = new FormData()
      formData.set("avatar", compressed)

      const res = await uploadAvatar(formData)
      if (res.success) {
        setAvatarUrl(res.avatar_url!)
        toast.success("Foto de perfil actualizada")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Error al procesar la imagen")
    }

    setUploadingAvatar(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error("Ingresa tu contraseña actual")
      return
    }
    if (newPassword.length < 5) {
      toast.error("La nueva contraseña debe tener al menos 5 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setSavingPassword(true)
    const res = await changeOwnPassword(currentPassword, newPassword)
    if (res.success) {
      toast.success("Contraseña cambiada correctamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast.error(res.error)
    }
    setSavingPassword(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar + Info */}
      <Card className="glass-strong border-0 rounded-2xl shadow-glass">
        <CardHeader>
          <CardTitle className="text-gradient">Mi Perfil</CardTitle>
          <CardDescription>Actualiza tu informacion personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center border-2 border-white shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-sky-500" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
            <div>
              <p className="font-medium">{session.nombre_completo || session.username}</p>
              <p className="text-sm text-muted-foreground">@{session.username}</p>
              <p className="text-xs text-sky-600 capitalize font-medium mt-0.5">{session.rol}</p>
            </div>
          </div>

          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre completo</Label>
            <Input
              id="nombre_completo"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Username (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input
              id="username"
              value={session.username}
              disabled
              className="h-10 bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">El nombre de usuario no se puede cambiar</p>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile || nombreCompleto === session.nombre_completo}
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md transition-all"
          >
            {savingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Cambio de contraseña */}
      <Card className="glass-strong border-0 rounded-2xl shadow-glass">
        <CardHeader>
          <CardTitle className="text-gradient">Cambiar Contraseña</CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña actual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-10 pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
            <Input
              id="confirm-password"
              type={showNew ? "text" : "password"}
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
            disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
            variant="outline"
            className="w-full"
          >
            {savingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cambiando...
              </>
            ) : (
              "Cambiar contraseña"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
