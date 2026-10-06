"use client"

import { useState } from "react"
import Image from "next/image"
import {
  CalendarDaysIcon,
  ExternalLinkIcon,
  FrameIcon,
  GalleryHorizontalIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PaletteIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { AdminThemeQuickToggle, AdminThemeSelector } from "@/components/admin/admin-theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type AdminShellProps = {
  userName: string
  userEmail: string
  role: string
  children: React.ReactNode
}

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
type NavGroup = { label: string; items: NavItem[] }

/** The dashboard also owns the page editor routes, so it stays highlighted there. */
function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/pages/")
  return pathname === href || pathname.startsWith(`${href}/`)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "")
  return initials.join("") || "U"
}

function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Image
        src="/images/ssc-logo.png"
        alt="Sheboygan Senior Community logo"
        width={188}
        height={48}
        className="h-9 w-auto max-w-[8.5rem] object-contain object-left"
        priority
      />
      <div className="min-w-0 border-l border-border pl-2.5">
        <p className="truncate text-sm font-semibold text-foreground">Content</p>
        <p className="truncate text-xs text-muted-foreground">Manager</p>
      </div>
    </div>
  )
}

export function AdminShell({ userName, userEmail, role, children }: AdminShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/admin/sign-in")
    router.refresh()
  }

  const navGroups: NavGroup[] = [
    {
      label: "Content",
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
        { href: "/admin/events", label: "Events", icon: CalendarDaysIcon },
        { href: "/admin/gallery", label: "Gallery", icon: GalleryHorizontalIcon },
        { href: "/admin/exhibitions", label: "Exhibitions", icon: FrameIcon },
      ],
    },
    {
      label: "Site",
      items: [
        { href: "/admin/design", label: "Design", icon: PaletteIcon },
        { href: "/admin/media", label: "Media", icon: ImagesIcon },
        { href: "/admin/navigation", label: "Navigation", icon: MenuIcon },
      ],
    },
    ...(role === "admin"
      ? [{ label: "Team", items: [{ href: "/admin/users", label: "Users", icon: UsersIcon }] }]
      : []),
  ]

  const activeItem = navGroups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href))

  const navLinks = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "relative flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors lg:min-h-9",
                  active
                    ? "bg-primary/10 text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:min-h-9"
      >
        <ExternalLinkIcon className="size-4 shrink-0" />
        View live site
      </Link>
    </nav>
  )

  const accountMenu = (
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
  )

  return (
    <div className="flex min-h-svh flex-col bg-muted/30 lg:flex-row">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/95 px-2 backdrop-blur lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
        >
          <MenuIcon className="size-5" />
        </Button>
        <BrandMark />
        {activeItem && (
          <span className="ml-auto truncate pr-1 text-sm font-medium text-muted-foreground">{activeItem.label}</span>
        )}
        <div className={activeItem ? "shrink-0" : "ml-auto shrink-0"}>
          <AdminThemeQuickToggle />
        </div>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 p-0">
          <SheetHeader className="h-16 justify-center border-b border-border px-5 py-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SheetDescription className="sr-only">Move between admin sections</SheetDescription>
            <BrandMark />
          </SheetHeader>
          {navLinks}
          <div className="flex flex-col gap-3 border-t border-border p-3">
            <AdminThemeSelector />
            {accountMenu}
          </div>
        </SheetContent>
      </Sheet>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <BrandMark />
        </div>
        {navLinks}
        <div className="flex flex-col gap-3 border-t border-border p-3">
          <AdminThemeSelector />
          {accountMenu}
        </div>
      </aside>

      <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-60 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
