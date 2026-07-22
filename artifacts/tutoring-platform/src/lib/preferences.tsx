import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Display & accessibility preferences, persisted per-browser in localStorage
// and applied as classes / data-attributes on <html>. Kept deliberately simple
// so it works for logged-out visitors too — accessibility must never be gated
// behind sign-in.

export type Theme = "light" | "dark" | "system";
export type Contrast = "normal" | "high";
export type ColorBlind = "off" | "on";
export type TextSize = "normal" | "large" | "xlarge";

export interface Preferences {
  theme: Theme;
  contrast: Contrast;
  colorBlind: ColorBlind;
  textSize: TextSize;
}

const STORAGE_KEY = "pr-display-preferences";

export const defaultPreferences: Preferences = {
  theme: "system",
  contrast: "normal",
  colorBlind: "off",
  textSize: "normal",
};

function readStored(): Preferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return defaultPreferences;
  }
}

// Exported so the pre-paint bootstrap in index.html and the provider share one
// source of truth for how a preference set maps onto the document element.
export function applyPreferences(prefs: Preferences) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && prefersDark);

  el.classList.toggle("dark", dark);
  el.classList.toggle("hc", prefs.contrast === "high");
  el.classList.toggle("cb", prefs.colorBlind === "on");
  el.dataset.textSize = prefs.textSize;
}

interface PreferencesContextValue extends Preferences {
  setTheme: (theme: Theme) => void;
  setContrast: (contrast: Contrast) => void;
  setColorBlind: (colorBlind: ColorBlind) => void;
  setTextSize: (textSize: TextSize) => void;
  reset: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(readStored);

  // Persist + apply whenever preferences change.
  useEffect(() => {
    applyPreferences(prefs);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — preferences simply won't persist */
    }
  }, [prefs]);

  // Follow the OS theme live while the user is on "system".
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPreferences(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
      setContrast: (contrast) => setPrefs((p) => ({ ...p, contrast })),
      setColorBlind: (colorBlind) => setPrefs((p) => ({ ...p, colorBlind })),
      setTextSize: (textSize) => setPrefs((p) => ({ ...p, textSize })),
      reset: () => setPrefs(defaultPreferences),
    }),
    [prefs],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
