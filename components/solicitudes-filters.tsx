"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Filter } from "lucide-react"
import type { FiltrosSolicitud, EstadoSolicitud, TipoSolicitud, Criticidad } from "@/types"

const TIPOS: TipoSolicitud[] = [
  "Reparación/Acondicionamiento",
  "Oportunidad a Mejora",
  "Inversión",
]
const CRITICIDADES: Criticidad[] = ["Bajo", "Medio", "Alto", "Crítico"]
const ESTADOS: EstadoSolicitud[] = [
  "Pendiente",
  "Recibida",
  "Derivada",
  "En proceso",
  "Finalizada",
]

interface SolicitudesFiltersProps {
  onFilterChange: (filters: FiltrosSolicitud) => void
}

export function SolicitudesFilters({ onFilterChange }: SolicitudesFiltersProps) {
  const [filters, setFilters] = useState<FiltrosSolicitud>({})

  function update(key: keyof FiltrosSolicitud, value: string | undefined) {
    const next = { ...filters }
    if (value && value !== "__all__") {
      (next as Record<string, string>)[key] = value
    } else {
      delete (next as Record<string, string | undefined>)[key]
    }
    setFilters(next)
    onFilterChange(next)
  }

  function clear() {
    setFilters({})
    onFilterChange({})
  }

  const hasFilters = Object.keys(filters).length > 0

  return (
    <div className="space-y-3 p-4 glass rounded-xl shadow-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear} className="gap-1.5 h-7 text-xs">
            <X className="h-3 w-3" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Buscar solicitante</Label>
          <Input
            placeholder="Nombre..."
            className="h-8 text-sm"
            value={filters.busqueda || ""}
            onChange={(e) => update("busqueda", e.target.value || undefined)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={filters.tipo_solicitud || "__all__"} onValueChange={(v) => update("tipo_solicitud", v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Criticidad</Label>
          <Select value={filters.criticidad || "__all__"} onValueChange={(v) => update("criticidad", v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {CRITICIDADES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Estado</Label>
          <Select value={filters.estado || "__all__"} onValueChange={(v) => update("estado", v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Fecha desde</Label>
          <Input
            type="date"
            className="h-8 text-sm"
            value={filters.fecha_desde || ""}
            onChange={(e) => update("fecha_desde", e.target.value || undefined)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Fecha hasta</Label>
          <Input
            type="date"
            className="h-8 text-sm"
            value={filters.fecha_hasta || ""}
            onChange={(e) => update("fecha_hasta", e.target.value || undefined)}
          />
        </div>
      </div>
    </div>
  )
}
