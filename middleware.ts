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

  // Si está en login y tiene sesión, redirigir según rol
  if (pathname === "/login" && session) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (pathname.startsWith("/admin") && (!session || userRole !== "admin")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si está en dashboard sin sesión, redirigir a login
  if (pathname === "/dashboard" && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (pathname === "/dashboard" && userRole === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Si está en la raíz, redirigir a login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/admin/:path*"],
}
