/**
 * Site-wide theme ("Design Studio") model. Pure and isomorphic: safe to import
 * from server components, server actions, and the admin client UI.
 *
 * Colors are hex for editability. Only colors that differ from DEFAULT_THEME
 * are emitted as CSS overrides, so the original oklch tokens in globals.css
 * stay pixel-identical until someone actually changes a color.
 */

export const FONT_OPTIONS = [
  { key: "inter", label: "Inter", cssVar: "--font-inter", category: "sans" },
  { key: "bricolage", label: "Bricolage Grotesque", cssVar: "--font-bricolage", category: "sans" },
  { key: "dm-sans", label: "DM Sans", cssVar: "--font-dm-sans", category: "sans" },
  { key: "nunito-sans", label: "Nunito Sans", cssVar: "--font-nunito-sans", category: "sans" },
  { key: "lora", label: "Lora", cssVar: "--font-lora", category: "serif" },
  { key: "merriweather", label: "Merriweather", cssVar: "--font-merriweather", category: "serif" },
  { key: "playfair", label: "Playfair Display", cssVar: "--font-playfair", category: "serif" },
  { key: "source-serif", label: "Source Serif 4", cssVar: "--font-source-serif", category: "serif" },
] as const

export type FontKey = (typeof FONT_OPTIONS)[number]["key"]

export const COLOR_KEYS = [
  "background",
  "foreground",
  "card",
  "primary",
  "primaryForeground",
  "accent",
  "accentForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "border",
  "destructive",
  "brand1",
  "brand2",
  "brand3",
  "brand4",
] as const

export type ColorKey = (typeof COLOR_KEYS)[number]
export type ThemeColors = Record<ColorKey, string>

export const COLOR_LABELS: Record<ColorKey, { label: string; hint: string; pairWith?: ColorKey }> = {
  background: { label: "Page background", hint: "Main canvas color", pairWith: "foreground" },
  foreground: { label: "Body text", hint: "Default text color", pairWith: "background" },
  card: { label: "Cards & panels", hint: "Raised surfaces", pairWith: "foreground" },
  primary: { label: "Primary brand", hint: "Buttons, links, footer", pairWith: "primaryForeground" },
  primaryForeground: { label: "Text on primary", hint: "Readable on primary", pairWith: "primary" },
  accent: { label: "Accent", hint: "Highlights, donate button", pairWith: "accentForeground" },
  accentForeground: { label: "Text on accent", hint: "Readable on accent", pairWith: "accent" },
  secondary: { label: "Secondary surface", hint: "Soft fills", pairWith: "secondaryForeground" },
  secondaryForeground: { label: "Text on secondary", hint: "Readable on secondary", pairWith: "secondary" },
  muted: { label: "Muted surface", hint: "Subtle backgrounds", pairWith: "mutedForeground" },
  mutedForeground: { label: "Muted text", hint: "Captions, helper text", pairWith: "background" },
  border: { label: "Borders", hint: "Dividers and outlines" },
  destructive: { label: "Error", hint: "Error and danger states" },
  brand1: { label: "Brand band 1", hint: "SSC four-color rule" },
  brand2: { label: "Brand band 2", hint: "SSC four-color rule" },
  brand3: { label: "Brand band 3", hint: "SSC four-color rule" },
  brand4: { label: "Brand band 4", hint: "SSC four-color rule" },
}

export type SectionSpacing = "compact" | "normal" | "airy"
export type ShadowStyle = "none" | "soft" | "elevated"
export type ButtonShape = "square" | "rounded"
export type ButtonStyle = "fill" | "outline"
export type HeaderStyle = "solid" | "transparent" | "minimal"
export type FooterLayout = "columns" | "centered" | "minimal"
export type FooterBackground = "dark" | "brand" | "light"
export type AnnouncementTone = "brand" | "accent" | "neutral"

