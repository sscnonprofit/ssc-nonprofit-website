"use client"

import { useEffect, useReducer, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CodeIcon,
  DownloadIcon,
  EyeIcon,
  HistoryIcon,
  LayoutTemplateIcon,
  MegaphoneIcon,
  MonitorIcon,
  MousePointerClickIcon,
  PaletteIcon,
  PanelsTopLeftIcon,
  Redo2Icon,
  RotateCcwIcon,
  SmartphoneIcon,
  SparklesIcon,
  TabletIcon,
  TypeIcon,
  Undo2Icon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  discardThemeDraftAction,
  listThemeRevisionsAction,
  publishThemeAction,
  resetThemeAction,
  restoreThemeRevisionAction,
  saveThemeDraftAction,
} from "@/app/admin/theme-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  COLOR_LABELS,
  CUSTOM_CSS_MAX,
  DEFAULT_THEME,
  THEME_PRESETS,
  applyPreset,
  sanitizeTheme,
  validateCustomCss,
  type ThemeSettings,
} from "@/lib/cms/theme"
import { cn } from "@/lib/utils"
import { ColorField, ControlGroup, FontPicker, Segmented, SliderField, ToggleField } from "./controls"
import { ThemePreview } from "./theme-preview"

// --- History ----------------------------------------------------------------

type History = { past: ThemeSettings[]; present: ThemeSettings; future: ThemeSettings[]; lastPush: number }
type HistoryAction =
  | { type: "set"; theme: ThemeSettings }
  | { type: "replace"; theme: ThemeSettings }
  | { type: "undo" }
  | { type: "redo" }

const HISTORY_LIMIT = 100
/** Rapid edits (dragging a slider, typing hex) collapse into one undo step. */
const COALESCE_MS = 600

function historyReducer(state: History, action: HistoryAction): History {
  switch (action.type) {
    case "set": {
      const now = Date.now()
      if (now - state.lastPush < COALESCE_MS) return { ...state, present: action.theme, future: [], lastPush: now }
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: action.theme,
        future: [],
        lastPush: now,
      }
    }
    case "replace":
      return { past: [...state.past, state.present].slice(-HISTORY_LIMIT), present: action.theme, future: [], lastPush: 0 }
    case "undo": {
      const previous = state.past.at(-1)
      if (!previous) return state
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future], lastPush: 0 }
    }
    case "redo": {
      const next = state.future[0]
      if (!next) return state
      return { past: [...state.past, state.present], present: next, future: state.future.slice(1), lastPush: 0 }
    }
  }
}

// --- Panels -----------------------------------------------------------------

const PANELS = [
  { id: "presets", label: "Presets", icon: SparklesIcon },
  { id: "colors", label: "Colors", icon: PaletteIcon },
  { id: "typography", label: "Typography", icon: TypeIcon },
  { id: "buttons", label: "Buttons", icon: MousePointerClickIcon },
  { id: "layout", label: "Layout", icon: LayoutTemplateIcon },
  { id: "chrome", label: "Header & Footer", icon: PanelsTopLeftIcon },
  { id: "announcement", label: "Announcement", icon: MegaphoneIcon },
  { id: "advanced", label: "Advanced", icon: CodeIcon },
] as const

type PanelId = (typeof PANELS)[number]["id"]

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: MonitorIcon, width: null },
  { id: "tablet", label: "Tablet", icon: TabletIcon, width: 834 },
  { id: "mobile", label: "Mobile", icon: SmartphoneIcon, width: 390 },
] as const

type Revision = { id: number; editedBy: string | null; note: string | null; createdAt: string }

