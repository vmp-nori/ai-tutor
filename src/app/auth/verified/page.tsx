import Link from "next/link";
import type { CSSProperties } from "react";

export default function VerifiedPage() {
  return (
    <main style={pageStyle}>
      <Link href="/" style={logoStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" aria-hidden="true" width={24} height={24} style={logoMarkStyle} />
        <span>pathwise</span>
      </Link>

      <section aria-label="Email verified" style={panelStyle}>
        <div aria-hidden="true" style={successMarkStyle}>✓</div>
        <h1 style={titleStyle}>Email verified</h1>
        <p style={copyStyle}>Your Pathwise account is ready.</p>
        <Link href="/dashboard" style={primaryLinkStyle}>Continue to dashboard</Link>
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--color-canvas)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
};

const logoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 36,
  textDecoration: "none",
  color: "var(--color-text-primary)",
  fontSize: 14.5,
  fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif",
  fontWeight: 800,
};

const logoMarkStyle: CSSProperties = {
  borderRadius: 6,
  flexShrink: 0,
  display: "block",
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "var(--color-panel)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  padding: "28px 26px",
  boxShadow: "var(--shadow-card)",
  textAlign: "center",
};

const successMarkStyle: CSSProperties = {
  width: 40,
  height: 40,
  margin: "0 auto 16px",
  borderRadius: 20,
  background: "var(--color-success-subtle)",
  border: "1px solid var(--color-success-border)",
  color: "var(--color-success)",
  display: "grid",
  placeItems: "center",
  fontSize: 20,
  fontWeight: 800,
};

const titleStyle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: 20,
  fontWeight: 700,
  color: "var(--color-text-primary)",
};

const copyStyle: CSSProperties = {
  margin: "0 0 24px",
  fontSize: 13,
  color: "var(--color-text-muted)",
  lineHeight: 1.5,
};

const primaryLinkStyle: CSSProperties = {
  height: 42,
  background: "var(--color-button-primary)",
  color: "var(--color-button-primary-text)",
  borderRadius: 7,
  fontSize: 13.5,
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 18px",
};
