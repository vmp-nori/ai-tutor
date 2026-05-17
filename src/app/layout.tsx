import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Cabin,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Manrope,
} from "next/font/google";
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

const luminaManrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lumina-manrope",
  display: "swap",
});

const luminaCabin = Cabin({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lumina-cabin",
  display: "swap",
});

const luminaInstrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-lumina-instrument",
  display: "swap",
});

const luminaInter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lumina-sans",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${jetbrainsMono.variable} ${luminaManrope.variable} ${luminaCabin.variable} ${luminaInstrument.variable} ${luminaInter.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <ScreenSelectionOverlay />
      </body>
    </html>
  );
}
