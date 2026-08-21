import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getStoredTheme = (): Theme | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
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
    setTheme(effectiveTheme === "dark" ? "light" : "dark");
  }, [effectiveTheme, setTheme]);

  return { theme: effectiveTheme, isExplicit: explicitTheme !== null, setTheme, toggleTheme };
};
