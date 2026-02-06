"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  updateSolicitud,
  recepcionarSolicitud,
  derivarSolicitud,
  iniciarTrabajo,
  finalizarSolicitud,
  registrarVistaSupervisor,
  registrarVistaTecnico,
} from "@/app/actions/solicitudes"
import { addObservacionConImagen, deleteObservacion, getObservaciones } from "@/app/actions/observaciones"
import { getAllUsers } from "@/app/actions/auth"
import { createClient } from "@/lib/supabase/client"
import imageCompression from "browser-image-compression"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ImageIcon, MessageSquare, Trash2, CheckCheck,
  AlertTriangle, Play, Flag, Paperclip, Loader2, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Solicitud, Observacion, EstadoSolicitud, RolUsuario, Usuario } from "@/types"

interface SolicitudesTableProps {
  solicitudes: Solicitud[]
  userRole: RolUsuario
  userId: string
  onRefresh?: () => void
}

export function SolicitudesTable({
  solicitudes: initial,
  userRole,
  userId,
  onRefresh,
}: SolicitudesTableProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initial)
  const [tecnicos, setTecnicos] = useState<Pick<Usuario, "id" | "username" | "nombre_completo">[]>([])
  const [iniciarDialogId, setIniciarDialogId] = useState<string | null>(null)
  const [fechaEstimada, setFechaEstimada] = useState("")

  const isManager = userRole === "admin" || userRole === "supervisor"

  useEffect(() => {
    setSolicitudes(initial)
  }, [initial])

  // Registrar vista cuando se cargan las solicitudes (optimistic + DB)
  useEffect(() => {
    const now = new Date().toISOString()

    if (isManager) {
      const ids: string[] = []
      initial.forEach((sol) => {
        if (!sol.fecha_vista_supervisor) {
          ids.push(sol.id)
          registrarVistaSupervisor(sol.id)
        }
      })
      if (ids.length > 0) {
        setSolicitudes((prev) =>
          prev.map((s) =>
            ids.includes(s.id) ? { ...s, fecha_vista_supervisor: now } : s
          )
        )
      }
    }

    if (userRole === "tecnico") {
      const ids: string[] = []
      initial.forEach((sol) => {
        if (!sol.fecha_vista_tecnico) {
          ids.push(sol.id)
          registrarVistaTecnico(sol.id)
        }
      })
      if (ids.length > 0) {
        setSolicitudes((prev) =>
          prev.map((s) =>
            ids.includes(s.id) ? { ...s, fecha_vista_tecnico: now } : s
          )
        )
      }
    }
  }, [initial, isManager, userRole])

  // Cargar técnicos para asignación
  useEffect(() => {
    if (!isManager) return
    getAllUsers().then((res) => {
      if (res.success) {
        setTecnicos(
          res.users
            .filter((u: { rol: string }) => u.rol === "tecnico")
            .map((u: { id: string; username: string; nombre_completo: string | null }) => ({
              id: u.id,
              username: u.username,
              nombre_completo: u.nombre_completo,
            }))
        )
      }
    })
  }, [isManager])

  // --- Handlers ---

  const handleRecepcionar = async (id: string) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, estado: "Recibida" as EstadoSolicitud, fecha_recepcion_supervisor: new Date().toISOString() }
          : s
      )
    )
    await recepcionarSolicitud(id)
  }

  const handleDerivar = async (id: string, tecnicoId: string) => {
    const tecnicoData = tecnicos.find((t) => t.id === tecnicoId)
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              estado: "Derivada" as EstadoSolicitud,
              tecnico_asignado_id: tecnicoId,
              tecnico: tecnicoData ? { username: tecnicoData.username, nombre_completo: tecnicoData.nombre_completo } : s.tecnico,
              derivado_por_id: userId,
              fecha_derivacion_tecnico: new Date().toISOString(),
            }
          : s
      )
    )
    await derivarSolicitud(id, tecnicoId)
  }

  const handleIniciar = async (id: string) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, estado: "En proceso" as EstadoSolicitud, fecha_inicio_trabajo: new Date().toISOString() }
          : s
      )
    )
    await iniciarTrabajo(id, fechaEstimada || undefined)
    setIniciarDialogId(null)
    setFechaEstimada("")
  }

  const handleFinalizar = async (id: string) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, estado: "Finalizada" as EstadoSolicitud, fecha_finalizacion: new Date().toISOString() }
          : s
      )
    )
    await finalizarSolicitud(id)
  }

  const handleFieldUpdate = async (id: string, field: string, value: string) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
    await updateSolicitud(id, { [field]: value })
  }

  // --- Helpers ---

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "-"
    return format(new Date(d), "dd/MM/yy HH:mm", { locale: es })
  }

  const critBadge = (c: string) => {
    const v: Record<string, "secondary" | "default" | "destructive"> = {
      Bajo: "secondary", Medio: "default", Alto: "destructive", "Crítico": "destructive",
    }
    return <Badge variant={v[c] || "outline"} className="text-[10px]">{c}</Badge>
  }

  const estadoBadge = (e: string) => {
    const s: Record<string, string> = {
      Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Recibida: "bg-blue-50 text-blue-700 border-blue-200",
      Derivada: "bg-purple-50 text-purple-700 border-purple-200",
      "En proceso": "bg-sky-100 text-sky-800 border-sky-200",
      Finalizada: "bg-green-100 text-green-800 border-green-200",
    }
    return <Badge className={cn("text-[10px] whitespace-nowrap", s[e])} variant="outline">{e}</Badge>
  }

  // --- Acciones según estado y rol ---

  const renderActions = (sol: Solicitud) => {
    // Pendiente → solo admin/supervisor pueden recepcionar
    if (sol.estado === "Pendiente" && isManager) {
      return (
        <Button
          size="sm"
          className="h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm w-full transition-all"
          onClick={() => handleRecepcionar(sol.id)}
        >
          Recepcionar
        </Button>
      )
    }

    // Recibida → solo admin/supervisor pueden derivar
    if (sol.estado === "Recibida" && isManager) {
      return (
        <Select onValueChange={(tecId) => handleDerivar(sol.id, tecId)}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Asignar técnico" />
          </SelectTrigger>
          <SelectContent>
            {tecnicos.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nombre_completo || t.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Derivada → solo técnico (y admin) pueden iniciar
    if (sol.estado === "Derivada" && (userRole === "admin" || userRole === "tecnico")) {
      return (
        <Dialog open={iniciarDialogId === sol.id} onOpenChange={(open) => {
          if (open) setIniciarDialogId(sol.id)
          else { setIniciarDialogId(null); setFechaEstimada("") }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 w-full">
              <Play className="h-3 w-3" /> Iniciar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm glass-solid border-0 shadow-glass-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-gradient">Iniciar trabajo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Fecha estimada de finalización (opcional)</Label>
                <Input
                  type="date"
                  value={fechaEstimada}
                  onChange={(e) => setFechaEstimada(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md transition-all" onClick={() => handleIniciar(sol.id)}>
                <Play className="h-4 w-4 mr-2" /> Confirmar inicio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )
    }

    // En proceso → solo técnico (y admin) pueden finalizar
    if (sol.estado === "En proceso" && (userRole === "admin" || userRole === "tecnico")) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 w-full text-green-700 border-green-300 hover:bg-green-50"
          onClick={() => handleFinalizar(sol.id)}
        >
          <Flag className="h-3 w-3" /> Finalizar
        </Button>
      )
    }

    return estadoBadge(sol.estado)
  }

  return (
    <div className="rounded-xl glass-strong shadow-glass overflow-x-auto">
      <Table className="min-w-[1200px]">
        <TableHeader className="bg-gradient-to-r from-sky-50/80 to-cyan-50/60">
          <TableRow>
            <TableHead className="w-[130px] py-3.5">Fecha</TableHead>
            <TableHead className="w-[140px] py-3.5">Solicitante</TableHead>
            <TableHead className="w-[180px] py-3.5">Tipo</TableHead>
            <TableHead className="w-[90px] py-3.5">Criticidad</TableHead>
            <TableHead className="w-[260px] py-3.5">Descripcion</TableHead>
            <TableHead className="w-[80px] py-3.5">Visto</TableHead>
            <TableHead className="w-[55px] py-3.5">Foto</TableHead>
            <TableHead className="w-[55px] py-3.5">Notas</TableHead>
            <TableHead className="w-[110px] py-3.5">Estado</TableHead>
            <TableHead className="w-[170px] py-3.5">Accion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitudes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                No hay solicitudes en esta seccion.
              </TableCell>
            </TableRow>
          ) : (
            solicitudes.map((sol) => (
              <TableRow key={sol.id} className="hover:bg-sky-50/30 transition-colors">
                <TableCell className="text-xs py-4">
                  {fmtDate(sol.created_at)}
                  {sol.estado === "Pendiente" && isManager && (
                    <div className="flex items-center gap-1 text-amber-600 mt-1 text-[10px] font-bold animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> NUEVA
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium py-4">{sol.nombre_solicitante}</TableCell>
                <TableCell className="text-xs py-4">{sol.tipo_solicitud}</TableCell>
                <TableCell className="py-4">{critBadge(sol.criticidad)}</TableCell>
                <TableCell className="py-4">
                  <div className="max-h-[70px] overflow-y-auto text-xs text-muted-foreground leading-relaxed">
                    {sol.descripcion}
                  </div>
                  {(sol.tecnico || sol.derivado_por) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                      {sol.tecnico?.nombre_completo && (
                        <span className="text-sky-600">
                          Tec: {sol.tecnico.nombre_completo}
                        </span>
                      )}
                      {sol.derivado_por?.nombre_completo && (
                        <span className="text-violet-600">
                          Deriv: {sol.derivado_por.nombre_completo}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1.5">
                    {sol.fecha_vista_supervisor ? (
                      <div className="flex items-center gap-1 text-[10px] text-sky-600">
                        <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                        <span className="leading-tight">Sup {format(new Date(sol.fecha_vista_supervisor), "dd/MM HH:mm")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                        <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>Sup —</span>
                      </div>
                    )}
                    {sol.tecnico_asignado_id && (
                      sol.fecha_vista_tecnico ? (
                        <div className="flex items-center gap-1 text-[10px] text-sky-600">
                          <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                          <span className="leading-tight">Téc {format(new Date(sol.fecha_vista_tecnico), "dd/MM HH:mm")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                          <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                          <span>Téc —</span>
                        </div>
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  {sol.imagen_url ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                        <DialogTitle className="sr-only">Vista previa de imagen</DialogTitle>
                        <div className="relative w-full h-[80vh] flex items-center justify-center">
                          <img
                            src={sol.imagen_url}
                            alt="Evidencia"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <ObservacionesChat
                    solicitudId={sol.id}
                    userId={userId}
                    userRole={userRole}
                  />
                </TableCell>
                <TableCell className="py-4">
                  {estadoBadge(sol.estado)}
                  {sol.fecha_estimada && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground">
                      Est: {format(new Date(sol.fecha_estimada), "dd/MM/yy")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4">{renderActions(sol)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// --- Chat de observaciones con realtime e imágenes ---

function ObservacionesChat({
  solicitudId,
  userId,
  userRole,
}: {
  solicitudId: string
  userId: string
  userRole: RolUsuario
}) {
  const [obs, setObs] = useState<Observacion[]>([])
  const [newNote, setNewNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const canEdit = userRole === "admin" || userRole === "supervisor" || userRole === "tecnico"
  const isAdmin = userRole === "admin"

  const loadObs = async () => {
    const res = await getObservaciones(solicitudId)
    if (res.success) setObs(res.observaciones as Observacion[])
  }

  // Cargar notas al abrir
  useEffect(() => {
    if (isOpen) loadObs()
  }, [isOpen])

  // Realtime para notas
  useEffect(() => {
    if (!isOpen) return
    const supabase = createClient()
    const channel = supabase
      .channel(`rt-obs-${solicitudId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "observaciones",
        filter: `solicitud_id=eq.${solicitudId}`,
      }, () => {
        loadObs()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isOpen, solicitudId])

  // Auto-scroll al final cuando cambian las notas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [obs])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Comprimir imagen
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      useWebWorker: true,
      initialQuality: 0.7,
    })

    setImageFile(compressed)
    setImagePreview(URL.createObjectURL(compressed))

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const clearImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const handleSend = async () => {
    if (!newNote.trim() && !imageFile) return
    setSaving(true)

    const formData = new FormData()
    formData.set("solicitud_id", solicitudId)
    formData.set("texto", newNote)
    if (imageFile) formData.set("imagen", imageFile)

    const res = await addObservacionConImagen(formData)
    if (res.success) {
      setNewNote("")
      clearImage()
    } else {
      toast.error(res.error)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteObservacion(id)
    if (!res.success) {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-solid border-0 shadow-glass-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-gradient">Chat de notas</DialogTitle>
        </DialogHeader>

        {/* Mensajes */}
        <div ref={scrollRef} className="h-[340px] overflow-y-auto rounded-xl border border-sky-100 bg-slate-50/90 p-3 space-y-2.5">
          {obs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-6 w-6 mb-2 opacity-40" />
              <p className="text-xs">Sin notas aún</p>
            </div>
          ) : (
            obs.map((o) => {
              const isOwn = o.autor_id === userId
              const canDelete = isOwn || isAdmin
              return (
                <div
                  key={o.id}
                  className={cn(
                    "max-w-[85%] p-3 rounded-xl border text-sm relative group shadow-sm",
                    isOwn
                      ? "ml-auto bg-sky-50 border-sky-200/60"
                      : "bg-white border-slate-200/60"
                  )}
                >
                  <div className="flex justify-between items-center mb-1 text-xs gap-2">
                    <span className="font-semibold text-primary truncate">
                      {o.autor_nombre}
                      <span className="text-muted-foreground font-normal ml-1">({o.autor_rol})</span>
                    </span>
                    <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                      {format(new Date(o.created_at), "dd/MM HH:mm")}
                    </span>
                  </div>
                  {o.imagen_url && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <img
                          src={o.imagen_url}
                          alt="Imagen adjunta"
                          className="rounded-md max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity mb-1.5 w-full"
                        />
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                        <DialogTitle className="sr-only">Imagen de nota</DialogTitle>
                        <div className="relative w-full h-[80vh] flex items-center justify-center">
                          <img
                            src={o.imagen_url}
                            alt="Imagen adjunta"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {o.texto && o.texto !== "📷 Imagen" && (
                    <p className="text-xs text-foreground/80 whitespace-pre-wrap">{o.texto}</p>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="absolute -top-1.5 -right-1.5 bg-background border shadow-sm p-0.5 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Input de chat */}
        {canEdit && (
          <div className="space-y-2">
            {/* Preview de imagen adjunta */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-16 rounded-md border object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 bg-background border shadow-sm p-0.5 rounded-full text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                placeholder="Escribir nota..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                className="min-h-[40px] max-h-[80px] resize-none text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={saving || (!newNote.trim() && !imageFile)}
                size="sm"
                className="shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
