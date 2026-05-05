import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "600", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pathwise — Learn anything, one concept at a time",
  description:
    "AI-generated skill trees for any subject. Follow a clear, atomic path from foundational primitives to your goal.",
};

const themeScript = `
(() => {
  try {
    const themes = new Set(["light", "paper", "mist", "sage", "linen", "parchment", "dark"]);
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
    <html lang="en" suppressHydrationWarning className={bricolage.variable}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
