import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathwise — Learn anything, one concept at a time",
  description:
    "AI-generated skill trees for any subject. Follow a clear, atomic path from foundational primitives to your goal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
