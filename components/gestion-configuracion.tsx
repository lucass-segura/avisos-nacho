"use client"

import { useState, useEffect } from "react"
import { createSector, deleteSector, createEquipo, deleteEquipo, getSectores, getEquipos } from "@/app/actions/configuracion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function GestionConfiguracion() {
    const [sectores, setSectores] = useState<any[]>([])
    const [equipos, setEquipos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Estados para formularios
    const [newSector, setNewSector] = useState("")
    const [newEquipo, setNewEquipo] = useState("")
    const [selectedSectorForEquipo, setSelectedSectorForEquipo] = useState<string | undefined>(undefined)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const [sectoresRes, equiposRes] = await Promise.all([getSectores(), getEquipos()])
        if (sectoresRes.success) setSectores(sectoresRes.data || [])
        if (equiposRes.success) setEquipos(equiposRes.data || [])
        setLoading(false)
    }

    // --- Handlers Sectores ---
    async function handleAddSector() {
        if (!newSector.trim()) return
        setIsSubmitting(true)
        const res = await createSector(newSector)
        if (res.success) {
            setNewSector("")
            toast({ title: "Sector creado" })
            loadData()
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        }
        setIsSubmitting(false)
    }

    async function handleDeleteSector(id: string) {
        if (!confirm("¿Eliminar sector? Esto podría afectar equipos asociados.")) return
        await deleteSector(id)
        loadData()
    }

    // --- Handlers Equipos ---
    async function handleAddEquipo() {
        if (!newEquipo.trim()) return
        setIsSubmitting(true)
        const res = await createEquipo(newEquipo, selectedSectorForEquipo)
        if (res.success) {
            setNewEquipo("")
            toast({ title: "Equipo creado" })
            loadData()
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        }
        setIsSubmitting(false)
    }

    async function handleDeleteEquipo(id: string) {
        if (!confirm("¿Eliminar equipo?")) return
        await deleteEquipo(id)
        loadData()
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <Tabs defaultValue="sectores" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sectores">Sectores</TabsTrigger>
                <TabsTrigger value="equipos">Equipos / Máquinas</TabsTrigger>
            </TabsList>

            {/* PESTAÑA SECTORES */}
            <TabsContent value="sectores" className="space-y-4 mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Agregar Sector</CardTitle>
                        <CardDescription>Define las áreas físicas de la planta u organización</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nombre del sector (ej: Cocina, Mantenimiento...)"
                                value={newSector}
                                onChange={(e) => setNewSector(e.target.value)}
                            />
                            <Button onClick={handleAddSector} disabled={isSubmitting || !newSector.trim()}>
                                <Plus className="h-4 w-4 mr-2" /> Agregar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        {sectores.length === 0 ? (
                            <p className="p-8 text-center text-muted-foreground">No hay sectores registrados</p>
                        ) : (
                            <div className="divide-y">
                                {sectores.map((sector) => (
                                    <div key={sector.id} className="flex items-center justify-between p-4">
                                        <span className="font-medium">{sector.nombre}</span>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSector(sector.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* PESTAÑA EQUIPOS */}
            <TabsContent value="equipos" className="space-y-4 mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Agregar Equipo o Máquina</CardTitle>
                        <CardDescription>Inventario de activos sujetos a mantenimiento</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-2">
                            <Input
                                placeholder="Nombre del equipo (ej: Heladera #4)"
                                value={newEquipo}
                                onChange={(e) => setNewEquipo(e.target.value)}
                                className="flex-1"
                            />
                            <Select value={selectedSectorForEquipo} onValueChange={setSelectedSectorForEquipo}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Sector (Opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sectores.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAddEquipo} disabled={isSubmitting || !newEquipo.trim()}>
                                <Plus className="h-4 w-4 mr-2" /> Agregar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        {equipos.length === 0 ? (
                            <p className="p-8 text-center text-muted-foreground">No hay equipos registrados</p>
                        ) : (
                            <div className="divide-y">
                                {equipos.map((equipo) => (
                                    <div key={equipo.id} className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="font-medium">{equipo.nombre}</p>
                                            {equipo.sector && (
                                                <p className="text-xs text-muted-foreground">Sector: {equipo.sector.nombre}</p>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipo(equipo.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}