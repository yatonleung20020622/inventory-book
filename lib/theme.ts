export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "inventory-book-theme";
export const THEME_COOKIE_NAME = "inventory-book-theme";

export function parseThemeMode(value: string | null | undefined): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function themeCookie(mode: ThemeMode) {
  return `${THEME_COOKIE_NAME}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
