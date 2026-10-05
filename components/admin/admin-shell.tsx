"use client"

import { useState } from "react"
import Image from "next/image"
import {
  CalendarDaysIcon,
  ExternalLinkIcon,
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

  const navItems = [
    { href: "/admin", label: "Pages", icon: LayoutDashboardIcon },
    { href: "/admin/design", label: "Design", icon: PaletteIcon },
    { href: "/admin/events", label: "Events", icon: CalendarDaysIcon },
  { href: "/admin/gallery", label: "Gallery", icon: GalleryHorizontalIcon },
  { href: "/admin/media", label: "Media", icon: ImagesIcon },
    { href: "/admin/navigation", label: "Navigation", icon: MenuIcon },
    ...(role === "admin" ? [{ href: "/admin/users", label: "Users", icon: UsersIcon }] : []),
  ]

  const activeItem = navItems.find((item) => item.href === pathname)

  const navLinks = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors lg:min-h-9",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <span className="ml-auto truncate pr-3 text-sm font-medium text-muted-foreground">{activeItem.label}</span>
        )}
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 p-0">
          <SheetHeader className="h-16 justify-center border-b border-border px-5 py-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SheetDescription className="sr-only">Move between admin sections</SheetDescription>
            <BrandMark />
          </SheetHeader>
          {navLinks}
          <div className="border-t border-border p-3">{accountMenu}</div>
        </SheetContent>
      </Sheet>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <BrandMark />
        </div>
        {navLinks}
        <div className="border-t border-border p-3">{accountMenu}</div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-60 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
