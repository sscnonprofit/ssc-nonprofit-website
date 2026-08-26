"use client"

import { LayoutDashboard, LogOut, Users } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type AdminShellProps = {
  userName: string
  userEmail: string
  role: string
  children: React.ReactNode
}

export function AdminShell({ userName, userEmail, role, children }: AdminShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/admin/sign-in")
    router.refresh()
  }

  const navItems = [
    { href: "/admin", label: "Pages", icon: LayoutDashboard },
    ...(role === "admin" ? [{ href: "/admin/users", label: "Users", icon: Users }] : []),
  ]

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-lg font-semibold text-foreground">
              SSC Content Manager
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    render={<Link href={item.href} />}
                    nativeButton={false}
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                  >
                    <item.icon data-icon="inline-start" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
              {role}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
