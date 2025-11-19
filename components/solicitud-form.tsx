"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createSolicitud } from "@/app/actions/solicitudes"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, X, Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import imageCompression from "browser-image-compression"

const TIPOS_SOLICITUD = ["Reparación / Acondicionamiento", "Oportunidad a Mejora", "Inversión"]

const CRITICIDADES = [
  { value: "Bajo", label: "Bajo" },
  { value: "Medio", label: "Medio" },
  { value: "Alto", label: "Alto" },
  { value: "Crítico", label: "Crítico (avisar también por WhatsApp)" },
]

export function SolicitudForm({ nombreSolicitante }: { nombreSolicitante?: string }) {
  const [loading, setLoading] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [isProcessingImage, setIsProcessingImage] = useState(false)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingImage(true)

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.7,
    }

    try {
      console.log(`Tamaño original: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

      const compressedFile = await imageCompression(file, options)

      console.log(`Tamaño comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)

      setImageFile(compressedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error("Error al comprimir la imagen:", error)
      setErrorMessage("Error al procesar la imagen. Por favor, intente con otra foto.")
      setShowErrorModal(true)
    } finally {
      setIsProcessingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (cameraInputRef.current) cameraInputRef.current.value = ""
    }
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setErrorMessage("")

    if (imageFile) {
      formData.set("imagen", imageFile)
    }

    const result = await createSolicitud(formData)

    setLoading(false)

    if (result.success) {
      const form = document.getElementById("solicitud-form") as HTMLFormElement
      form?.reset()
      removeImage()
      setShowSuccessModal(true)
      router.refresh()
    } else {
      setErrorMessage(result.error || "Error al enviar solicitud")
      setShowErrorModal(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Nueva Solicitud</CardTitle>
          <CardDescription>Completa el formulario para enviar una nueva solicitud</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="solicitud-form" action={handleSubmit} className="space-y-6">

            <div className="space-y-3">
              <Label className="text-base font-semibold">
                ¿Qué tipo de Solicitud es? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup name="tipo_solicitud" required disabled={loading}>
                {TIPOS_SOLICITUD.map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <RadioGroupItem value={tipo} id={tipo} />
                    <Label htmlFor={tipo} className="font-normal cursor-pointer">
                      {tipo}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Criticidad de la Solicitud <span className="text-red-500">*</span>
              </Label>
              <RadioGroup name="criticidad" required disabled={loading}>
                {CRITICIDADES.map((crit) => (
                  <div key={crit.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={crit.value} id={crit.value} />
                    <Label htmlFor={crit.value} className="font-normal cursor-pointer">
                      {crit.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="descripcion" className="text-base font-semibold">
                ¿Cuál es la Solicitud? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Tu respuesta"
                required
                disabled={loading}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Foto</Label>
              {!imagePreview ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
                    <div className="flex gap-4">
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
                      {isProcessingImage ? "Procesando imagen..." : "JPG, JPEG, PNG (máx. 10MB)"}
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
                  <CardContent className="p-4">
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={removeImage}
                        disabled={loading || isProcessingImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || isProcessingImage}>
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

      <Dialog open={loading} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Enviando solicitud...</DialogTitle>
            <DialogDescription>Por favor espera mientras procesamos tu solicitud.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorModal(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¡Éxito!</DialogTitle>
            <DialogDescription>Solicitud enviada con éxito</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}