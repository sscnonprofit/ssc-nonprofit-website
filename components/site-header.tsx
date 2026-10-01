"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Menu, Phone, X } from "lucide-react"

import type siteFallback from "@/content/site.json"
import { DEFAULT_THEME, type ThemeSettings } from "@/lib/cms/theme"
import { cn } from "@/lib/utils"
import { BrandRule } from "@/components/brand-rule"

type NavChild = { label: string; href: string; external?: boolean }
type NavItem = { label: string; href?: string; children?: NavChild[] }

export function SiteHeader({
  site,
  header = DEFAULT_THEME.header,
}: {
  site: typeof siteFallback
  header?: ThemeSettings["header"]
}) {
  const nav = site.nav as NavItem[]
  const minimal = header.style === "minimal"
  const transparent = header.style === "transparent"
  const showUtilityBar = header.showUtilityBar && !minimal
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  /** Label of the open desktop dropdown, driven by both hover and click/keyboard. */
  const [menu, setMenu] = useState<string | null>(null)
  /** True once the page has scrolled past the utility bar, so the glass panel deepens. */
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "ssc-header-glass z-40 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300",
        header.sticky ? "sticky top-0" : "relative",
        scrolled
          ? "border-border/80 bg-background/85 shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(30,10,16,0.18)]"
          : transparent
            ? "border-transparent bg-background/0 shadow-none"
            : minimal
              ? "border-border/60 bg-background shadow-none"
              : "border-border/40 bg-background/55 shadow-none",
      )}
      onKeyDown={(e) => {
        if (e.key === "Escape") setMenu(null)
      }}
      onBlur={(e) => {
        // Close the dropdown once focus leaves the header entirely.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(null)
      }}
    >
      {/* Utility bar */}
      <div
        className={cn(
          "hidden bg-gradient-to-r from-primary via-primary to-[color-mix(in_oklab,var(--primary)_70%,black)] text-primary-foreground",
          showUtilityBar && "md:block",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-2 text-sm">
          <a
            href={site.phoneHref}
            className="flex items-center gap-2 font-medium transition-opacity hover:opacity-80"
          >
            <Phone className="size-4" aria-hidden="true" />
            {site.phone}
          </a>
          <div className="flex items-center gap-6">
            <a
              href={site.careersUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              Careers
            </a>
            <Link href="/contact" className="transition-opacity hover:opacity-80">
              Schedule A Visit
            </Link>
            <Link
              href="/donate"
              className="rounded-full bg-accent px-4 py-1 font-display font-semibold text-accent-foreground shadow-sm transition-transform hover:-translate-y-px"
            >
              Donate
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${site.name} home`}>
          <Image
            src="/images/ssc-logo.png"
            alt={`${site.name} logo`}
            width={188}
            height={48}
            className="w-auto"
            style={{ height: header.logoHeight }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) =>
              item.children ? (
                <li
                  key={item.label}
                  className="group relative"
                  onMouseEnter={() => setMenu(item.label)}
                  onMouseLeave={() => setMenu((v) => (v === item.label ? null : v))}
                >
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3.5 py-2 font-display text-sm font-semibold transition-colors",
                      menu === item.label
                        ? "bg-primary/8 text-primary"
                        : "text-foreground/75 hover:bg-primary/6 hover:text-primary",
                    )}
                    aria-expanded={menu === item.label}
                    onClick={() => setMenu((v) => (v === item.label ? null : item.label))}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn("size-3.5 transition-transform", menu === item.label && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className={cn(
                      "absolute left-0 top-full w-64 pt-2.5 transition-all duration-200",
                      menu === item.label
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 opacity-0",
                    )}
                  >
                    <ul className="overflow-hidden rounded-xl border border-border/70 bg-card/95 p-1.5 shadow-xl shadow-primary/10 backdrop-blur-xl">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <NavLink
                            child={child}
                            className="block rounded-lg px-3.5 py-2.5 text-sm transition-colors hover:bg-primary/6 hover:text-primary"
                            onClick={() => setMenu(null)}
                            tabIndex={menu === item.label ? undefined : -1}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href ?? "/"}
                    className="rounded-full px-3.5 py-2 font-display text-sm font-semibold text-foreground/75 transition-colors hover:bg-primary/6 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="hidden shrink-0 lg:block">
          <Link href="/contact" className="ssc-btn px-5 py-2.5">
            Schedule A Visit
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-2 text-foreground transition-colors hover:bg-primary/6 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        </button>
      </div>

      {!minimal && <BrandRule className="h-1 w-full rounded-none" />}

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-border/70 bg-background/95 px-6 py-4 backdrop-blur-xl lg:hidden"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {nav.map((item) =>
              item.children ? (
                <li key={item.label} className="border-b border-border/60 py-1 last:border-0">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => (v === item.label ? null : item.label))}
                    className="flex w-full items-center justify-between py-2 font-display font-semibold"
                    aria-expanded={expanded === item.label}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn("size-5 transition-transform", expanded === item.label && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  <ul hidden={expanded !== item.label} className="flex flex-col gap-1 pb-2 pl-3">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <NavLink
                          child={child}
                          onClick={() => setOpen(false)}
                          className="block py-2 text-muted-foreground transition-colors hover:text-primary"
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.label} className="border-b border-border/60 py-1 last:border-0">
                  <Link
                    href={item.href ?? "/"}
                    onClick={() => setOpen(false)}
                    className="block py-2 font-display font-semibold"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
            <li className="border-b border-border/60 py-1 last:border-0">
              <a
                href={site.careersUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block py-2 font-display font-semibold"
              >
                Careers
              </a>
            </li>
          </ul>
        </nav>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="rounded-full bg-primary px-5 py-3 text-center font-display font-semibold text-primary-foreground"
          >
            Schedule A Visit
          </Link>
          <Link
            href="/donate"
            onClick={() => setOpen(false)}
            className="rounded-full bg-accent px-5 py-3 text-center font-display font-semibold text-accent-foreground"
          >
            Donate
          </Link>
          <a
            href={site.phoneHref}
            className="flex items-center justify-center gap-2 py-2 font-medium text-primary"
          >
            <Phone className="size-4" aria-hidden="true" />
            {site.phone}
          </a>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  child,
  className,
  onClick,
  tabIndex,
}: {
  child: NavChild
  className?: string
  onClick?: () => void
  tabIndex?: number
}) {
  if (child.external) {
    return (
      <a
        href={child.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
        tabIndex={tabIndex}
      >
        {child.label}
      </a>
    )
  }
  return (
    <Link href={child.href} className={className} onClick={onClick} tabIndex={tabIndex}>
      {child.label}
    </Link>
  )
}
