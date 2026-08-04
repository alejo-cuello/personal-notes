"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * A small localStorage-backed state hook.
 * - Reads once on mount (avoids hydration mismatch by starting from the initial value).
 * - Persists on every change.
 * - Syncs across tabs via the "storage" event.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        setValue(JSON.parse(stored) as T)
      }
    } catch {
      // ignore malformed data
    }
    setHydrated(true)
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage may be full or unavailable
    }
  }, [key, value, hydrated])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue) as T)
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [key])

  const reset = useCallback(() => setValue(initialValue), [initialValue])

  return { value, setValue, hydrated, reset }
}
