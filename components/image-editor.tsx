"use client"

import { useRef, useState } from "react"
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "react-sketch-canvas"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Undo, Trash2, Save, PenTool, Eraser } from "lucide-react"

const COLORS = [
  { value: "#ef4444", label: "Rojo" },
  { value: "#eab308", label: "Amarillo" },
  { value: "#ffffff", label: "Blanco" },
  { value: "#000000", label: "Negro" },
  { value: "#3b82f6", label: "Azul" },
]

interface ImageEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onSave: (editedImage: File) => void
}

export function ImageEditor({ open, onOpenChange, imageSrc, onSave }: ImageEditorProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [eraseMode, setEraseMode] = useState(false)
  const [strokeColor, setStrokeColor] = useState("#ef4444")

  const handleSave = async () => {
    if (!canvasRef.current) return

    const base64 = await canvasRef.current.exportImage("png")
    const res = await fetch(base64)
    const blob = await res.blob()
    const file = new File([blob], "anotacion.png", { type: "image/png" })

    onSave(file)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>Anotar Imagen</DialogTitle>
        </DialogHeader>

        {/* Canvas */}
        <div className="flex-1 relative bg-slate-100 w-full overflow-hidden flex items-center justify-center p-4">
          <ReactSketchCanvas
            ref={canvasRef}
            className="border shadow-sm max-h-full max-w-full"
            strokeWidth={4}
            strokeColor={strokeColor}
            backgroundImage={imageSrc}
            exportWithBackgroundImage={true}
            preserveBackgroundImageAspectRatio="contain"
            width="100%"
            height="100%"
          />
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-t bg-background flex flex-wrap gap-2 items-center">
          <div className="flex gap-1.5">
            <Button
              variant={!eraseMode ? "default" : "outline"}
              size="icon"
              onClick={() => {
                setEraseMode(false)
                canvasRef.current?.eraseMode(false)
              }}
              title="Dibujar"
            >
              <PenTool className="h-4 w-4" />
            </Button>
            <Button
              variant={eraseMode ? "default" : "outline"}
              size="icon"
              onClick={() => {
                setEraseMode(true)
                canvasRef.current?.eraseMode(true)
              }}
              title="Borrador"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          {!eraseMode && (
            <div className="flex gap-1 items-center ml-1 border-l pl-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    strokeColor === c.value
                      ? "border-ring scale-110"
                      : "border-muted hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setStrokeColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          )}

          <div className="flex gap-1.5 ml-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => canvasRef.current?.undo()}
              title="Deshacer"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => canvasRef.current?.clearCanvas()}
              title="Limpiar todo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button onClick={handleSave} className="gap-2 ml-2">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
