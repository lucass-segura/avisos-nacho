import { getSession, logout } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { Button } from "@/components/ui/button"
import { LogOut, Wrench, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function DashboardPerfilPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gradient-animated">
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-md shadow-sky-500/20">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  Avisos Empresa
                </h1>
                <p className="text-xs text-muted-foreground">
                  {session.nombre_completo || session.username}
                </p>
              </div>
            </div>
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
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <ProfileForm session={session} />
      </main>
    </div>
  )
}
