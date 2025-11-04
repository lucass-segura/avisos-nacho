"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const NOMBRES_SOLICITANTES = ["Ignacio Suñé", "Jésica Destéfano", "Noelia García", "Silvana Guccione"]
const TIPOS_SOLICITUD = ["Reparación / Acondicionamiento", "Oportunidad a Mejora", "Inversión"]
const CRITICIDAD_OPTIONS = [
  { value: "Bajo", label: "Bajo" },
  { value: "Medio", label: "Medio" },
  { value: "Alto", label: "Alto" },
  { value: "Crítico", label: "Crítico (avisar también por WhatsApp)" }, // Valor del filtro es "Crítico"
]

type Filters = {
  nombreSolicitante?: string
  tipoSolicitud?: string
  criticidad?: string
  usuarioId?: string
  fechaInicio?: string
  fechaFin?: string
}

type Usuario = {
  id: string
  username: string
}

export function SolicitudesFilters({
  onFilterChange,
  usuarios,
}: {
  onFilterChange: (filters: Filters) => void
  usuarios: Usuario[]
}) {
  const [filters, setFilters] = useState<Filters>({})
  const [fechaInicio, setFechaInicio] = useState<Date>()
  const [fechaFin, setFechaFin] = useState<Date>()

  function handleFilterChange(key: keyof Filters, value: string | undefined) {
    const newFilters = { ...filters }
    if (value) {
      newFilters[key] = value
    } else {
      delete newFilters[key]
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  function handleFechaInicioChange(date: Date | undefined) {
    setFechaInicio(date)
    if (date) {
      // Convertir a formato dd/mm/yyyy para el filtro
      const formatted = format(date, "dd/MM/yyyy")
      handleFilterChange("fechaInicio", formatted)
    } else {
      handleFilterChange("fechaInicio", undefined)
    }
  }

  function handleFechaFinChange(date: Date | undefined) {
    setFechaFin(date)
    if (date) {
      // Convertir a formato dd/mm/yyyy para el filtro
      const formatted = format(date, "dd/MM/yyyy")
      handleFilterChange("fechaFin", formatted)
    } else {
      handleFilterChange("fechaFin", undefined)
    }
  }

  function clearFilters() {
    setFilters({})
    setFechaInicio(undefined)
    setFechaFin(undefined)
    onFilterChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Nombre del Solicitante</Label>
          <Select value={filters.nombreSolicitante} onValueChange={(v) => handleFilterChange("nombreSolicitante", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {NOMBRES_SOLICITANTES.map((nombre) => (
                <SelectItem key={nombre} value={nombre}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Solicitud</Label>
          <Select value={filters.tipoSolicitud} onValueChange={(v) => handleFilterChange("tipoSolicitud", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {TIPOS_SOLICITUD.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Criticidad</Label>
          <Select value={filters.criticidad} onValueChange={(v) => handleFilterChange("criticidad", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {CRITICIDAD_OPTIONS.map((crit) => (
                <SelectItem key={crit.value} value={crit.value}>
                  {crit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Usuario</Label>
          <Select value={filters.usuarioId} onValueChange={(v) => handleFilterChange("usuarioId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {usuarios.map((usuario) => (
                <SelectItem key={usuario.id} value={usuario.id}>
                  {usuario.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fecha Inicio</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaInicio ? format(fechaInicio, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fechaInicio} onSelect={handleFechaInicioChange} locale={es} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Fecha Fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaFin ? format(fechaFin, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fechaFin} onSelect={handleFechaFinChange} locale={es} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
