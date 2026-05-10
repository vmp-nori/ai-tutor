import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { ScreenSelectionOverlay } from "@/components/ui/ScreenSelectionOverlay";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pathwise — Learn anything, one concept at a time",
  description:
    "AI-generated skill trees for any subject. Follow a clear, atomic path from foundational primitives to your goal.",
  icons: {
    icon: "/favicon.svg",
    apple: "/app-icon.svg",
  },
};

const themeScript = `
(() => {
  try {
    const themes = new Set([
      "light",
      "paper",
      "mist",
      "sage",
      "linen",
      "parchment",
      "dark",
      "dark-mist",
      "dark-blueprint",
      "dark-sage",
      "dark-clay",
      "dark-archive",
    ]);
    const storedTheme = window.localStorage.getItem("pathwise-theme");
    const theme = themes.has(storedTheme)
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "paper";
    document.documentElement.dataset.theme = theme;
  } catch {
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <ScreenSelectionOverlay />
      </body>
    </html>
  );
}
