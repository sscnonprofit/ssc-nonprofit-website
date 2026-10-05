"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, Phone, X } from "lucide-react"

import type siteFallback from "@/content/site.json"
import { DEFAULT_THEME, type ThemeSettings } from "@/lib/cms/theme"
import { cn } from "@/lib/utils"
import { BrandRule } from "@/components/brand-rule"

type NavChild = { label: string; href: string; external?: boolean }
type NavItem = { label: string; href?: string; children?: NavChild[] }

const LOGO_RATIO = 196 / 49

function matchesPath(pathname: string, href?: string) {
  if (!href || href.startsWith("http")) return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isItemActive(pathname: string, item: NavItem) {
  return matchesPath(pathname, item.href) || (item.children ?? []).some((c) => !c.external && matchesPath(pathname, c.href))
}

export function SiteHeader({
  site,
  header = DEFAULT_THEME.header,
}: {
  site: typeof siteFallback
  header?: ThemeSettings["header"]
}) {
  const nav = site.nav as NavItem[]
  const pathname = usePathname()
  const minimal = header.style === "minimal"
  const transparent = header.style === "transparent"
  const showUtilityBar = header.showUtilityBar && !minimal
  const logoHeight = header.logoHeight

  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [menu, setMenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)

  // Close every menu after client-side navigation.
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
    setMenu(null)
    setExpanded(null)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false)
    }
    window.addEventListener("resize", onResize)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("resize", onResize)
    }
  }, [open])

  return (
    <header
      className={cn("z-40", header.sticky ? "sticky top-0" : "relative")}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setMenu(null)
          setOpen(false)
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(null)
      }}
    >
      {/* Utility bar */}
      <div
        className={cn(
          "hidden overflow-hidden bg-primary text-primary-foreground transition-[max-height,opacity] duration-300",
          showUtilityBar && "md:block",
          scrolled && header.sticky ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-2 text-[13px]">
          <a
            href={site.phoneHref}
            className="flex items-center gap-2 font-medium tracking-wide transition-opacity hover:opacity-80"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/10">
              <Phone className="size-3.5" aria-hidden="true" />
            </span>
            {site.phone}
          </a>
          <div className="flex items-center gap-1">
            <a
              href={site.careersUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 font-medium opacity-90 transition-opacity hover:opacity-100"
            >
              Careers
            </a>
            <span className="h-3.5 w-px bg-primary-foreground/25" aria-hidden="true" />
            <Link href="/contact" className="px-3 py-1 font-medium opacity-90 transition-opacity hover:opacity-100">
              Schedule A Visit
            </Link>
            <Link href="/donate" className="ssc-btn-accent ml-2 px-4 py-1.5 text-xs">
              Donate
            </Link>
          </div>
        </div>
      </div>

      <div className={cn("px-3 md:px-4", minimal ? "pt-0" : "pt-3")}>
        <div
          className={cn(
            "ssc-glass-nav ssc-header-glass relative mx-auto max-w-7xl rounded-2xl border transition-[background-color,border-color,box-shadow] duration-300",
            minimal
              ? "rounded-none border-x-0 border-t-0 border-border bg-background"
              : scrolled
                ? "border-foreground/10 bg-background/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_22px_44px_-24px_rgba(30,10,16,0.45)]"
                : transparent
                  ? "border-foreground/5 bg-background/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                  : "border-foreground/10 bg-background/65 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_14px_34px_-24px_rgba(30,10,16,0.35)]",
          )}
        >
          <div className="flex items-center justify-between gap-4 px-4 pb-5 pt-3 md:px-5">
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-3 rounded-lg outline-offset-4"
              aria-label={`${site.name} home`}
            >
              <Image
                src="/images/ssc-logo.png"
                alt=""
                width={196}
                height={49}
                style={{ height: logoHeight, width: Math.round(logoHeight * LOGO_RATIO) }}
                className="max-w-[60vw] object-contain transition-opacity group-hover:opacity-90"
                unoptimized
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-0.5">
                {nav.map((item, index) => {
                  const active = isItemActive(pathname, item)
                  const alignRight = index >= nav.length - 2

                  if (!item.children) {
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href ?? "/"}
                          aria-current={matchesPath(pathname, item.href) ? "page" : undefined}
                          className={cn(
                            "group/nav relative block rounded-lg px-3.5 py-2.5 font-display text-[14px] font-semibold tracking-[0.01em] transition-colors",
                            active ? "text-primary" : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
                          )}
                        >
                          {item.label}
                          <NavUnderline index={index} active={active} />
                        </Link>
                      </li>
                    )
                  }

                  const isOpen = menu === item.label
                  return (
                    <li
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setMenu(item.label)}
                      onMouseLeave={() => setMenu((v) => (v === item.label ? null : v))}
                    >
                      <button
                        type="button"
                        className={cn(
                          "group/nav relative flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 font-display text-[14px] font-semibold tracking-[0.01em] transition-colors",
                          isOpen
                            ? "bg-foreground/[0.06] text-foreground"
                            : active
                              ? "text-primary hover:bg-foreground/5"
                              : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
                        )}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        onClick={(e) => {
                          // Pointer hover already opened it; only keyboard activation toggles closed.
                          const isKeyboard = e.detail === 0
                          setMenu((v) => (isKeyboard && v === item.label ? null : item.label))
                        }}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn("size-3.5 opacity-60 transition-transform duration-200", isOpen && "rotate-180 opacity-100")}
                          aria-hidden="true"
                        />
                        <NavUnderline index={index} active={active || isOpen} />
                      </button>

                      <div
                        className={cn(
                          "absolute top-full z-50 w-72 pt-3 transition-[opacity,transform,visibility] duration-200",
                          alignRight ? "right-0" : "left-0",
                          isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0",
                        )}
                      >
                        <div className="ssc-glass-nav overflow-hidden rounded-xl border border-foreground/10 bg-background/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_28px_56px_-24px_rgba(30,10,16,0.45)]">
                          <div className="flex items-center gap-2 border-b border-foreground/[0.07] px-4 py-2.5">
                            <span className={cn("size-1.5 rounded-full", BRAND_BG[index % BRAND_BG.length])} aria-hidden="true" />
                            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {item.label}
                            </span>
                          </div>
                          <ul className="flex flex-col p-1.5">
                            {item.children.map((child) => {
                              const childActive = !child.external && matchesPath(pathname, child.href)
                              return (
                                <li key={child.label}>
                                  <NavLink
                                    child={child}
                                    active={childActive}
                                    tabIndex={isOpen ? undefined : -1}
                                    onClick={() => setMenu(null)}
                                    className={cn(
                                      "group/item flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                                      childActive
                                        ? "bg-primary/[0.08] font-semibold text-primary"
                                        : "text-foreground/85 hover:bg-foreground/[0.05] hover:text-foreground",
                                    )}
                                  />
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <Link href="/contact" className="ssc-btn group/cta px-5 py-2.5">
                Schedule A Visit
                <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background/60 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] outline-offset-2 transition-all hover:border-primary/30 hover:text-primary active:scale-95 lg:hidden",
                open ? "border-primary/30 text-primary" : "border-foreground/10",
              )}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          </div>

          {/* Mobile nav */}
          <div
            id="mobile-nav"
            hidden={!open}
            className="mx-4 max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain border-t border-foreground/[0.08] pb-6 pt-2 lg:hidden"
          >
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                {nav.map((item) => {
                  const active = isItemActive(pathname, item)
                  return item.children ? (
                    <li key={item.label} className="border-b border-foreground/[0.07] last:border-0">
                      <button
                        type="button"
                        onClick={() => setExpanded((v) => (v === item.label ? null : item.label))}
                        className={cn(
                          "flex min-h-12 w-full items-center justify-between font-display text-base font-semibold",
                          active && "text-primary",
                        )}
                        aria-expanded={expanded === item.label}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn("size-5 opacity-60 transition-transform", expanded === item.label && "rotate-180")}
                          aria-hidden="true"
                        />
                      </button>
                      <ul hidden={expanded !== item.label} className="flex flex-col gap-0.5 pb-3">
                        {item.children.map((child) => {
                          const childActive = !child.external && matchesPath(pathname, child.href)
                          return (
                            <li key={child.label}>
                              <NavLink
                                child={child}
                                active={childActive}
                                onClick={() => setOpen(false)}
                                className={cn(
                                  "flex min-h-11 items-center justify-between rounded-lg px-3 text-[15px] transition-colors",
                                  childActive
                                    ? "bg-primary/[0.08] font-semibold text-primary"
                                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                                )}
                              />
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  ) : (
                    <li key={item.label} className="border-b border-foreground/[0.07] last:border-0">
                      <Link
                        href={item.href ?? "/"}
                        aria-current={matchesPath(pathname, item.href) ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn("flex min-h-12 items-center font-display text-base font-semibold", active && "text-primary")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/contact" onClick={() => setOpen(false)} className="ssc-btn px-4 py-3">
                Schedule A Visit
              </Link>
              <Link href="/donate" onClick={() => setOpen(false)} className="ssc-btn-accent px-4 py-3">
                Donate
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-foreground/[0.07] pt-4 text-sm">
              <a href={site.phoneHref} className="flex items-center gap-2 font-semibold text-primary">
                <Phone className="size-4" aria-hidden="true" />
                {site.phone}
              </a>
              <a
                href={site.careersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
              >
                Careers
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {!minimal && (
            <div className="pointer-events-none absolute inset-x-4 bottom-2 md:inset-x-5" aria-hidden="true">
              <BrandRule className="relative h-[3px] w-full gap-0.5 rounded-full shadow-none" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

const BRAND_BG = ["bg-brand-1", "bg-brand-2", "bg-brand-3", "bg-brand-4"] as const

function NavUnderline({ index, active = false }: { index: number; active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-3.5 bottom-1 h-0.5 origin-left rounded-full transition-transform duration-300 group-hover/nav:scale-x-100",
        BRAND_BG[index % BRAND_BG.length],
        active ? "scale-x-100" : "scale-x-0",
      )}
    />
  )
}

function NavLink({
  child,
  className,
  onClick,
  tabIndex,
  active = false,
}: {
  child: NavChild
  className?: string
  onClick?: () => void
  tabIndex?: number
  active?: boolean
}) {
  const content = (
    <>
      <span>{child.label}</span>
      {child.external ? (
        <ArrowUpRight className="size-3.5 shrink-0 opacity-50" aria-hidden="true" />
      ) : (
        <ArrowRight
          className={cn(
            "size-3.5 shrink-0 transition-all duration-200",
            active ? "opacity-100" : "-translate-x-1 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-60",
          )}
          aria-hidden="true"
        />
      )}
    </>
  )

  if (child.external) {
    return (
      <a href={child.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick} tabIndex={tabIndex}>
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }
  return (
    <Link
      href={child.href}
      className={className}
      onClick={onClick}
      tabIndex={tabIndex}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </Link>
  )
}
