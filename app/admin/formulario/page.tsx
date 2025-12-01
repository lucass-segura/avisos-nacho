import { SolicitudForm } from "@/components/solicitud-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminNuevaSolicitudPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-2xl">Crear Nueva Solicitud</CardTitle>
                    <CardDescription>Genera un nuevo ticket de mantenimiento o mejora</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <SolicitudForm />
                </CardContent>
            </Card>
        </div>
    )
}