export type ThemeSettings = {
  version: 1
  colors: ThemeColors
  typography: {
    bodyFont: FontKey
    headingFont: FontKey
    baseSize: number
    lineHeight: number
    headingWeight: number
    headingTracking: number
    scale: { h1: number; h2: number; h3: number; eyebrow: number }
  }
  layout: {
    maxWidth: number
    sectionSpacing: SectionSpacing
    radius: number
    shadow: ShadowStyle
  }
  buttons: { shape: ButtonShape; style: ButtonStyle; uppercase: boolean }
  header: { style: HeaderStyle; sticky: boolean; logoHeight: number; showUtilityBar: boolean }
  footer: { layout: FooterLayout; background: FooterBackground }
  announcement: { enabled: boolean; text: string; href: string; tone: AnnouncementTone; dismissible: boolean }
  meta: { themeColor: string }
  customCss: string
}

export const DEFAULT_THEME: ThemeSettings = {
  version: 1,
  colors: {
    background: "#fcfaf8",
    foreground: "#2a2021",
    card: "#ffffff",
    primary: "#7c1231",
    primaryForeground: "#fcfaf8",
    accent: "#c8964f",
    accentForeground: "#2a2021",
    secondary: "#f3efeb",
    secondaryForeground: "#352b2b",
    muted: "#f3efeb",
    mutedForeground: "#6b5f5c",
    border: "#e3ded9",
    destructive: "#c22b2b",
    brand1: "#7c1231",
    brand2: "#c8964f",
    brand3: "#5f8f4a",
    brand4: "#405f47",
  },
  typography: {
    bodyFont: "inter",
    headingFont: "bricolage",
    baseSize: 17,
    lineHeight: 1.6,
    headingWeight: 700,
    headingTracking: -0.02,
    scale: { h1: 3.5, h2: 2.25, h3: 1.375, eyebrow: 0.75 },
  },
  layout: { maxWidth: 1280, sectionSpacing: "normal", radius: 0.5, shadow: "soft" },
  buttons: { shape: "square", style: "fill", uppercase: false },
  header: { style: "solid", sticky: true, logoHeight: 40, showUtilityBar: true },
  footer: { layout: "columns", background: "brand" },
  announcement: { enabled: false, text: "", href: "", tone: "brand", dismissible: true },
  meta: { themeColor: "#7c1231" },
  customCss: "",
}

