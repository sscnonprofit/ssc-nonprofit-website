"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type NestedLink = { label: string; href: string; external?: boolean }

type NestedNavItemProps = {
  item: NestedLink & { children?: NestedLink[] }
  pathname: string
  parentOpen: boolean
  onNavigate: () => void
  mobile?: boolean
}

export function NestedNavItem({ item, pathname, parentOpen, onNavigate, mobile = false }: NestedNavItemProps) {
  const [open, setOpen] = useState(false)
  const [flip, setFlip] = useState(false)
  const id = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const isOpen = open && parentOpen
  const active = pathname === item.href || item.children?.some((child) => pathname === child.href)

  useEffect(() => {
    if (!parentOpen) setOpen(false)
  }, [parentOpen])

  function openSubmenu() {
    if (!mobile && toggleRef.current) {
      setFlip(toggleRef.current.getBoundingClientRect().right + 280 > window.innerWidth)
    }
    setOpen(true)
  }

  return (
    <li
      className="relative"
      onMouseEnter={mobile ? undefined : openSubmenu}
      onMouseLeave={mobile ? undefined : () => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if ((event.key === "Escape" || event.key === "ArrowLeft") && isOpen) {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          toggleRef.current?.focus()
        }
        if (event.key === "ArrowRight" && event.target === toggleRef.current) {
          event.preventDefault()
          openSubmenu()
          requestAnimationFrame(() => listRef.current?.querySelector("a")?.focus())
        }
      }}
    >
      <div className={cn("flex items-center rounded-lg transition-colors", active ? "bg-primary/8 text-primary" : "text-foreground/85 hover:bg-foreground/5")}>
        <Link
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          tabIndex={parentOpen ? undefined : -1}
          onClick={onNavigate}
          className={cn("flex min-h-11 min-w-0 flex-1 items-center rounded-lg px-3 font-medium outline-offset-2", mobile ? "text-[15px]" : "text-sm")}
        >
          {item.label}
        </Link>
        <button
          ref={toggleRef}
          type="button"
          aria-label={`${item.label} submenu`}
          aria-expanded={isOpen}
          aria-controls={id}
          tabIndex={parentOpen ? undefined : -1}
          onClick={(event) => {
            if (isOpen && (mobile || event.detail === 0)) setOpen(false)
            else openSubmenu()
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary outline-offset-2 hover:bg-primary/10"
        >
          <ChevronRight className={cn("size-4 transition-transform motion-reduce:transition-none", mobile && isOpen && "rotate-90")} aria-hidden="true" />
        </button>
      </div>
      <ul
        ref={listRef}
        id={id}
        hidden={!isOpen}
        className={cn(
          mobile ? "ml-6 border-l border-primary/20 py-1 pl-2" : "absolute top-0 w-64 rounded-xl border border-border bg-background p-1.5 text-foreground shadow-xl",
          !mobile && (flip ? "right-full" : "left-full"),
        )}
      >
        {item.children?.map((child) => (
          <li key={child.href}>
            {child.external ? (
              <a href={child.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm hover:bg-primary/5">
                {child.label}<ArrowUpRight className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <Link href={child.href} onClick={onNavigate} aria-current={pathname === child.href ? "page" : undefined} className={cn("flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-primary/5", pathname === child.href && "bg-primary/8 font-semibold text-primary")}>
                {child.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </li>
  )
}
