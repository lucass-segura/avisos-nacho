"use client"

import { useRef, useState } from "react"
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "react-sketch-canvas"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Undo, Trash2, Save, PenTool, Eraser } from "lucide-react"

interface ImageEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    imageSrc: string
    onSave: (editedImage: File) => void
}

export function ImageEditor({ open, onOpenChange, imageSrc, onSave }: ImageEditorProps) {
    const canvasRef = useRef<ReactSketchCanvasRef>(null)
    const [eraseMode, setEraseMode] = useState(false)
    const [strokeColor, setStrokeColor] = useState("red") // Color por defecto rojo para resaltar

    const handleSave = async () => {
        if (canvasRef.current) {
            // Exportar como imagen
            const base64 = await canvasRef.current.exportImage("png")

            // Convertir Base64 a File para que tu formulario lo pueda enviar
            const res = await fetch(base64)
            const blob = await res.blob()
            const file = new File([blob], "edited-image.png", { type: "image/png" })

            onSave(file)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Editar Imagen</DialogTitle>
                </DialogHeader>

                <div className="flex-1 relative bg-slate-100 w-full overflow-hidden flex items-center justify-center p-4">
                    {/* El Canvas */}
                    <ReactSketchCanvas
                        ref={canvasRef}
                        className="border shadow-sm max-h-full max-w-full"
                        strokeWidth={4}
                        strokeColor={strokeColor}
                        backgroundImage={imageSrc}
                        exportWithBackgroundImage={true}
                        preserveBackgroundImageAspectRatio="contain" // Mantiene la proporción de la foto
                        width="100%"
                        height="100%"
                    />
                </div>

                {/* Barra de Herramientas */}
                <div className="p-4 border-t bg-background flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-2">
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
                            title="Goma de borrar"
                        >
                            <Eraser className="h-4 w-4" />
                        </Button>

                        {/* Selector de color simple */}
                        {!eraseMode && (
                            <div className="flex gap-1 items-center ml-2 border-l pl-2">
                                {['red', 'yellow', 'white', 'black'].map(color => (
                                    <button
                                        key={color}
                                        className={`w-6 h-6 rounded-full border-2 ${strokeColor === color ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setStrokeColor(color)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
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
                    </div>

                    <Button onClick={handleSave} className="ml-auto gap-2">
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}