export type ThemePreset = {
  id: string
  name: string
  description: string
  colors: Partial<ThemeColors>
  typography?: Partial<Pick<ThemeSettings["typography"], "bodyFont" | "headingFont">>
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "ssc-classic",
    name: "SSC Classic",
    description: "Wine and gold from the SSC mark",
    colors: {},
    typography: { bodyFont: "inter", headingFont: "bricolage" },
  },
  {
    id: "lakeshore",
    name: "Lakeshore Blue",
    description: "Lake Michigan blues, calm and clear",
    colors: {
      background: "#f7fafc",
      foreground: "#14202b",
      card: "#ffffff",
      primary: "#1d4f7a",
      primaryForeground: "#f7fafc",
      accent: "#e3a73b",
      accentForeground: "#14202b",
      secondary: "#e9f0f6",
      secondaryForeground: "#1e2c38",
      muted: "#e9f0f6",
      mutedForeground: "#556575",
      border: "#d5e0ea",
      brand1: "#1d4f7a",
      brand2: "#e3a73b",
      brand3: "#3f8fa6",
      brand4: "#24465e",
    },
    typography: { bodyFont: "dm-sans", headingFont: "dm-sans" },
  },
  {
    id: "evergreen",
    name: "Evergreen",
    description: "Wooded campus greens",
    colors: {
      background: "#f8faf6",
      foreground: "#1b261d",
      card: "#ffffff",
      primary: "#2f5d3a",
      primaryForeground: "#f8faf6",
      accent: "#d9a441",
      accentForeground: "#1b261d",
      secondary: "#ecf2ea",
      secondaryForeground: "#243026",
      muted: "#ecf2ea",
      mutedForeground: "#5a6a5c",
      border: "#d9e3d6",
      brand1: "#2f5d3a",
      brand2: "#d9a441",
      brand3: "#7aa35a",
      brand4: "#45614a",
    },
    typography: { bodyFont: "nunito-sans", headingFont: "lora" },
  },
  {
    id: "warm-slate",
    name: "Warm Slate",
    description: "Quiet stone neutrals, editorial serif",
    colors: {
      background: "#f6f5f3",
      foreground: "#24221f",
      card: "#ffffff",
      primary: "#3f4a54",
      primaryForeground: "#f6f5f3",
      accent: "#b5683d",
      accentForeground: "#ffffff",
      secondary: "#ebe8e4",
      secondaryForeground: "#2d2a27",
      muted: "#ebe8e4",
      mutedForeground: "#6a645d",
      border: "#dcd7d1",
      brand1: "#3f4a54",
      brand2: "#b5683d",
      brand3: "#8a9a7b",
      brand4: "#5c6670",
    },
    typography: { bodyFont: "source-serif", headingFont: "playfair" },
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Maximum legibility for low vision",
    colors: {
      background: "#ffffff",
      foreground: "#000000",
      card: "#ffffff",
      primary: "#5c0a22",
      primaryForeground: "#ffffff",
      accent: "#ffd23f",
      accentForeground: "#000000",
      secondary: "#f0f0f0",
      secondaryForeground: "#000000",
      muted: "#f0f0f0",
      mutedForeground: "#2b2b2b",
      border: "#5e5e5e",
      brand1: "#5c0a22",
      brand2: "#ffd23f",
      brand3: "#1f6b2e",
      brand4: "#000000",
    },
    typography: { bodyFont: "inter", headingFont: "inter" },
  },
]

export function applyPreset(theme: ThemeSettings, preset: ThemePreset): ThemeSettings {
  return {
    ...theme,
    colors: { ...DEFAULT_THEME.colors, ...preset.colors },
    typography: { ...theme.typography, ...preset.typography },
    meta: { themeColor: preset.colors.primary ?? DEFAULT_THEME.colors.primary },
  }
}

// --- Validation -------------------------------------------------------------

