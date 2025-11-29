// types/index.ts

export type RolUsuario = 'admin' | 'supervisor' | 'tecnico' | 'solicitante';

// Definimos los estados posibles
export type EstadoSolicitud =
    | 'Pendiente'
    | 'Derivada'
    | 'En proceso'
    | 'Finalizada'
    | string; // Permitimos string genérico por compatibilidad temporal

export type Solicitud = {
    id: string;
    nombre_solicitante: string;
    tipo_solicitud: string;
    criticidad: string;
    descripcion: string;
    imagen_base64: string | null;
    imagen_tipo: string | null;
    created_at: string;
    estado: EstadoSolicitud;
    observaciones: any[];

    // Relaciones
    usuario?: { username: string; nombre_completo?: string };
    tecnico?: { username: string; nombre_completo?: string };

    // --- Campos existentes (Legacy / UI Actual) ---
    // Estos son los que faltaban y causaban el error
    fecha_recepcion?: string | null;
    fecha_derivacion?: string | null;
    derivado_a?: string | null;
    fecha_estimada?: string | null;

    // --- Campos nuevos (Migración reciente) ---
    sector_id?: string | null;
    equipo_id?: string | null;
    tecnico_asignado_id?: string | null;

    // Nuevos Timestamps de flujo
    fecha_recepcion_supervisor?: string | null;
    fecha_derivacion_tecnico?: string | null;
    fecha_recepcion_tecnico?: string | null;
    fecha_inicio_trabajo?: string | null;
    fecha_finalizacion?: string | null;
}