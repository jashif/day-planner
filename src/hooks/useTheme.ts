import { useCallback, useEffect, useState } from "react";

export type Theme = "calm" | "focus" | "warm" | "play" | "dark";

export const THEMES: { id: Theme; label: string; description: string }[] = [
  { id: "calm", label: "Calm", description: "Paper and sage" },
  { id: "focus", label: "Focus", description: "Clear blue and mint" },
  { id: "warm", label: "Warm", description: "Coral and honey" },
  { id: "play", label: "Play", description: "Bright and lively" },
  { id: "dark", label: "Night", description: "Low-light mode" },
];

const STORAGE_KEY = "theme";
const THEME_IDS = THEMES.map((theme) => theme.id);

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "calm";

const getStoredTheme = (): Theme | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light") return "calm";
  return THEME_IDS.includes(stored as Theme) ? (stored as Theme) : null;
};

const applyTheme = (theme: Theme | null) => {
  if (theme) {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
};

/** Explicit choice takes precedence; otherwise the effective theme follows the OS setting. */
export const useTheme = () => {
  const [explicitTheme, setExplicitTheme] = useState<Theme | null>(() => getStoredTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<Theme>(
    () => getStoredTheme() ?? getSystemTheme(),
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!getStoredTheme()) setEffectiveTheme(getSystemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    setExplicitTheme(theme);
    setEffectiveTheme(theme);
    applyTheme(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(effectiveTheme === "dark" ? "calm" : "dark");
  }, [effectiveTheme, setTheme]);

  return { theme: effectiveTheme, isExplicit: explicitTheme !== null, setTheme, toggleTheme };
};