export function DesignStudio({
  initialTheme,
  publishedTheme,
  hasDraft,
  isAdmin,
}: {
  initialTheme: ThemeSettings
  publishedTheme: ThemeSettings
  hasDraft: boolean
  isAdmin: boolean
}) {
  const router = useRouter()
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialTheme,
    future: [],
    lastPush: 0,
  })
  const theme = history.present
  const [panel, setPanel] = useState<PanelId>("presets")
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("desktop")
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialTheme))
  const [draftPending, setDraftPending] = useState(hasDraft)
  const [pending, startTransition] = useTransition()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [revisions, setRevisions] = useState<Revision[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dirty = JSON.stringify(theme) !== savedJson
  const cssError = validateCustomCss(theme.customCss)
  const isPublishedState = !draftPending && !dirty && JSON.stringify(theme) === JSON.stringify(publishedTheme)

  const update = (recipe: (draft: ThemeSettings) => void) => {
    const next = structuredClone(theme)
    recipe(next)
    dispatch({ type: "set", theme: next })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("input, textarea, [contenteditable]")) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? "redo" : "undo" })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  const saveDraft = async () => {
    if (cssError) {
      toast.error(cssError)
      return false
    }
    const result = await saveThemeDraftAction(theme)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    setSavedJson(JSON.stringify(theme))
    setDraftPending(true)
    return true
  }

  const handleSave = () =>
    startTransition(async () => {
      if (await saveDraft()) toast.success("Draft saved")
    })

  const handlePublish = () =>
    startTransition(async () => {
      if (dirty && !(await saveDraft())) return
      const result = await publishThemeAction()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setDraftPending(false)
      toast.success("Theme published to the live site")
      router.refresh()
    })

  const handlePreview = () =>
    startTransition(async () => {
      if (dirty && !(await saveDraft())) return
      window.open("/api/admin/preview?path=/", "_blank", "noopener,noreferrer")
    })

  const handleDiscard = () => {
    if (!window.confirm("Discard all unpublished theme changes?")) return
    startTransition(async () => {
      const result = await discardThemeDraftAction()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      dispatch({ type: "replace", theme: publishedTheme })
      setSavedJson(JSON.stringify(publishedTheme))
      setDraftPending(false)
      toast.success("Draft discarded")
    })
  }

  const handleReset = () => {
    if (!window.confirm("Reset the draft to the original SSC theme? You can still review before publishing.")) return
    startTransition(async () => {
      const result = await resetThemeAction()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      dispatch({ type: "replace", theme: DEFAULT_THEME })
      setSavedJson(JSON.stringify(DEFAULT_THEME))
      setDraftPending(true)
      toast.success("Draft reset to default theme")
    })
  }

  const openHistory = () => {
    setHistoryOpen(true)
    setRevisions(null)
    startTransition(async () => {
      const result = await listThemeRevisionsAction()
      if (result.ok) setRevisions(result.data ?? [])
      else toast.error(result.error)
    })
  }

  const restoreRevision = (id: number) =>
    startTransition(async () => {
      const result = await restoreThemeRevisionAction(id)
      if (!result.ok || !result.data) {
        toast.error(result.ok ? "Revision not found" : result.error)
        return
      }
      dispatch({ type: "replace", theme: result.data })
      setSavedJson(JSON.stringify(result.data))
      setDraftPending(true)
      setHistoryOpen(false)
      toast.success("Version loaded into draft. Publish to make it live.")
    })

  const exportTheme = () => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ssc-theme.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importTheme = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      const imported = sanitizeTheme(parsed)
      if (!isAdmin) imported.customCss = theme.customCss
      dispatch({ type: "replace", theme: imported })
      toast.success("Theme imported. Review it, then save or publish.")
    } catch {
      toast.error("That file isn't a valid theme JSON export.")
    }
  }

  const deviceWidth = DEVICES.find((d) => d.id === device)?.width ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Design Studio</h1>
          {dirty ? (
            <Badge variant="outline">Unsaved changes</Badge>
          ) : draftPending ? (
            <Badge variant="secondary">Draft saved</Badge>
          ) : isPublishedState ? (
            <Badge>Live</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => dispatch({ type: "undo" })}
            disabled={!history.past.length}
            title="Undo (Ctrl+Z)"
          >
            <Undo2Icon />
            <span className="sr-only">Undo</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => dispatch({ type: "redo" })}
            disabled={!history.future.length}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2Icon />
            <span className="sr-only">Redo</span>
          </Button>
          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <div role="radiogroup" aria-label="Preview device" className="flex rounded-lg bg-muted p-1">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={device === d.id}
                title={d.label}
                onClick={() => setDevice(d.id)}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  device === d.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                <d.icon className="size-4" />
                <span className="sr-only">{d.label}</span>
              </button>
            ))}
          </div>
          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <Button size="sm" variant="ghost" onClick={openHistory}>
            <HistoryIcon />
            History
          </Button>
          <Button size="sm" variant="ghost" onClick={handlePreview} disabled={pending}>
            <EyeIcon />
            Preview site
          </Button>
          {(draftPending || dirty) && (
            <Button size="sm" variant="ghost" onClick={handleDiscard} disabled={pending}>
              Discard
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleSave} disabled={pending || !dirty}>
            Save draft
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={handlePublish} disabled={pending || (!dirty && !draftPending)}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex shrink-0 border-b border-border bg-background lg:w-[26rem] lg:border-r lg:border-b-0">
          <nav
            aria-label="Design settings"
            className="flex shrink-0 flex-col gap-1 border-r border-border p-2"
          >
            {PANELS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPanel(p.id)}
                aria-current={panel === p.id ? "page" : undefined}
                title={p.label}
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg transition-colors",
                  panel === p.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <p.icon className="size-[18px]" />
                <span className="sr-only">{p.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-5 lg:max-h-[calc(100dvh-8.5rem)]">
            <h2 className="pt-5 text-base font-semibold text-foreground">
              {PANELS.find((p) => p.id === panel)?.label}
            </h2>

            {panel === "presets" && (
              <ControlGroup title="Start from a preset" description="Applies colors and fonts. Everything stays editable.">
                <div className="flex flex-col gap-2">
                  {THEME_PRESETS.map((preset) => {
                    const colors = { ...DEFAULT_THEME.colors, ...preset.colors }
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => dispatch({ type: "replace", theme: applyPreset(theme, preset) })}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/50"
                      >
                        <span className="flex shrink-0 overflow-hidden rounded-md border border-border">
                          {[colors.primary, colors.accent, colors.brand3, colors.background].map((c, i) => (
                            <span key={i} className="h-9 w-4" style={{ backgroundColor: c }} />
                          ))}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-medium text-foreground">{preset.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{preset.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </ControlGroup>
            )}

            {panel === "colors" && (
              <>
                {(
                  [
                    ["Brand", ["primary", "primaryForeground", "accent", "accentForeground"]],
                    ["Surfaces", ["background", "foreground", "card", "secondary", "secondaryForeground"]],
                    ["Supporting", ["muted", "mutedForeground", "border", "destructive"]],
                    ["Four-color brand rule", ["brand1", "brand2", "brand3", "brand4"]],
                  ] as const
                ).map(([title, keys]) => (
                  <ControlGroup key={title} title={title}>
                    {keys.map((key) => {
                      const meta = COLOR_LABELS[key]
                      return (
                        <ColorField
                          key={key}
                          label={meta.label}
                          hint={meta.hint}
                          value={theme.colors[key]}
                          defaultValue={DEFAULT_THEME.colors[key]}
                          pairValue={meta.pairWith ? theme.colors[meta.pairWith] : undefined}
                          onChange={(v) => update((t) => void (t.colors[key] = v))}
                        />
                      )
                    })}
                  </ControlGroup>
                ))}
                <ControlGroup title="Browser" description="Tints the browser toolbar on mobile devices.">
                  <ColorField
                    label="Theme color"
                    value={theme.meta.themeColor}
                    defaultValue={DEFAULT_THEME.meta.themeColor}
                    onChange={(v) => update((t) => void (t.meta.themeColor = v))}
                  />
                </ControlGroup>
              </>
            )}

            {panel === "typography" && (
              <>
                <ControlGroup title="Fonts">
                  <FontPicker
                    label="Headings"
                    value={theme.typography.headingFont}
                    onChange={(v) => update((t) => void (t.typography.headingFont = v))}
                  />
                  <FontPicker
                    label="Body text"
                    value={theme.typography.bodyFont}
                    onChange={(v) => update((t) => void (t.typography.bodyFont = v))}
                  />
                </ControlGroup>
                <ControlGroup title="Body">
                  <SliderField
                    label="Base size"
                    value={theme.typography.baseSize}
                    min={15}
                    max={20}
                    step={1}
                    format={(v) => `${v}px`}
                    onChange={(v) => update((t) => void (t.typography.baseSize = v))}
                  />
                  <SliderField
                    label="Line height"
                    value={theme.typography.lineHeight}
                    min={1.3}
                    max={1.9}
                    step={0.05}
                    format={(v) => v.toFixed(2)}
                    onChange={(v) => update((t) => void (t.typography.lineHeight = v))}
                  />
                </ControlGroup>
                <ControlGroup title="Headings">
                  <SliderField
                    label="Weight"
                    value={theme.typography.headingWeight}
                    min={400}
                    max={800}
                    step={100}
                    onChange={(v) => update((t) => void (t.typography.headingWeight = v))}
                  />
                  <SliderField
                    label="Letter spacing"
                    value={theme.typography.headingTracking}
                    min={-0.05}
                    max={0.05}
                    step={0.005}
                    format={(v) => `${v.toFixed(3)}em`}
                    onChange={(v) => update((t) => void (t.typography.headingTracking = v))}
                  />
                </ControlGroup>
                <ControlGroup title="Text styles" description="Largest size on desktop. Headings scale down on phones.">
                  {(
                    [
                      ["h1", "Heading 1", 2, 5.5],
                      ["h2", "Heading 2", 1.5, 4],
                      ["h3", "Heading 3", 1, 2.5],
                      ["eyebrow", "Eyebrow label", 0.625, 1],
                    ] as const
                  ).map(([key, label, min, max]) => (
                    <SliderField
                      key={key}
                      label={label}
                      value={theme.typography.scale[key]}
                      min={min}
                      max={max}
                      step={0.0625}
                      format={(v) => `${Math.round(v * 16)}px`}
                      onChange={(v) => update((t) => void (t.typography.scale[key] = v))}
                    />
                  ))}
                </ControlGroup>
              </>
            )}

            {panel === "buttons" && (
              <ControlGroup title="Button style" description="Applies to every call-to-action button on the site.">
                <Segmented
                  label="Shape"
                  value={theme.buttons.shape}
                  options={[
                    { value: "square", label: "Square" },
                    { value: "rounded", label: "Rounded" },
                    { value: "pill", label: "Pill" },
                  ]}
                  onChange={(v) => update((t) => void (t.buttons.shape = v))}
                />
                <Segmented
                  label="Fill"
                  value={theme.buttons.style}
                  options={[
                    { value: "fill", label: "Solid" },
                    { value: "outline", label: "Outline" },
                  ]}
                  onChange={(v) => update((t) => void (t.buttons.style = v))}
                />
                <ToggleField
                  label="Uppercase labels"
                  checked={theme.buttons.uppercase}
                  onChange={(v) => update((t) => void (t.buttons.uppercase = v))}
                />
                <div className="flex flex-wrap gap-2 rounded-lg bg-muted/60 p-4" style={themeVarsStyle(theme)}>
                  <span className="ssc-btn px-4 py-2 text-sm">Primary</span>
                  <span className="ssc-btn-secondary px-4 py-2 text-sm">Secondary</span>
                  <span className="ssc-btn-accent px-4 py-2 text-sm">Accent</span>
                </div>
              </ControlGroup>
            )}

            {panel === "layout" && (
              <ControlGroup title="Page layout">
                <SliderField
                  label="Content width"
                  value={theme.layout.maxWidth}
                  min={960}
                  max={1600}
                  step={20}
                  format={(v) => `${v}px`}
                  onChange={(v) => update((t) => void (t.layout.maxWidth = v))}
                />
                <Segmented
                  label="Section spacing"
                  value={theme.layout.sectionSpacing}
                  options={[
                    { value: "compact", label: "Compact" },
                    { value: "normal", label: "Normal" },
                    { value: "airy", label: "Airy" },
                  ]}
                  onChange={(v) => update((t) => void (t.layout.sectionSpacing = v))}
                />
                <SliderField
                  label="Corner radius"
                  value={theme.layout.radius}
                  min={0}
                  max={1.5}
                  step={0.05}
                  format={(v) => `${Math.round(v * 16)}px`}
                  onChange={(v) => update((t) => void (t.layout.radius = v))}
                />
                <Segmented
                  label="Card shadows"
                  value={theme.layout.shadow}
                  options={[
                    { value: "none", label: "None" },
                    { value: "soft", label: "Soft" },
                    { value: "elevated", label: "Elevated" },
                  ]}
                  onChange={(v) => update((t) => void (t.layout.shadow = v))}
                />
              </ControlGroup>
            )}

            {panel === "chrome" && (
              <>
                <ControlGroup title="Header">
                  <Segmented
                    label="Style"
                    value={theme.header.style}
                    options={[
                      { value: "solid", label: "Solid" },
                      { value: "transparent", label: "Transparent" },
                      { value: "minimal", label: "Minimal" },
                    ]}
                    onChange={(v) => update((t) => void (t.header.style = v))}
                  />
                  <SliderField
                    label="Logo height"
                    value={theme.header.logoHeight}
                    min={28}
                    max={64}
                    step={2}
                    format={(v) => `${v}px`}
                    onChange={(v) => update((t) => void (t.header.logoHeight = v))}
                  />
                  <ToggleField
                    label="Sticky header"
                    description="Stays visible while scrolling"
                    checked={theme.header.sticky}
                    onChange={(v) => update((t) => void (t.header.sticky = v))}
                  />
                  <ToggleField
                    label="Utility bar"
                    description="Address and phone strip above the menu"
                    checked={theme.header.showUtilityBar}
                    onChange={(v) => update((t) => void (t.header.showUtilityBar = v))}
                  />
                </ControlGroup>
                <ControlGroup title="Footer">
                  <Segmented
                    label="Layout"
                    value={theme.footer.layout}
                    options={[
                      { value: "columns", label: "Columns" },
                      { value: "centered", label: "Centered" },
                      { value: "minimal", label: "Minimal" },
                    ]}
                    onChange={(v) => update((t) => void (t.footer.layout = v))}
                  />
                  <Segmented
                    label="Background"
                    value={theme.footer.background}
                    options={[
                      { value: "brand", label: "Brand" },
                      { value: "dark", label: "Dark" },
                      { value: "light", label: "Light" },
                    ]}
                    onChange={(v) => update((t) => void (t.footer.background = v))}
                  />
                </ControlGroup>
              </>
            )}

            {panel === "announcement" && (
              <ControlGroup title="Announcement bar" description="A slim banner shown above the header on every page.">
                <ToggleField
                  label="Show announcement"
                  checked={theme.announcement.enabled}
                  onChange={(v) => update((t) => void (t.announcement.enabled = v))}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="announcement-text" className="text-xs">
                    Message
                  </Label>
                  <Input
                    id="announcement-text"
                    value={theme.announcement.text}
                    maxLength={200}
                    placeholder="Now hiring CNAs — join our team"
                    onChange={(e) => update((t) => void (t.announcement.text = e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="announcement-href" className="text-xs">
                    Link (optional)
                  </Label>
                  <Input
                    id="announcement-href"
                    value={theme.announcement.href}
                    placeholder="/employment"
                    onChange={(e) => update((t) => void (t.announcement.href = e.target.value))}
                  />
                </div>
                <Segmented
                  label="Tone"
                  value={theme.announcement.tone}
                  options={[
                    { value: "brand", label: "Brand" },
                    { value: "accent", label: "Accent" },
                    { value: "neutral", label: "Neutral" },
                  ]}
                  onChange={(v) => update((t) => void (t.announcement.tone = v))}
                />
                <ToggleField
                  label="Visitors can dismiss"
                  checked={theme.announcement.dismissible}
                  onChange={(v) => update((t) => void (t.announcement.dismissible = v))}
                />
              </ControlGroup>
            )}

            {panel === "advanced" && (
              <>
                <ControlGroup title="Import & export" description="Move a theme between sites or keep a backup.">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={exportTheme}>
                      <DownloadIcon />
                      Export JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <UploadIcon />
                      Import JSON
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="sr-only"
                      tabIndex={-1}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void importTheme(file)
                        e.target.value = ""
                      }}
                    />
                  </div>
                </ControlGroup>
                <ControlGroup
                  title="Custom CSS"
                  description={
                    isAdmin
                      ? "Added after the theme on the public site. Imports and scripts are blocked."
                      : "Only admins can edit custom CSS."
                  }
                >
                  <Textarea
                    aria-label="Custom CSS"
                    value={theme.customCss}
                    disabled={!isAdmin}
                    maxLength={CUSTOM_CSS_MAX}
                    spellCheck={false}
                    rows={10}
                    placeholder={".ssc-h1 { text-wrap: balance; }"}
                    className="font-mono text-xs"
                    onChange={(e) => update((t) => void (t.customCss = e.target.value))}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-destructive">{cssError}</span>
                    <span className="text-muted-foreground">
                      {theme.customCss.length.toLocaleString()} / {CUSTOM_CSS_MAX.toLocaleString()}
                    </span>
                  </div>
                </ControlGroup>
                {isAdmin && (
                  <ControlGroup title="Reset" description="Loads the original SSC theme into the draft.">
                    <Button size="sm" variant="outline" onClick={handleReset} disabled={pending}>
                      <RotateCcwIcon />
                      Reset to default
                    </Button>
                  </ControlGroup>
                )}
              </>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto bg-muted/40 p-4 lg:max-h-[calc(100dvh-8.5rem)] lg:p-8">
          <ThemePreview theme={theme} width={deviceWidth} />
        </div>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Theme history</DialogTitle>
            <DialogDescription>
              Every published theme is kept. Restoring loads it into the draft for review.
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {revisions === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading history…</p>
            ) : revisions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No published versions yet.</p>
            ) : (
              revisions.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.note ?? "Published"} {r.editedBy ? `by ${r.editedBy}` : ""}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => restoreRevision(r.id)} disabled={pending}>
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function themeVarsStyle(theme: ThemeSettings): React.CSSProperties {
  return {
    "--primary": theme.colors.primary,
    "--primary-foreground": theme.colors.primaryForeground,
    "--accent": theme.colors.accent,
    "--accent-foreground": theme.colors.accentForeground,
    "--radius": `${theme.layout.radius}rem`,
    "--ssc-btn-radius": { square: "0.125rem", rounded: `${theme.layout.radius}rem`, pill: "9999px" }[theme.buttons.shape],
    "--ssc-btn-transform": theme.buttons.uppercase ? "uppercase" : "none",
    "--ssc-btn-tracking": theme.buttons.uppercase ? "0.08em" : "0",
    "--ssc-btn-bg": theme.buttons.style === "fill" ? "var(--primary)" : "transparent",
    "--ssc-btn-fg": theme.buttons.style === "fill" ? "var(--primary-foreground)" : "var(--primary)",
    "--ssc-btn-border": "var(--primary)",
    fontFamily: "var(--ssc-font-body)",
  } as React.CSSProperties
}
