import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { AIChatSidebar } from "@/components/ui/AIChatSidebar";
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

const appUrl = "https://pathwise.cloud";
const siteTitle = "Pathwise — Learn anything, one concept at a time";
const siteDescription =
  "AI-generated skill trees for any subject. Follow a clear, atomic path from foundational primitives to your goal.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "Pathwise",
  title: {
    default: siteTitle,
    template: "%s | Pathwise",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/app-icon.png", sizes: "1024x1024", type: "image/png" }],
    shortcut: "/brand/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Pathwise",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/brand/banner-twitter.png",
        width: 1500,
        height: 500,
        alt: "Pathwise brand preview",
      },
      {
        url: "/brand/logo-1x1-light.png",
        width: 400,
        height: 400,
        alt: "Pathwise logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/brand/banner-twitter.png"],
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
        <AIChatSidebar />
      </body>
    </html>
  );
}
