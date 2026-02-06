"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { getAllSolicitudes } from "@/app/actions/solicitudes"
import { getAllUsers } from "@/app/actions/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList, Clock, CheckCircle2, AlertTriangle,
  Users, Loader2, TrendingUp, Wrench, BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Solicitud, RolUsuario, Usuario } from "@/types"

interface DashboardStatsProps {
  userRole: RolUsuario
  userId: string
}

const ESTADOS = [
  { key: "Pendiente", label: "Pendientes", color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  { key: "Recibida", label: "Recibidas", color: "bg-sky-400", text: "text-sky-700", bg: "bg-sky-50" },
  { key: "Derivada", label: "Derivadas", color: "bg-violet-400", text: "text-violet-700", bg: "bg-violet-50" },
  { key: "En proceso", label: "En Proceso", color: "bg-cyan-400", text: "text-cyan-700", bg: "bg-cyan-50" },
  { key: "Finalizada", label: "Finalizadas", color: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50" },
] as const

const CRITICIDADES = [
  { key: "Bajo", color: "bg-slate-400", text: "text-slate-700", bg: "bg-slate-50" },
  { key: "Medio", color: "bg-sky-400", text: "text-sky-700", bg: "bg-sky-50" },
  { key: "Alto", color: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" },
  { key: "Crítico", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
] as const

const TIPOS = [
  { key: "Reparación/Acondicionamiento", short: "Reparacion", color: "bg-sky-400" },
  { key: "Oportunidad a Mejora", short: "Mejora", color: "bg-emerald-400" },
  { key: "Inversión", short: "Inversion", color: "bg-violet-400" },
] as const

export function DashboardStats({ userRole, userId }: DashboardStatsProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [tecnicos, setTecnicos] = useState<Pick<Usuario, "id" | "username" | "nombre_completo">[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [tecnicoFilter, setTecnicoFilter] = useState("__all__")

  const isAdmin = userRole === "admin"
  const isManager = userRole === "admin" || userRole === "supervisor"

  const loadData = useCallback(async () => {
    setLoading(true)
    const filters: Record<string, string> = {}
    if (fechaDesde) filters.fecha_desde = fechaDesde
    if (fechaHasta) filters.fecha_hasta = fechaHasta
    const res = await getAllSolicitudes(filters)
    if (res.success) setSolicitudes(res.solicitudes as Solicitud[])
    setLoading(false)
  }, [fechaDesde, fechaHasta])

  useEffect(() => {
    loadData()
    if (isManager) {
      getAllUsers().then((res) => {
        if (res.success) {
          setTecnicos(
            res.users
              .filter((u: { rol: string }) => u.rol === "tecnico")
              .map((u: { id: string; username: string; nombre_completo: string | null }) => ({
                id: u.id, username: u.username, nombre_completo: u.nombre_completo,
              }))
          )
        }
      })
    }
  }, [loadData, isManager])

  // Apply client-side technician filter
  const filtered = useMemo(() => {
    if (tecnicoFilter === "__all__") return solicitudes
    return solicitudes.filter((s) => s.tecnico_asignado_id === tecnicoFilter)
  }, [solicitudes, tecnicoFilter])

  // --- Computed stats ---
  const total = filtered.length
  const byEstado = useMemo(() => {
    const m: Record<string, number> = {}
    ESTADOS.forEach((e) => { m[e.key] = 0 })
    filtered.forEach((s) => { m[s.estado] = (m[s.estado] || 0) + 1 })
    return m
  }, [filtered])

  const byCriticidad = useMemo(() => {
    const m: Record<string, number> = {}
    CRITICIDADES.forEach((c) => { m[c.key] = 0 })
    filtered.forEach((s) => { m[s.criticidad] = (m[s.criticidad] || 0) + 1 })
    return m
  }, [filtered])

  const byTipo = useMemo(() => {
    const m: Record<string, number> = {}
    TIPOS.forEach((t) => { m[t.key] = 0 })
    filtered.forEach((s) => { m[s.tipo_solicitud] = (m[s.tipo_solicitud] || 0) + 1 })
    return m
  }, [filtered])

  const byTecnico = useMemo(() => {
    const m: Record<string, { nombre: string; total: number; enProceso: number; finalizadas: number }> = {}
    filtered.forEach((s) => {
      if (!s.tecnico_asignado_id) return
      const nombre = s.tecnico?.nombre_completo || s.tecnico?.username || "Sin nombre"
      if (!m[s.tecnico_asignado_id]) {
        m[s.tecnico_asignado_id] = { nombre, total: 0, enProceso: 0, finalizadas: 0 }
      }
      m[s.tecnico_asignado_id].total++
      if (s.estado === "En proceso") m[s.tecnico_asignado_id].enProceso++
      if (s.estado === "Finalizada") m[s.tecnico_asignado_id].finalizadas++
    })
    return Object.values(m).sort((a, b) => b.total - a.total)
  }, [filtered])

  // Average resolution time (only finalizadas with both dates)
  const avgResolutionDays = useMemo(() => {
    const finalizadas = filtered.filter((s) => s.estado === "Finalizada" && s.fecha_finalizacion)
    if (finalizadas.length === 0) return null
    const totalHours = finalizadas.reduce((acc, s) => {
      const start = new Date(s.created_at).getTime()
      const end = new Date(s.fecha_finalizacion!).getTime()
      return acc + (end - start) / (1000 * 60 * 60)
    }, 0)
    const avgHours = totalHours / finalizadas.length
    if (avgHours < 24) return `${Math.round(avgHours)}h`
    return `${(avgHours / 24).toFixed(1)}d`
  }, [filtered])

  // Percentage bar helper
  const pct = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Cargando estadisticas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="glass border-0 rounded-xl shadow-glass">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-9 w-[160px] text-sm bg-white/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-9 w-[160px] text-sm bg-white/60"
              />
            </div>
            {isManager && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tecnico</Label>
                <Select value={tecnicoFilter} onValueChange={setTecnicoFilter}>
                  <SelectTrigger className="h-9 w-[200px] text-sm bg-white/60">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los tecnicos</SelectItem>
                    {tecnicos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre_completo || t.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(fechaDesde || fechaHasta || tecnicoFilter !== "__all__") && (
              <button
                onClick={() => { setFechaDesde(""); setFechaHasta(""); setTecnicoFilter("__all__") }}
                className="text-xs text-sky-600 hover:text-sky-800 underline underline-offset-2 pb-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Total"
          value={total}
          accent="from-sky-500 to-cyan-500"
        />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Pendientes"
          value={byEstado["Pendiente"]}
          accent="from-amber-400 to-orange-400"
        />
        <KpiCard
          icon={<Clock className="h-5 w-5" />}
          label="En Proceso"
          value={byEstado["En proceso"]}
          accent="from-cyan-400 to-sky-400"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Finalizadas"
          value={byEstado["Finalizada"]}
          accent="from-emerald-400 to-green-400"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Resolucion Prom."
          value={avgResolutionDays || "-"}
          accent="from-violet-400 to-purple-400"
          small
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Estado breakdown */}
        <Card className="glass-strong border-0 rounded-2xl shadow-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-500" />
              Por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ESTADOS.map((e) => (
              <div key={e.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn("font-medium", e.text)}>{e.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {byEstado[e.key]} <span className="text-muted-foreground/60">({pct(byEstado[e.key])}%)</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", e.color)}
                    style={{ width: `${pct(byEstado[e.key])}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Criticidad breakdown */}
        <Card className="glass-strong border-0 rounded-2xl shadow-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Por Criticidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CRITICIDADES.map((c) => {
              const count = byCriticidad[c.key]
              return (
                <div key={c.key} className={cn("flex items-center justify-between p-3 rounded-xl", c.bg)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full", c.color)} />
                    <span className={cn("font-medium text-sm", c.text)}>{c.key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-lg font-bold", c.text)}>{count}</span>
                    <span className="text-xs text-muted-foreground">({pct(count)}%)</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Tipo + Tecnicos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tipo breakdown */}
        <Card className="glass-strong border-0 rounded-2xl shadow-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-sky-500" />
              Por Tipo de Solicitud
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TIPOS.map((t) => {
              const count = byTipo[t.key] || 0
              return (
                <div key={t.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.short}</span>
                    <span className="text-muted-foreground text-xs">
                      {count} <span className="text-muted-foreground/60">({pct(count)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", t.color)}
                      style={{ width: `${pct(count)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Per-technician stats */}
        {isManager && (
          <Card className="glass-strong border-0 rounded-2xl shadow-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-500" />
                Por Tecnico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {byTecnico.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay solicitudes asignadas a tecnicos
                </p>
              ) : (
                <div className="space-y-3">
                  {byTecnico.map((t) => (
                    <div key={t.nombre} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-cyan-100 shrink-0">
                        <Wrench className="h-4 w-4 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.nombre}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                          <span>{t.total} total</span>
                          <span className="text-cyan-600">{t.enProceso} activas</span>
                          <span className="text-emerald-600">{t.finalizadas} cerradas</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-sky-600">{t.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tecnico: su propia vista de resumen */}
        {userRole === "tecnico" && (
          <Card className="glass-strong border-0 rounded-2xl shadow-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                Mi Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <StatMini label="Asignadas" value={total} color="text-sky-600" />
                <StatMini label="Activas" value={byEstado["En proceso"]} color="text-cyan-600" />
                <StatMini label="Finalizadas" value={byEstado["Finalizada"]} color="text-emerald-600" />
                <StatMini label="Resolucion Prom." value={avgResolutionDays || "-"} color="text-violet-600" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function KpiCard({
  icon, label, value, accent, small,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent: string
  small?: boolean
}) {
  return (
    <Card className="glass-strong border-0 rounded-2xl shadow-glass overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
          accent,
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn("font-bold", small ? "text-lg" : "text-2xl")}>{value}</p>
          <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatMini({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/50 border border-white/60 text-center">
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
