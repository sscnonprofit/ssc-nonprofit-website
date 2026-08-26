"use client"

import { useEffect, useRef, useState } from "react"

export type Stat = { value: number; suffix?: string; label: string }

/**
 * Mirrors the animated counters on the original site: numbers count up once the
 * block scrolls into view, and fall back to the final value when motion is reduced.
 */
export function StatCounter({ stats, tone = "light" }: { stats: Stat[]; tone?: "light" | "dark" }) {
  const ref = useRef<HTMLDListElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <dl ref={ref} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-2">
          <dd
            className={
              tone === "dark"
                ? "font-display text-5xl font-semibold text-accent"
                : "font-display text-5xl font-semibold text-primary"
            }
          >
            <Counter target={stat.value} active={active} />
            {stat.suffix}
          </dd>
          <dt
            className={
              tone === "dark"
                ? "text-sm leading-relaxed text-primary-foreground/80"
                : "text-sm leading-relaxed text-muted-foreground"
            }
          >
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  )
}

function Counter({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target)
      return
    }
    const duration = 1400
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return <>{value}</>
}
