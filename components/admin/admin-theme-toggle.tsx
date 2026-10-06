"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAdminTheme, type AdminThemePreference } from "./admin-theme-provider"

const OPTIONS: { value: AdminThemePreference; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
]

/** Three-way selector for the sidebar and the mobile navigation sheet. */
export function AdminThemeSelector() {
  const { preference, setPreference } = useAdminTheme()

  return (
    <div role="radiogroup" aria-label="Color theme" className="flex rounded-lg bg-muted p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(value)}
            className={cn(
              "flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/** One-tap light/dark switch for the compact mobile header. */
export function AdminThemeQuickToggle() {
  const { resolved, setPreference } = useAdminTheme()
  const next = resolved === "dark" ? "light" : "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      onClick={() => setPreference(next)}
      aria-label={`Switch to ${next} mode`}
    >
      <SunIcon className="hidden size-5 dark:block" />
      <MoonIcon className="size-5 dark:hidden" />
    </Button>
  )
}
