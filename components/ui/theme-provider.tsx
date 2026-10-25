"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

const themeListeners = new Set<() => void>();

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("daymark-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);
  const initial = readTheme();
  document.documentElement.dataset.theme = initial;
  document.documentElement.dataset.colorScheme = initial;

  const onStorage = (event: StorageEvent) => {
    if (event.key === "daymark-theme") {
      const next = readTheme();
      document.documentElement.dataset.theme = next;
      document.documentElement.dataset.colorScheme = next;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, (): Theme => "light");

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    window.localStorage.setItem("daymark-theme", next);
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.colorScheme = next;
    themeListeners.forEach((listener) => listener());
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
