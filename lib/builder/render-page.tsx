import type { CSSProperties, ReactNode } from "react"

import { BLOCK_COMPONENTS } from "@/lib/builder/blocks"
import type { Section } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"

const PADDING: Record<Section["style"]["paddingY"], string> = {
  none: "0",
  sm: "calc(var(--ssc-section-y) * 0.5)",
  md: "var(--ssc-section-y)",
  lg: "calc(var(--ssc-section-y) * 1.35)",
  xl: "calc(var(--ssc-section-y) * 1.8)",
}

const WIDTH: Record<Section["style"]["width"], string> = {
  narrow: "48rem",
  normal: "var(--container-7xl, 80rem)",
  wide: "96rem",
  full: "none",
}

const BG_CLASS: Partial<Record<Section["style"]["background"], string>> = {
  default: "bg-background",
  muted: "bg-muted",
  card: "bg-card",
  primary: "bg-primary",
  accent: "bg-accent",
}

const DARK_BG = "color-mix(in oklab, var(--foreground) 92%, var(--primary))"

/** Hex luminance check used to pick readable text on custom colors. */
function isDarkHex(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140
}

function usesLightText(section: Section) {
  const { style } = section
  if (style.text !== "auto") return style.text === "light"
  if (style.background === "custom") return isDarkHex(style.bgColor)
  return style.background === "primary" || style.background === "dark" || style.background === "image"
}

/**
 * Visibility uses container queries so the builder's device frames match
 * what visitors see at real phone, tablet, and desktop widths.
 */
function visibilityClass(section: Section) {
  const { desktop, tablet, mobile } = section.visibility
  return cn(!mobile && "@max-3xl:hidden", !tablet && "@3xl:@max-5xl:hidden", !desktop && "@5xl:hidden")
}

export function SectionShell({ section, children }: { section: Section; children: ReactNode }) {
  const { style } = section
  const light = usesLightText(section)
  const outerStyle: CSSProperties = {}
  if (style.background === "custom") outerStyle.backgroundColor = style.bgColor
  if (style.background === "dark") outerStyle.backgroundColor = DARK_BG
  if (style.background === "image") {
    outerStyle.backgroundColor = DARK_BG
    if (style.bgImage) {
      outerStyle.backgroundImage = `url("${style.bgImage.replace(/"/g, "%22")}")`
      outerStyle.backgroundSize = "cover"
      outerStyle.backgroundPosition = "center"
    }
  }
  if (section.type === "hero" && section.variant === "background" && style.background !== "image") {
    const image = typeof section.props.image === "string" ? section.props.image : ""
    if (image) {
      outerStyle.backgroundImage = `url("${image.replace(/"/g, "%22")}")`
      outerStyle.backgroundSize = "cover"
      outerStyle.backgroundPosition = "center"
    }
  }
  const hasImage = Boolean(outerStyle.backgroundImage)

  return (
    <section
      id={section.anchor || undefined}
      aria-label={section.label || undefined}
      className={cn(
        "relative isolate",
        BG_CLASS[style.background],
        style.background === "accent" && !light && "text-accent-foreground",
        style.divider && "border-t border-border",
        visibilityClass(section),
      )}
      style={outerStyle}
    >
      {hasImage && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: "black", opacity: style.overlay / 100 }}
        />
      )}
      <div
        className={cn(
          "mx-auto w-full px-6 @3xl:px-10",
          light && "ssc-section-light",
          style.align === "center" && "text-center",
          style.animation === "fade" && "ssc-anim-fade",
          style.animation === "slide-up" && "ssc-anim-slide-up",
        )}
        style={{ maxWidth: WIDTH[style.width], paddingBlock: PADDING[style.paddingY] }}
      >
        {children}
      </div>
    </section>
  )
}

export function SectionContent({ section }: { section: Section }) {
  const Component = BLOCK_COMPONENTS[section.type]
  if (!Component) return null
  return <Component section={section} />
}

export function RenderSections({ sections }: { sections: Section[] }) {
  return (
    <div className="@container">
      {sections.map((section) => (
        <SectionShell key={section.id} section={section}>
          <SectionContent section={section} />
        </SectionShell>
      ))}
    </div>
  )
}
