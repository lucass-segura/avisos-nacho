"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200",
        isActive
          ? "text-sky-700 border-sky-500 bg-white/50"
          : "text-muted-foreground border-transparent hover:text-sky-700 hover:bg-white/50 hover:border-sky-500"
      )}
    >
      {icon}
      {children}
    </Link>
  )
}
