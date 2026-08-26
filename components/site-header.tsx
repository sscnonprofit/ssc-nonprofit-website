"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Menu, Phone, X } from "lucide-react"

import site from "@/content/site.json"
import { cn } from "@/lib/utils"
import { BrandRule } from "@/components/brand-rule"

type NavChild = { label: string; href: string; external?: boolean }
type NavItem = { label: string; href?: string; children?: NavChild[] }

const nav = site.nav as NavItem[]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  /** Label of the open desktop dropdown, driven by both hover and click/keyboard. */
  const [menu, setMenu] = useState<string | null>(null)

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md"
      onKeyDown={(e) => {
        if (e.key === "Escape") setMenu(null)
      }}
      onBlur={(e) => {
        // Close the dropdown once focus leaves the header entirely.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(null)
      }}
    >
      {/* Utility bar */}
      <div className="hidden bg-primary text-primary-foreground md:block">
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
              className="rounded-full bg-accent px-4 py-1 font-display font-semibold text-accent-foreground transition-transform hover:-translate-y-px"
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
            className="h-10 w-auto"
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
                      "flex items-center gap-1 rounded-md px-3 py-2 font-display text-sm font-semibold transition-colors",
                      menu === item.label
                        ? "bg-secondary text-primary"
                        : "text-foreground/80 hover:bg-secondary hover:text-primary",
                    )}
                    aria-expanded={menu === item.label}
                    onClick={() => setMenu((v) => (v === item.label ? null : item.label))}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn("size-4 transition-transform", menu === item.label && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className={cn(
                      "absolute left-0 top-full w-64 pt-2 transition-opacity duration-150",
                      menu === item.label ? "visible opacity-100" : "invisible opacity-0",
                    )}
                  >
                    <ul className="overflow-hidden rounded-lg border border-border bg-card p-2 shadow-lg shadow-foreground/5">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <NavLink
                            child={child}
                            className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-primary"
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
                    className="rounded-md px-3 py-2 font-display text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="hidden shrink-0 lg:block">
          <Link
            href="/contact"
            className="rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
          >
            Schedule A Visit
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-foreground transition-colors hover:bg-secondary lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        </button>
      </div>

      <BrandRule className="h-1 w-full rounded-none" />

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-border bg-card px-6 py-4 lg:hidden"
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
