"use client"

import { useState, useEffect } from "react"
import {
  createSector, deleteSector, updateSector, getSectores,
  createEquipo, deleteEquipo, updateEquipo, getEquipos,
} from "@/app/actions/configuracion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AdminPasswordDialog } from "@/components/admin-password-dialog"
import { Trash2, Plus, Loader2, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import type { Sector, Equipo, RolUsuario } from "@/types"

interface GestionConfiguracionProps {
  userRole: RolUsuario
}

export function GestionConfiguracion({ userRole }: GestionConfiguracionProps) {
  const [sectores, setSectores] = useState<Sector[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)

  const [newSector, setNewSector] = useState("")
  const [newEquipo, setNewEquipo] = useState("")
  const [sectorForEquipo, setSectorForEquipo] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Edit state
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null)
  const [editingSectorName, setEditingSectorName] = useState("")
  const [editingEquipoId, setEditingEquipoId] = useState<string | null>(null)
  const [editingEquipoName, setEditingEquipoName] = useState("")
  const [editingEquipoSector, setEditingEquipoSector] = useState("")

  // Delete with admin password
  const [deleteTarget, setDeleteTarget] = useState<{ type: "sector" | "equipo"; id: string; name: string } | null>(null)

  const isAdmin = userRole === "admin"

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [s, e] = await Promise.all([getSectores(), getEquipos()])
    if (s.success) setSectores(s.data as Sector[])
    if (e.success) setEquipos(e.data as Equipo[])
    setLoading(false)
  }

  // --- Sectores ---
  async function handleAddSector() {
    if (!newSector.trim()) return
    setSubmitting(true)
    const res = await createSector(newSector)
    if (res.success) {
      setNewSector("")
      toast.success("Sector creado")
      loadData()
    } else {
      toast.error(res.error)
    }
    setSubmitting(false)
  }

  async function handleEditSector(id: string) {
    if (!editingSectorName.trim()) return
    setSubmitting(true)
    const res = await updateSector(id, editingSectorName)
    if (res.success) {
      setEditingSectorId(null)
      toast.success("Sector actualizado")
      loadData()
    } else {
      toast.error(res.error)
    }
    setSubmitting(false)
  }

  async function handleConfirmDeleteTarget() {
    if (!deleteTarget) return
    let res
    if (deleteTarget.type === "sector") {
      res = await deleteSector(deleteTarget.id)
    } else {
      res = await deleteEquipo(deleteTarget.id)
    }
    if (res.success) {
      toast.success(`${deleteTarget.type === "sector" ? "Sector" : "Equipo"} eliminado`)
      loadData()
    } else {
      toast.error(res.error)
    }
  }

  // --- Equipos ---
  async function handleAddEquipo() {
    if (!newEquipo.trim()) return
    setSubmitting(true)
    const res = await createEquipo(newEquipo, sectorForEquipo || undefined)
    if (res.success) {
      setNewEquipo("")
      setSectorForEquipo("")
      toast.success("Equipo creado")
      loadData()
    } else {
      toast.error(res.error)
    }
    setSubmitting(false)
  }

  async function handleEditEquipo(id: string) {
    if (!editingEquipoName.trim()) return
    setSubmitting(true)
    const res = await updateEquipo(id, editingEquipoName, editingEquipoSector || undefined)
    if (res.success) {
      setEditingEquipoId(null)
      toast.success("Equipo actualizado")
      loadData()
    } else {
      toast.error(res.error)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="sectores" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-2 glass-strong rounded-xl p-1 shadow-glass">
          <TabsTrigger value="sectores" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Sectores</TabsTrigger>
          <TabsTrigger value="equipos" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Equipos / Máquinas</TabsTrigger>
        </TabsList>

        {/* Sectores */}
        <TabsContent value="sectores" className="space-y-4">
          <Card className="glass-strong border-0 rounded-xl shadow-glass">
            <CardHeader>
              <CardTitle className="text-gradient">Agregar Sector</CardTitle>
              <CardDescription>Áreas físicas de la organización</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del sector..."
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSector()}
                  className="h-10"
                />
                <Button onClick={handleAddSector} disabled={submitting || !newSector.trim()} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 rounded-xl shadow-glass">
            <CardContent className="p-0">
              {sectores.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground text-sm">
                  No hay sectores registrados
                </p>
              ) : (
                <div className="divide-y">
                  {sectores.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3">
                      {editingSectorId === s.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <Input
                            value={editingSectorName}
                            onChange={(e) => setEditingSectorName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSector(s.id)
                              if (e.key === "Escape") setEditingSectorId(null)
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleEditSector(s.id)}
                            disabled={submitting}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => setEditingSectorId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-sm">{s.nombre}</span>
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingSectorId(s.id)
                                  setEditingSectorName(s.nombre)
                                }}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteTarget({ type: "sector", id: s.id, name: s.nombre })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipos */}
        <TabsContent value="equipos" className="space-y-4">
          <Card className="glass-strong border-0 rounded-xl shadow-glass">
            <CardHeader>
              <CardTitle className="text-gradient">Agregar Equipo / Máquina</CardTitle>
              <CardDescription>Activos sujetos a mantenimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nombre del equipo..."
                  value={newEquipo}
                  onChange={(e) => setNewEquipo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEquipo()}
                  className="flex-1 h-10"
                />
                <Select value={sectorForEquipo} onValueChange={setSectorForEquipo}>
                  <SelectTrigger className="w-full sm:w-[200px] h-10">
                    <SelectValue placeholder="Sector (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddEquipo} disabled={submitting || !newEquipo.trim()} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 rounded-xl shadow-glass">
            <CardContent className="p-0">
              {equipos.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground text-sm">
                  No hay equipos registrados
                </p>
              ) : (
                <div className="divide-y">
                  {equipos.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-4 py-3">
                      {editingEquipoId === e.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2 flex-wrap sm:flex-nowrap">
                          <Input
                            value={editingEquipoName}
                            onChange={(ev) => setEditingEquipoName(ev.target.value)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") handleEditEquipo(e.id)
                              if (ev.key === "Escape") setEditingEquipoId(null)
                            }}
                            className="h-8 text-sm flex-1"
                            autoFocus
                          />
                          <Select value={editingEquipoSector} onValueChange={setEditingEquipoSector}>
                            <SelectTrigger className="h-8 text-sm w-full sm:w-[160px]">
                              <SelectValue placeholder="Sector" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">Sin sector</SelectItem>
                              {sectores.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleEditEquipo(e.id)}
                            disabled={submitting}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => setEditingEquipoId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="font-medium text-sm">{e.nombre}</p>
                            {e.sector?.nombre && (
                              <p className="text-xs text-muted-foreground">
                                Sector: {e.sector.nombre}
                              </p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingEquipoId(e.id)
                                  setEditingEquipoName(e.nombre)
                                  setEditingEquipoSector(e.sector_id || "null")
                                }}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteTarget({ type: "equipo", id: e.id, name: e.nombre })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdminPasswordDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={handleConfirmDeleteTarget}
        title={`Eliminar ${deleteTarget?.type === "sector" ? "sector" : "equipo"}`}
        description={`Se eliminará "${deleteTarget?.name}". Esta acción no se puede deshacer. Ingresa tu contraseña de administrador para confirmar.`}
      />
    </>
  )
}
