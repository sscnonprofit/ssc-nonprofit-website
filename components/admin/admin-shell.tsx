"use client"

import { ExternalLinkIcon, LayoutDashboardIcon, LogOutIcon, UsersIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type AdminShellProps = {
  userName: string
  userEmail: string
  role: string
  children: React.ReactNode
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "")
  return initials.join("") || "U"
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
    { href: "/admin", label: "Pages", icon: LayoutDashboardIcon },
    ...(role === "admin" ? [{ href: "/admin/users", label: "Users", icon: UsersIcon }] : []),
  ]

  return (
    <div className="flex min-h-svh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
            S
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">SSC Content</p>
            <p className="truncate text-xs text-muted-foreground">Manager</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLinkIcon className="size-4 shrink-0" />
            View live site
          </Link>
        </nav>

        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-muted"
                />
              }
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-2 font-normal">
                  <span className="text-sm text-muted-foreground">Signed in as</span>
                  <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
                    {role}
                  </Badge>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="ml-60 flex-1 px-8 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
