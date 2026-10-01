import { ArrowRightIcon, HeartIcon, HomeIcon, StethoscopeIcon } from "lucide-react"

import { BrandRule } from "@/components/brand-rule"
import { themeToVars, type ThemeSettings } from "@/lib/cms/theme"
import { cn } from "@/lib/utils"

const ANNOUNCEMENT_TONE = {
  brand: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  neutral: "bg-foreground text-background",
} as const

const FOOTER_BG = {
  brand: "bg-primary text-primary-foreground",
  dark: "bg-foreground text-background",
  light: "bg-secondary text-secondary-foreground",
} as const

const SERVICES = [
  { icon: StethoscopeIcon, title: "Skilled Nursing", body: "Round-the-clock clinical care from a dedicated team." },
  { icon: HeartIcon, title: "Short-Term Rehab", body: "Therapy that helps residents return home stronger." },
  { icon: HomeIcon, title: "Assisted Living", body: "Independence with support whenever it is needed." },
]

/**
 * A miniature of the public site rendered with the draft theme applied as
 * scoped CSS variables, so edits show instantly without touching the admin.
 */
export function ThemePreview({ theme, width }: { theme: ThemeSettings; width: number | null }) {
  const vars = themeToVars(theme, { allColors: true }) as React.CSSProperties
  const { header, footer, announcement } = theme
  const narrow = width !== null && width < 700

  return (
    <div
      className="mx-auto overflow-hidden rounded-xl border border-border shadow-xl transition-[max-width] duration-300"
      style={{ maxWidth: width ?? "100%" }}
    >
      <div
        className="bg-background text-foreground [color-scheme:light]"
        style={{
          ...vars,
          fontFamily: "var(--ssc-font-body)",
          fontSize: "var(--ssc-base-size)",
          lineHeight: "var(--ssc-line-height)",
        }}
      >
        {announcement.enabled && announcement.text && (
          <div className={cn("px-4 py-2 text-center text-sm font-medium", ANNOUNCEMENT_TONE[announcement.tone])}>
            {announcement.text}
          </div>
        )}

        {header.showUtilityBar && header.style !== "minimal" && !narrow && (
          <div className="flex justify-between bg-primary px-6 py-1.5 text-xs text-primary-foreground">
            <span>Lindenhurst, Illinois</span>
            <span>(847) 356-5900</span>
          </div>
        )}
        <header
          className={cn(
            "flex items-center justify-between gap-4 px-6",
            header.style === "transparent" ? "bg-transparent" : "border-b border-border bg-background",
          )}
          style={{ minHeight: header.logoHeight + 28 }}
        >
          <span
            className="flex items-center font-display font-bold text-primary"
            style={{ fontSize: header.logoHeight * 0.5 }}
          >
            SSC
          </span>
          {!narrow && (
            <nav className="flex gap-5 text-sm text-foreground/80" aria-label="Preview navigation">
              <span>Care</span>
              <span>Community</span>
              <span>About</span>
            </nav>
          )}
          <span className="ssc-btn px-4 py-2 text-sm">Visit</span>
        </header>
        {header.style !== "minimal" && <BrandRule className="h-1 w-full rounded-none" />}

        <section
          className="mx-auto flex flex-col gap-5 px-6"
          style={{ paddingBlock: "var(--ssc-section-y)", maxWidth: "var(--container-7xl)" }}
        >
          <span className="ssc-eyebrow">Since 1972</span>
          <h1 className="ssc-h1 max-w-3xl text-balance">Care that feels like home, on a campus built for living.</h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            A nonprofit senior community offering skilled nursing, rehabilitation, and assisted living.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="ssc-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm">
              Schedule a visit <ArrowRightIcon className="size-4" />
            </span>
            <span className="ssc-btn-secondary px-5 py-2.5 text-sm">Our services</span>
            <span className="ssc-btn-accent px-5 py-2.5 text-sm">Donate</span>
          </div>
        </section>

        <section className="bg-secondary px-6 text-secondary-foreground" style={{ paddingBlock: "var(--ssc-section-y)" }}>
          <div className="mx-auto flex flex-col gap-8" style={{ maxWidth: "var(--container-7xl)" }}>
            <div className="flex flex-col gap-3">
              <BrandRule className="h-1 w-16" />
              <h2 className="ssc-h2 text-balance">Our services</h2>
            </div>
            <div className={cn("grid gap-5", narrow ? "grid-cols-1" : "grid-cols-3")}>
              {SERVICES.map((s) => (
                <article key={s.title} className="ssc-card flex flex-col gap-3 rounded-[var(--radius)] border bg-card p-5">
                  <s.icon className="size-6 text-primary" aria-hidden="true" />
                  <h3 className="ssc-h3">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className={cn(FOOTER_BG[footer.background])}>
          <BrandRule className="h-1.5 w-full rounded-none" />
          <div
            className={cn(
              "flex gap-6 px-6 py-10 text-sm",
              footer.layout === "centered" || narrow ? "flex-col items-center text-center" : "justify-between",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="font-display text-lg font-bold">SSC Nonprofit</span>
              <span className="opacity-75">Caring for our community since 1972.</span>
            </div>
            {footer.layout !== "minimal" && (
              <div className="flex gap-8 opacity-85">
                <span>Services</span>
                <span>Careers</span>
                <span>Contact</span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
