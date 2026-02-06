import type React from "react"
import { redirect } from "next/navigation"
import { getSession, logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Users,
  FileText,
  Settings,
  PlusCircle,
  Wrench,
  LayoutDashboard,
  User,
} from "lucide-react"
import { NavLink } from "@/components/nav-link"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const allowedRoles = ["admin", "supervisor", "tecnico"]
  if (!allowedRoles.includes(session.rol)) {
    redirect("/dashboard")
  }

  const canManageUsers =
    session.rol === "admin" || session.rol === "supervisor"

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Header */}
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-md shadow-sky-500/20">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  Panel de Administracion
                </h1>
                <p className="text-xs text-muted-foreground">
                  {session.nombre_completo || session.username} &middot;{" "}
                  <span className="capitalize font-medium text-sky-600">{session.rol}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/perfil">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center border-2 border-white/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  {session.avatar_url ? (
                    <img
                      src={session.avatar_url}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-sky-500" />
                  )}
                </div>
              </Link>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="gap-2 glass border-white/40 hover:bg-white/60 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Cerrar Sesion</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="glass-nav overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 min-w-max">
            <NavLink
              href="/admin"
              icon={<LayoutDashboard className="h-4 w-4" />}
            >
              Dashboard
            </NavLink>

            <NavLink
              href="/admin/solicitudes"
              icon={<FileText className="h-4 w-4" />}
            >
              Bandeja de Entrada
            </NavLink>

            <NavLink
              href="/admin/formulario"
              icon={<PlusCircle className="h-4 w-4" />}
            >
              Nueva Solicitud
            </NavLink>

            {canManageUsers && (
              <>
                <NavLink
                  href="/admin/usuarios"
                  icon={<Users className="h-4 w-4" />}
                >
                  Usuarios
                </NavLink>
                <NavLink
                  href="/admin/configuracion"
                  icon={<Settings className="h-4 w-4" />}
                >
                  Configuracion
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
