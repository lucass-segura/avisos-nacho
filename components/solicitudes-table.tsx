"use client"

import { useState, useEffect } from "react"
import { updateSolicitud, addObservacion, deleteObservacion } from "@/app/actions/solicitudes"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageIcon, MessageSquare, Trash2, CheckCircle2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

// ... (Tipo Solicitud se mantiene igual)
type Solicitud = {
    id: string
    nombre_solicitante: string
    tipo_solicitud: string
    criticidad: string
    descripcion: string
    imagen_base64: string | null
    imagen_tipo: string | null
    created_at: string
    fecha_recepcion: string | null
    fecha_derivacion: string | null
    derivado_a: string | null
    fecha_estimada: string | null
    estado: string
    observaciones: any[]
    usuario?: { username: string }
}

export function SolicitudesTable({
    solicitudes: initialSolicitudes,
    isAdmin = false,
    onRefresh
}: {
    solicitudes: Solicitud[]
    isAdmin?: boolean
    onRefresh?: () => void
}) {
    const router = useRouter()
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initialSolicitudes)
    const supabase = createClient()

    // 1. Sincronización con datos del padre (cuando loadData termina silenciosamente)
    useEffect(() => {
        setSolicitudes(initialSolicitudes)
    }, [initialSolicitudes])

    // 2. Realtime
    useEffect(() => {
        if (!isAdmin) return

        const channel = supabase
            .channel('realtime-solicitudes-table')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'solicitudes' },
                () => {
                    // Cuando llega un cambio, pedimos recarga silenciosa
                    if (onRefresh) onRefresh()
                    else router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router, isAdmin, onRefresh])

    // --- Handlers Optimistas (Sin esperas) ---

    const handleUpdate = async (id: string, field: string, value: any) => {
        // 1. Actualización VISUAL inmediata
        setSolicitudes(prev => prev.map(sol =>
            sol.id === id ? { ...sol, [field]: value } : sol
        ))

        // 2. Envío silencioso al servidor
        const result = await updateSolicitud(id, { [field]: value })

        if (!result.success) {
            console.error("Error guardando:", result.error)
            // Solo si falla revertimos o avisamos (opcional: usar toast)
            if (onRefresh) onRefresh()
        }
    }

    const handleRecepcionar = async (id: string) => {
        const fechaRecepcion = new Date().toISOString()

        setSolicitudes(prev => prev.map(sol =>
            sol.id === id ? {
                ...sol,
                fecha_recepcion: fechaRecepcion
            } : sol
        ))

        await updateSolicitud(id, {
            fecha_recepcion: fechaRecepcion,
        })
    }

    // --- Helpers ---
    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "-"
        return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es })
    }

    const toInputDate = (dateStr: string | null) => {
        if (!dateStr) return ""
        // Manejar zona horaria para evitar desfases de día
        return dateStr.split('T')[0]
    }

    const getCriticidadBadge = (crit: string) => {
        const variants: any = { "Bajo": "secondary", "Medio": "default", "Alto": "destructive", "Crítico": "destructive" }
        return <Badge variant={variants[crit] || "outline"}>{crit}</Badge>
    }

    const getEstadoBadge = (estado: string) => {
        const styles: any = {
            "Pendiente": "bg-yellow-100 text-yellow-800 border-yellow-200",
            "En proceso": "bg-blue-100 text-blue-800 border-blue-200",
            "Solucionado": "bg-green-100 text-green-800 border-green-200"
        }
        return <Badge className={cn("whitespace-nowrap", styles[estado])} variant="outline">{estado}</Badge>
    }

    const onAddObservation = (id: string, newObsArr: any[]) => {
        setSolicitudes(prev => prev.map(sol =>
            sol.id === id ? { ...sol, observaciones: newObsArr } : sol
        ))
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table className="min-w-[1500px]">
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[150px]">Fecha</TableHead>
                        <TableHead className="w-[150px]">Solicitante</TableHead>
                        <TableHead className="w-[200px]">Tipo</TableHead>
                        <TableHead className="w-[100px]">Criticidad</TableHead>
                        <TableHead className="w-[300px]">Solicitud</TableHead>
                        <TableHead className="w-[80px]">Foto</TableHead>
                        <TableHead className="w-[180px]">Recepción</TableHead>
                        <TableHead className="w-[150px]">Derivada</TableHead>
                        <TableHead className="w-[150px]">A (Persona)</TableHead>
                        <TableHead className="w-[150px]">Estimada</TableHead>
                        <TableHead className="w-[100px]">Notas</TableHead>
                        <TableHead className="w-[150px] text-right">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {solicitudes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                                No hay solicitudes registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        solicitudes.map((sol) => (
                            <TableRow key={sol.id} className="hover:bg-slate-50/50 transition-colors">
                                {/* Fecha y Alerta */}
                                <TableCell className="text-xs font-medium">
                                    {formatDisplayDate(sol.created_at)}
                                    {isAdmin && !sol.fecha_recepcion && (
                                        <div className="flex items-center gap-1 text-amber-600 mt-1 text-[10px] font-bold animate-pulse">
                                            <AlertTriangle className="h-3 w-3" /> ¡NUEVA!
                                        </div>
                                    )}
                                </TableCell>

                                <TableCell className="text-sm">{sol.nombre_solicitante}</TableCell>
                                <TableCell className="text-xs">{sol.tipo_solicitud}</TableCell>
                                <TableCell>{getCriticidadBadge(sol.criticidad)}</TableCell>

                                <TableCell>
                                    <div className="max-h-[80px] overflow-y-auto text-xs text-muted-foreground scrollbar-thin">
                                        {sol.descripcion}
                                    </div>
                                </TableCell>

                                {/* Foto */}
                                <TableCell>
                                    {sol.imagen_base64 ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                    <ImageIcon className="h-5 w-5" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95 border-none">
                                                <div className="relative w-full h-[80vh] flex items-center justify-center">
                                                    <img
                                                        src={`data:${sol.imagen_tipo};base64,${sol.imagen_base64}`}
                                                        alt="Evidencia"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                    <Button
                                                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full"
                                                        onClick={() => {
                                                            const closeBtn = document.querySelector('[data-radix-focus-guard]') as HTMLElement;
                                                            if (closeBtn) closeBtn.click();
                                                        }}
                                                    >
                                                        <span className="sr-only">Cerrar</span>
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>

                                {/* Recepción */}
                                <TableCell>
                                    {isAdmin ? (
                                        !sol.fecha_recepcion ? (
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 w-full shadow-sm"
                                                onClick={() => handleRecepcionar(sol.id)}
                                            // Sin estado disabled para que se sienta instantáneo
                                            >
                                                Recepcionar
                                            </Button>
                                        ) : (
                                            <div className="text-xs text-green-700 font-medium flex flex-col animate-in fade-in duration-300">
                                                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> OK</span>
                                                <span className="text-[10px] opacity-70">{formatDisplayDate(sol.fecha_recepcion)}</span>
                                            </div>
                                        )
                                    ) : (
                                        sol.fecha_recepcion ? formatDisplayDate(sol.fecha_recepcion) : "Pendiente"
                                    )}
                                </TableCell>

                                {/* Inputs Admin */}
                                <TableCell>
                                    {isAdmin ? (
                                        <Input
                                            type="date"
                                            className="h-8 text-xs"
                                            value={toInputDate(sol.fecha_derivacion)}
                                            disabled={!sol.fecha_recepcion}
                                            onChange={(e) => handleUpdate(sol.id, "fecha_derivacion", e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-xs">{sol.fecha_derivacion ? format(new Date(sol.fecha_derivacion), "dd/MM/yyyy") : "-"}</span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    {isAdmin ? (
                                        <Input
                                            className="h-8 text-xs"
                                            placeholder="Nombre..."
                                            value={sol.derivado_a || ""}
                                            disabled={!sol.fecha_recepcion}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSolicitudes(prev => prev.map(s => s.id === sol.id ? { ...s, derivado_a: val } : s))
                                            }}
                                            onBlur={(e) => handleUpdate(sol.id, "derivado_a", e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-xs">{sol.derivado_a || "-"}</span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    {isAdmin ? (
                                        <Input
                                            type="date"
                                            className="h-8 text-xs"
                                            value={toInputDate(sol.fecha_estimada)}
                                            disabled={!sol.fecha_recepcion}
                                            onChange={(e) => handleUpdate(sol.id, "fecha_estimada", e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-xs">{sol.fecha_estimada ? format(new Date(sol.fecha_estimada), "dd/MM/yyyy") : "-"}</span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <ObservacionesModal
                                        solicitud={sol}
                                        isAdmin={isAdmin}
                                        onUpdate={(newObs) => onAddObservation(sol.id, newObs)}
                                    />
                                </TableCell>

                                <TableCell className="text-right">
                                    {isAdmin ? (
                                        <Select
                                            value={sol.estado}
                                            onValueChange={(val) => handleUpdate(sol.id, "estado", val)}
                                            disabled={!sol.fecha_recepcion}
                                        >
                                            <SelectTrigger className="h-8 w-[120px] text-xs ml-auto">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                <SelectItem value="En proceso">En proceso</SelectItem>
                                                <SelectItem value="Solucionado">Solucionado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        getEstadoBadge(sol.estado)
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

function ObservacionesModal({ solicitud, isAdmin, onUpdate }: { solicitud: Solicitud, isAdmin: boolean, onUpdate: (obs: any[]) => void }) {
    const [newNote, setNewNote] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleAddNote = async () => {
        if (!newNote.trim()) return

        // Optimista
        const tempNote = {
            id: Math.random().toString(),
            text: newNote,
            date: new Date().toISOString(),
            author: "Yo"
        }
        const updatedObs = [...(solicitud.observaciones || []), tempNote]

        onUpdate(updatedObs) // Actualiza la tabla padre al instante
        setNewNote("")
        setIsSaving(true)

        await addObservacion(solicitud.id, newNote)
        setIsSaving(false)
        // No llamamos refresh aquí, ya se actualizó visualmente
    }

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("¿Eliminar nota?")) return
        const filtered = (solicitud.observaciones || []).filter((o: any) => o.id !== noteId)
        onUpdate(filtered)
        await deleteObservacion(solicitud.id, noteId)
    }

    // ... (Resto del JSX del modal igual)
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                    <MessageSquare className={cn("h-4 w-4", (solicitud.observaciones?.length || 0) > 0 ? "text-blue-600 fill-blue-100" : "text-muted-foreground")} />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Notas y Novedades</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <ScrollArea className="h-[300px] w-full rounded-md border bg-slate-50/50 p-4">
                        {(solicitud.observaciones?.length || 0) === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                <MessageSquare className="h-8 w-8 mb-2" />
                                <p className="text-xs">No hay notas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {solicitud.observaciones.map((obs: any) => (
                                    <div key={obs.id} className="bg-white p-3 rounded-lg shadow-sm border text-sm relative group">
                                        <div className="flex justify-between items-center mb-1 border-b pb-1">
                                            <span className="font-semibold text-xs text-primary">{obs.author || "Admin"}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(new Date(obs.date), "dd/MM/yy HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 whitespace-pre-wrap text-xs mt-2">{obs.text}</p>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteNote(obs.id)}
                                                className="absolute -top-2 -right-2 bg-white border shadow-sm p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                title="Eliminar nota"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {isAdmin && (
                    <div className="flex gap-2 items-end">
                        <Textarea
                            placeholder="Nueva nota..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="min-h-[60px] resize-none text-xs"
                        />
                        <Button
                            onClick={handleAddNote}
                            disabled={isSaving || !newNote.trim()}
                            size="sm"
                        >
                            Enviar
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}