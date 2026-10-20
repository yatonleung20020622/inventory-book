"use client";

import { App, ConfigProvider, theme as antdTheme } from "antd";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  THEME_STORAGE_KEY,
  themeCookie,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  document.cookie = themeCookie(mode);
}

type ThemeProviderProps = {
  initialTheme: ThemeMode;
  children: ReactNode;
};

export function ThemeProvider({ initialTheme, children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialTheme);
  const isDark = mode === "dark";

  // One-time sync when an older localStorage theme exists but cookie (SSR) did not.
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if ((stored === "light" || stored === "dark") && stored !== initialTheme) {
      setModeState(stored);
      applyTheme(stored);
    } else {
      applyTheme(initialTheme);
    }
  }, [initialTheme]);

  function setMode(next: ThemeMode) {
    setModeState(next);
    applyTheme(next);
  }

  function toggle() {
    setMode(mode === "light" ? "dark" : "light");
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle }}>
      <ConfigProvider
        theme={{
          algorithm: isDark
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: "#1677ff",
            fontFamily: "var(--font-geist-sans), sans-serif",
            colorBgContainer: isDark ? "#141414" : "#ffffff",
            colorBgElevated: isDark ? "#1f1f1f" : "#ffffff",
            colorBorderSecondary: isDark ? "#303030" : "#f0f0f0",
          },
          components: {
            Table: {
              headerBg: isDark ? "#1d1d1d" : "#fafafa",
              headerColor: isDark
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(0, 0, 0, 0.88)",
              rowHoverBg: isDark ? "#262626" : "#fafafa",
              borderColor: isDark ? "#303030" : "#f0f0f0",
              colorBgContainer: isDark ? "#141414" : "#ffffff",
            },
            Layout: {
              headerBg: isDark ? "#141414" : "#ffffff",
              bodyBg: isDark ? "#000000" : "#f5f5f5",
              siderBg: "#001529",
            },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
}
