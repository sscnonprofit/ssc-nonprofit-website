"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type AdminThemePreference = "light" | "dark" | "system"
export type AdminResolvedTheme = "light" | "dark"

export const ADMIN_THEME_STORAGE_KEY = "ssc-admin-theme"

type AdminThemeContextValue = {
  preference: AdminThemePreference
  resolved: AdminResolvedTheme
  setPreference: (preference: AdminThemePreference) => void
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

function readStoredPreference(): AdminThemePreference {
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") return stored
  } catch {
    // Storage can be blocked (private mode, embedded frames); use the light default.
  }
  return "light"
}

function applyTheme(resolved: AdminResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

/**
 * Runs before first paint (inlined in the admin layout) so the admin defaults to light
 * without a flash, while an explicitly saved dark preference is preserved.
 * Keep the storage key in sync with ADMIN_THEME_STORAGE_KEY.
 */
export const ADMIN_THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${ADMIN_THEME_STORAGE_KEY}");var d=s==="dark"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AdminThemePreference>("light")
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    setPreferenceState(readStoredPreference())
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemDark(media.matches)
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener("change", onChange)

    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_THEME_STORAGE_KEY) setPreferenceState(readStoredPreference())
    }
    window.addEventListener("storage", onStorage)

    return () => {
      media.removeEventListener("change", onChange)
      window.removeEventListener("storage", onStorage)
      // The public site is light-only, so never leave the class behind when leaving the admin.
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const resolved: AdminResolvedTheme = preference === "system" ? (systemDark ? "dark" : "light") : preference

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const setPreference = useCallback((next: AdminThemePreference) => {
    setPreferenceState(next)
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, next)
    } catch {
      // Preference still applies for this session even if it cannot be saved.
    }
  }, [])

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference])

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext)
  if (!context) throw new Error("useAdminTheme must be used inside AdminThemeProvider")
  return context
}

/** For shared UI (e.g. the toaster) that may render outside the admin. */
export function useOptionalAdminTheme() {
  return useContext(AdminThemeContext)
}
