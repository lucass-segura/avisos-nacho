import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("user_session")
  const { pathname } = request.nextUrl

  let userRole = null
  if (session) {
    try {
      const sessionData = JSON.parse(session.value)
      userRole = sessionData.rol
    } catch {
      // Sesión inválida
    }
  }

  const isManagementRole = userRole === "admin" || userRole === "supervisor" || userRole === "tecnico"

  // 1. Redirección desde LOGIN
  if (pathname === "/login" && session) {
    if (isManagementRole) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // 2. Protección de rutas /admin
  if (pathname.startsWith("/admin") && (!session || !isManagementRole)) {
    // Si es un usuario normal intentando entrar a admin, mandarlo al dashboard
    if (session && userRole === "solicitante") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 3. Redirección desde DASHBOARD (para roles de gestión)
  if (pathname === "/dashboard") {
    if (!session) return NextResponse.redirect(new URL("/login", request.url))

    if (isManagementRole) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  // 4. Raíz
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/admin/:path*"],
}