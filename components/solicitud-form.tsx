"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import imageCompression from "browser-image-compression"
import { createSolicitud } from "@/app/actions/solicitudes"
import { getSectores, getEquipos } from "@/app/actions/configuracion"
import { ImageEditor } from "./image-editor"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Camera,
  Upload,
  X,
  Loader2,
  Pencil,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import type { Sector, Equipo } from "@/types"

const TIPOS_SOLICITUD = [
  "Reparación/Acondicionamiento",
  "Oportunidad a Mejora",
  "Inversión",
]

const CRITICIDADES = [
  { value: "Bajo", label: "Bajo" },
  { value: "Medio", label: "Medio" },
  { value: "Alto", label: "Alto" },
  { value: "Crítico", label: "Crítico (avisar también por WhatsApp)" },
]

const IMAGE_OPTIONS = {
  maxSizeMB: 0.5,
  useWebWorker: true,
  initialQuality: 0.7,
}

export function SolicitudForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)

  const [sectores, setSectores] = useState<Sector[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [selectedSector, setSelectedSector] = useState("")
  const [selectedEquipo, setSelectedEquipo] = useState("")

  const [modal, setModal] = useState<{
    type: "success" | "error" | "loading" | null
    message?: string
  }>({ type: null })

  // Cargar sectores y equipos
  useEffect(() => {
    async function load() {
      const [s, e] = await Promise.all([getSectores(), getEquipos()])
      if (s.success) setSectores(s.data as Sector[])
      if (e.success) setEquipos(e.data as Equipo[])
    }
    load()
  }, [])

  // Equipos filtrados por sector seleccionado
  const equiposFiltrados = selectedSector
    ? equipos.filter((e) => e.sector_id === selectedSector)
    : equipos

  async function processImage(file: File) {
    setIsProcessingImage(true)
    try {
      const compressed = await imageCompression(file, IMAGE_OPTIONS)
      setImageFile(compressed)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(compressed)
    } catch {
      setModal({ type: "error", message: "Error al procesar la imagen" })
    } finally {
      setIsProcessingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (cameraInputRef.current) cameraInputRef.current.value = ""
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  function handleEditorSave(editedFile: File) {
    setImageFile(editedFile)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(editedFile)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setModal({ type: "loading" })

    if (selectedSector) formData.set("sector_id", selectedSector)
    if (selectedEquipo) formData.set("equipo_id", selectedEquipo)
    if (imageFile) formData.set("imagen", imageFile)

    const result = await createSolicitud(formData)
    setLoading(false)

    if (result.success) {
      const form = document.getElementById("solicitud-form") as HTMLFormElement
      form?.reset()
      removeImage()
      setSelectedSector("")
      setSelectedEquipo("")
      setModal({ type: "success", message: "Solicitud enviada correctamente" })
      router.refresh()
    } else {
      setModal({ type: "error", message: result.error })
    }
  }

  return (
    <>
      <Card className="glass-strong shadow-glass-lg border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gradient">Nueva Solicitud</CardTitle>
          <CardDescription>
            Completa el formulario para enviar una solicitud de mantenimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="solicitud-form" action={handleSubmit} className="space-y-6">
            {/* Tipo de solicitud */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Tipo de Solicitud <span className="text-destructive">*</span>
              </Label>
              <RadioGroup name="tipo_solicitud" required disabled={loading}>
                {TIPOS_SOLICITUD.map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <RadioGroupItem value={tipo} id={`tipo-${tipo}`} />
                    <Label
                      htmlFor={`tipo-${tipo}`}
                      className="font-normal cursor-pointer"
                    >
                      {tipo}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Criticidad */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Criticidad <span className="text-destructive">*</span>
              </Label>
              <RadioGroup name="criticidad" required disabled={loading}>
                {CRITICIDADES.map((crit) => (
                  <div key={crit.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={crit.value}
                      id={`crit-${crit.value}`}
                    />
                    <Label
                      htmlFor={`crit-${crit.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {crit.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Sector <span className="text-muted-foreground text-sm font-normal">(opcional)</span>
              </Label>
              <Select
                value={selectedSector}
                onValueChange={(v) => {
                  setSelectedSector(v)
                  setSelectedEquipo("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sector..." />
                </SelectTrigger>
                <SelectContent>
                  {sectores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipo */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Equipo / Máquina{" "}
                <span className="text-muted-foreground text-sm font-normal">(opcional)</span>
              </Label>
              <Select value={selectedEquipo} onValueChange={setSelectedEquipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo..." />
                </SelectTrigger>
                <SelectContent>
                  {equiposFiltrados.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                      {e.sector ? ` (${e.sector.nombre})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-base font-semibold">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Describe el problema o la solicitud..."
                required
                disabled={loading}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Foto{" "}
                <span className="text-muted-foreground text-sm font-normal">(opcional)</span>
              </Label>

              {!imagePreview ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || isProcessingImage}
                        className="gap-2"
                      >
                        {isProcessingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Subir Imagen
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={loading || isProcessingImage}
                        className="gap-2"
                      >
                        {isProcessingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        Tomar Foto
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isProcessingImage
                        ? "Procesando imagen..."
                        : "JPG, PNG (se comprimirá automáticamente)"}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-3">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-auto rounded-lg border"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowImageEditor(true)}
                          disabled={loading}
                          className="shadow-sm gap-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Anotar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={removeImage}
                          disabled={loading}
                          className="shadow-sm h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md shadow-sky-500/20 transition-all"
              disabled={loading || isProcessingImage}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Editor de imagen */}
      {imagePreview && (
        <ImageEditor
          open={showImageEditor}
          onOpenChange={setShowImageEditor}
          imageSrc={imagePreview}
          onSave={handleEditorSave}
        />
      )}

      {/* Modal de carga */}
      <Dialog open={modal.type === "loading"} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-sm"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Enviando solicitud...</DialogTitle>
            <DialogDescription>
              Por favor espera mientras se procesa tu solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal éxito */}
      <Dialog
        open={modal.type === "success"}
        onOpenChange={() => setModal({ type: null })}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <DialogTitle className="text-center">Solicitud enviada</DialogTitle>
            <DialogDescription className="text-center">
              {modal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setModal({ type: null })}
              className="w-full"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal error */}
      <Dialog
        open={modal.type === "error"}
        onOpenChange={() => setModal({ type: null })}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <DialogTitle className="text-center">Error</DialogTitle>
            <DialogDescription className="text-center">
              {modal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setModal({ type: null })}
              variant="outline"
              className="w-full"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
