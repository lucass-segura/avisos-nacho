// types/index.ts

// --- Roles ---
export type RolUsuario = "admin" | "supervisor" | "tecnico" | "solicitante"

// --- Estados de solicitud ---
export type EstadoSolicitud =
  | "Pendiente"
  | "Recibida"
  | "Derivada"
  | "En proceso"
  | "Finalizada"

// --- Criticidad ---
export type Criticidad = "Bajo" | "Medio" | "Alto" | "Crítico"

// --- Tipo de solicitud ---
export type TipoSolicitud =
  | "Reparación/Acondicionamiento"
  | "Oportunidad a Mejora"
  | "Inversión"

// --- Sesion de usuario ---
export type UserSession = {
  id: string
  username: string
  nombre_completo: string | null
  rol: RolUsuario
  avatar_url?: string | null
}

// --- Usuario ---
export type Usuario = {
  id: string
  username: string
  nombre_completo: string | null
  rol: RolUsuario
  activo: boolean
  avatar_url: string | null
  created_at: string
}

// --- Sector ---
export type Sector = {
  id: string
  nombre: string
  activo: boolean
  created_at: string
}

// --- Equipo / Máquina ---
export type Equipo = {
  id: string
  nombre: string
  sector_id: string | null
  activo: boolean
  created_at: string
  sector?: Pick<Sector, "nombre">
}

// --- Observación / Nota (tabla separada) ---
export type Observacion = {
  id: string
  solicitud_id: string
  autor_id: string
  autor_nombre: string
  autor_rol: RolUsuario
  texto: string
  imagen_url: string | null
  created_at: string
}

// --- Solicitud ---
export type Solicitud = {
  id: string
  usuario_id: string
  nombre_solicitante: string
  tipo_solicitud: TipoSolicitud
  criticidad: Criticidad
  descripcion: string
  imagen_url: string | null
  estado: EstadoSolicitud
  created_at: string

  // Clasificación
  sector_id: string | null
  equipo_id: string | null

  // Trazabilidad del flujo
  fecha_recepcion_supervisor: string | null
  fecha_vista_supervisor: string | null
  fecha_derivacion_tecnico: string | null
  derivado_por_id: string | null
  tecnico_asignado_id: string | null
  fecha_vista_tecnico: string | null
  fecha_inicio_trabajo: string | null
  fecha_estimada: string | null
  fecha_finalizacion: string | null

  // Relaciones opcionales (joins)
  usuario?: Pick<Usuario, "username" | "nombre_completo">
  tecnico?: Pick<Usuario, "username" | "nombre_completo">
  derivado_por?: Pick<Usuario, "username" | "nombre_completo">
  sector?: Pick<Sector, "nombre">
  equipo?: Pick<Equipo, "nombre">
  observaciones?: Observacion[]
}

// --- Filtros de solicitud ---
export type FiltrosSolicitud = {
  estado?: EstadoSolicitud
  tipo_solicitud?: TipoSolicitud
  criticidad?: Criticidad
  sector_id?: string
  equipo_id?: string
  fecha_desde?: string
  fecha_hasta?: string
  busqueda?: string
}
