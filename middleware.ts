import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { RolUsuario } from "@/types"

function getSessionFromCookie(request: NextRequest): { rol: RolUsuario } | null {
  const session = request.cookies.get("user_session")
  if (!session) return null

  try {
    return JSON.parse(session.value)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = getSessionFromCookie(request)
  const rol = session?.rol

  const isManagementRole = rol === "admin" || rol === "supervisor" || rol === "tecnico"

  // 1. Raíz -> Login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 2. Login con sesión activa -> redirigir según rol
  if (pathname === "/login" && session) {
    const dest = isManagementRole ? "/admin" : "/dashboard"
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // 3. Protección de /admin
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (rol === "solicitante") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // 4. Protección de /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (isManagementRole) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/admin/:path*"],
}