const HEX = /^#[0-9a-f]{6}$/i

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function str(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.slice(0, max) : fallback
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function isSafeHref(href: string): boolean {
  if (!href) return true
  if (href.startsWith("/") && !href.startsWith("//")) return true
  if (href.startsWith("#")) return true
  return /^(https?:|mailto:|tel:)/i.test(href)
}

export const CUSTOM_CSS_MAX = 20_000

/** Returns an error message if custom CSS contains something we refuse to inject. */
export function validateCustomCss(css: string): string | null {
  if (css.length > CUSTOM_CSS_MAX) return "Custom CSS is limited to 20KB."
  const lowered = css.toLowerCase()
  for (const banned of ["</style", "<script", "@import", "expression(", "javascript:", "behavior:", "-moz-binding"]) {
    if (lowered.includes(banned)) return `Custom CSS cannot contain "${banned}".`
  }
  return null
}

const FONT_KEYS = FONT_OPTIONS.map((f) => f.key)

export function sanitizeTheme(input: unknown): ThemeSettings {
  const raw = obj(input)
  const d = DEFAULT_THEME

  const rawColors = obj(raw.colors)
  const colors = {} as ThemeColors
  for (const key of COLOR_KEYS) {
    const v = rawColors[key]
    colors[key] = typeof v === "string" && HEX.test(v) ? v.toLowerCase() : d.colors[key]
  }

  const t = obj(raw.typography)
  const s = obj(t.scale)
  const l = obj(raw.layout)
  const b = obj(raw.buttons)
  const h = obj(raw.header)
  const f = obj(raw.footer)
  const a = obj(raw.announcement)
  const m = obj(raw.meta)

  const href = str(a.href, 500)
  const customCss = str(raw.customCss, CUSTOM_CSS_MAX)
  const themeColor = typeof m.themeColor === "string" && HEX.test(m.themeColor) ? m.themeColor : d.meta.themeColor

  return {
    version: 1,
    colors,
    typography: {
      bodyFont: pick(t.bodyFont, FONT_KEYS, d.typography.bodyFont),
      headingFont: pick(t.headingFont, FONT_KEYS, d.typography.headingFont),
      baseSize: Math.round(clamp(t.baseSize, 15, 20, d.typography.baseSize)),
      lineHeight: Math.round(clamp(t.lineHeight, 1.3, 1.9, d.typography.lineHeight) * 100) / 100,
      headingWeight: Math.round(clamp(t.headingWeight, 400, 800, d.typography.headingWeight) / 100) * 100,
      headingTracking: Math.round(clamp(t.headingTracking, -0.05, 0.05, d.typography.headingTracking) * 1000) / 1000,
      scale: {
        h1: clamp(s.h1, 2, 5.5, d.typography.scale.h1),
        h2: clamp(s.h2, 1.5, 4, d.typography.scale.h2),
        h3: clamp(s.h3, 1, 2.5, d.typography.scale.h3),
        eyebrow: clamp(s.eyebrow, 0.625, 1, d.typography.scale.eyebrow),
      },
    },
    layout: {
      maxWidth: Math.round(clamp(l.maxWidth, 960, 1600, d.layout.maxWidth)),
      sectionSpacing: pick(l.sectionSpacing, ["compact", "normal", "airy"] as const, d.layout.sectionSpacing),
      radius: Math.round(clamp(l.radius, 0, 1.5, d.layout.radius) * 100) / 100,
      shadow: pick(l.shadow, ["none", "soft", "elevated"] as const, d.layout.shadow),
    },
    buttons: {
      shape: pick(b.shape, ["square", "rounded"] as const, d.buttons.shape),
      style: pick(b.style, ["fill", "outline"] as const, d.buttons.style),
      uppercase: bool(b.uppercase, d.buttons.uppercase),
    },
    header: {
      style: pick(h.style, ["solid", "transparent", "minimal"] as const, d.header.style),
      sticky: bool(h.sticky, d.header.sticky),
      logoHeight: Math.round(clamp(h.logoHeight, 28, 64, d.header.logoHeight)),
      showUtilityBar: bool(h.showUtilityBar, d.header.showUtilityBar),
    },
    footer: {
      layout: pick(f.layout, ["columns", "centered", "minimal"] as const, d.footer.layout),
      background: pick(f.background, ["dark", "brand", "light"] as const, d.footer.background),
    },
    announcement: {
      enabled: bool(a.enabled, d.announcement.enabled),
      text: str(a.text, 200).trim(),
      href: isSafeHref(href) ? href : "",
      tone: pick(a.tone, ["brand", "accent", "neutral"] as const, d.announcement.tone),
      dismissible: bool(a.dismissible, d.announcement.dismissible),
    },
    meta: { themeColor },
    customCss: validateCustomCss(customCss) ? "" : customCss,
  }
}

// --- Contrast ---------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 1
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export function contrastRating(ratio: number): "AAA" | "AA" | "AA Large" | "Fail" {
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return "AA"
  if (ratio >= 3) return "AA Large"
  return "Fail"
}

/** Picks near-black or near-white, whichever reads better on `bg`. */
export function readableOn(bg: string): string {
  return contrastRatio(bg, "#111111") >= contrastRatio(bg, "#ffffff") ? "#111111" : "#ffffff"
}

// --- CSS generation ---------------------------------------------------------

const COLOR_VARS: Record<ColorKey, string[]> = {
  background: ["--background"],
  foreground: ["--foreground", "--card-foreground", "--popover-foreground"],
  card: ["--card", "--popover"],
  primary: ["--primary", "--ring"],
  primaryForeground: ["--primary-foreground"],
  accent: ["--accent"],
  accentForeground: ["--accent-foreground"],
  secondary: ["--secondary"],
  secondaryForeground: ["--secondary-foreground"],
  muted: ["--muted"],
  mutedForeground: ["--muted-foreground"],
  border: ["--border", "--input"],
  destructive: ["--destructive"],
  brand1: ["--brand-1"],
  brand2: ["--brand-2"],
  brand3: ["--brand-3"],
  brand4: ["--brand-4"],
}

const SPACING: Record<SectionSpacing, string> = { compact: "3.5rem", normal: "5.5rem", airy: "8rem" }
const SHADOWS: Record<ShadowStyle, string> = {
  none: "none",
  soft: "0 1px 2px rgba(30,10,16,0.04)",
  elevated: "0 24px 48px -28px rgba(30,10,16,0.35)",
}
const SHADOW_HOVER: Record<ShadowStyle, string> = {
  none: "none",
  soft: "0 20px 40px -24px rgba(30,10,16,0.22)",
  elevated: "0 32px 56px -24px rgba(30,10,16,0.4)",
}
const BUTTON_RADIUS: Record<ButtonShape, string> = { square: "0", rounded: "min(var(--radius), 0.375rem)" }

function fontStack(key: FontKey): string {
  const font = FONT_OPTIONS.find((f) => f.key === key) ?? FONT_OPTIONS[0]
  const fallback = font.category === "serif" ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif"
  return `var(${font.cssVar}), ${fallback}`
}

/**
 * `allColors` emits every color, which the admin preview needs because the
 * admin's own tokens differ from the public defaults.
 */
export function themeToVars(theme: ThemeSettings, { allColors = false } = {}): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const key of COLOR_KEYS) {
    if (allColors || theme.colors[key] !== DEFAULT_THEME.colors[key]) {
      for (const cssVar of COLOR_VARS[key]) vars[cssVar] = theme.colors[key]
    }
  }
  const { typography: t, layout: l, buttons: b } = theme
  vars["--ssc-font-body"] = fontStack(t.bodyFont)
  vars["--ssc-font-heading"] = `${fontStack(t.headingFont)}`
  vars["--ssc-base-size"] = `${t.baseSize / 16}rem`
  vars["--ssc-line-height"] = String(t.lineHeight)
  vars["--ssc-heading-weight"] = String(t.headingWeight)
  vars["--ssc-heading-tracking"] = `${t.headingTracking}em`
  vars["--ssc-h1"] = `${t.scale.h1}rem`
  vars["--ssc-h2"] = `${t.scale.h2}rem`
  vars["--ssc-h3"] = `${t.scale.h3}rem`
  vars["--ssc-eyebrow"] = `${t.scale.eyebrow}rem`
  vars["--container-7xl"] = `${l.maxWidth / 16}rem`
  vars["--ssc-section-y"] = SPACING[l.sectionSpacing]
  vars["--radius"] = `${l.radius}rem`
  vars["--ssc-card-shadow"] = SHADOWS[l.shadow]
  vars["--ssc-card-shadow-hover"] = SHADOW_HOVER[l.shadow]
  vars["--ssc-btn-radius"] = BUTTON_RADIUS[b.shape]
  vars["--ssc-btn-transform"] = b.uppercase ? "uppercase" : "none"
  vars["--ssc-btn-tracking"] = b.uppercase ? "0.08em" : "0"
  vars["--ssc-btn-bg"] = b.style === "fill" ? "var(--primary)" : "transparent"
  vars["--ssc-btn-fg"] = b.style === "fill" ? "var(--primary-foreground)" : "var(--primary)"
  vars["--ssc-btn-border"] = "var(--primary)"
  return vars
}

/** Builds a CSS block that applies the theme under `selector` (`:root` on the public site). */
export function themeToCss(theme: ThemeSettings, selector = ":root"): string {
  const body = Object.entries(themeToVars(theme))
    .map(([k, v]) => `${k}:${v};`)
    .join("")
  return `${selector}{${body}}`
}
