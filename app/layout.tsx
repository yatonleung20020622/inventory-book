import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { parseThemeMode, THEME_COOKIE_NAME, THEME_STORAGE_KEY } from "@/lib/theme";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventory Book",
  description: "Inventory Book",
};

// Root layout reads theme cookie for SSR-matched Ant Design dark/light mode.
export const instant = false;

const themeInitScript = `
(function () {
  try {
    var storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    var cookieName = ${JSON.stringify(THEME_COOKIE_NAME)};
    var stored = localStorage.getItem(storageKey);
    var cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + cookieName + '=([^;]*)'));
    var fromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    // Prefer cookie (matches SSR). Fall back to localStorage, then system preference.
    var mode = fromCookie === 'light' || fromCookie === 'dark'
      ? fromCookie
      : (stored === 'light' || stored === 'dark'
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(storageKey, mode);
    document.cookie = cookieName + '=' + mode + '; Path=/; Max-Age=31536000; SameSite=Lax';
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const initialTheme = parseThemeMode(
    cookieStore.get(THEME_COOKIE_NAME)?.value,
  );

  return (
    <html
      lang="en"
      data-theme={initialTheme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full">
        <Suspense fallback={null}>
          <Providers initialTheme={initialTheme}>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
