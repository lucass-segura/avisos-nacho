import type React from "react"
import { redirect } from "next/navigation"
import { getSession, logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut, Users, FileText, Settings } from "lucide-react"
import Link from "next/link"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.rol !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
              <p className="text-sm text-slate-600">Bienvenido, {session.username}</p>
            </div>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm" className="gap-2 bg-transparent">
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-white/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <NavLink href="/admin/solicitudes" icon={<FileText className="h-4 w-4" />}>
              Solicitudes
            </NavLink>
            <NavLink href="/admin/usuarios" icon={<Users className="h-4 w-4" />}>
              Gestión de Usuarios
            </NavLink>
            <NavLink href="/admin/configuracion" icon={<Settings className="h-4 w-4" />}>
              Configuración
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 border-b-2 border-transparent hover:border-slate-900 transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}
