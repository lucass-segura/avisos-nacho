import { getSession, logout } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Wrench, FileText, PlusCircle, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SolicitudForm } from "@/components/solicitud-form"
import { SolicitudesList } from "@/components/solicitudes-list"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Header */}
      <header className="glass-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-md shadow-indigo-500/20">
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
            <div className="flex items-center gap-2">
              <Link href="/dashboard/perfil">
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

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Tabs defaultValue="formulario" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 glass-strong rounded-xl p-1 shadow-glass">
            <TabsTrigger value="formulario" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <PlusCircle className="h-4 w-4" />
              Nueva Solicitud
            </TabsTrigger>
            <TabsTrigger value="mis-solicitudes" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <FileText className="h-4 w-4" />
              Mis Solicitudes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formulario">
            <SolicitudForm />
          </TabsContent>

          <TabsContent value="mis-solicitudes">
            <SolicitudesList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
