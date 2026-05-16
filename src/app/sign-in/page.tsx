"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function callbackUrl() {
  if (typeof window === "undefined") return "/dashboard";
  return new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
}

function initialError() {
  if (typeof window === "undefined") return null;
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");
  if (error === "confirmation_failed") {
    return "Email confirmation failed. Please try signing up again.";
  }
  return null;
}

function initialNotice() {
  if (typeof window === "undefined") return null;
  const verified = new URLSearchParams(window.location.search).get("verified");
  if (verified === "1") {
    return "Email verified. You can now sign in.";
  }
  return null;
}

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(initialNotice);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(callbackUrl());
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <AuthLogo />
      <section aria-label="Sign in" style={panelStyle}>
        <h1 style={titleStyle}>Sign in</h1>
        <p style={copyStyle}>Use your Pathwise account to continue building learning paths.</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          {error && <div role="alert" style={errorStyle}>{error}</div>}
          {notice && <div role="status" style={noticeStyle}>{notice}</div>}
          {!supabaseConfigured && (
            <div role="alert" style={errorStyle}>
              Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
            </div>
          )}

          <button type="submit" disabled={loading || !supabaseConfigured} style={fullWidthButtonStyle}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={footerTextStyle}>
          No account yet? <Link href="/sign-up" style={linkStyle}>Create one</Link>
        </p>
      </section>
    </main>
  );
}

function AuthLogo() {
  return (
    <Link href="/" style={logoStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.svg" alt="" aria-hidden="true" width={24} height={24} style={{ borderRadius: 6, flexShrink: 0, display: "block" }} />
      <span>pathwise</span>
    </Link>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--color-canvas)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
};

const logoStyle: React.CSSProperties = {
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


const panelStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "var(--color-panel)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  padding: "28px 26px",
  boxShadow: "var(--shadow-card)",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 20,
  fontWeight: 700,
  color: "var(--color-text-primary)",
};

const copyStyle: React.CSSProperties = {
  margin: "0 0 24px",
  fontSize: 13,
  color: "var(--color-text-muted)",
  lineHeight: 1.5,
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};

const inputStyle: React.CSSProperties = {
  height: 38,
  border: "1px solid var(--color-border)",
  borderRadius: 7,
  padding: "0 12px",
  fontSize: 13,
  color: "var(--color-text-primary)",
  background: "var(--color-node)",
};

const errorStyle: React.CSSProperties = {
  background: "var(--color-danger-soft)",
  border: "1px solid var(--color-danger-border)",
  borderRadius: 7,
  padding: "10px 12px",
  fontSize: 12.5,
  color: "var(--color-danger)",
  lineHeight: 1.5,
};

const noticeStyle: React.CSSProperties = {
  background: "color-mix(in srgb, var(--color-success) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--color-success) 30%, transparent)",
  borderRadius: 7,
  padding: "10px 12px",
  fontSize: 12.5,
  color: "var(--color-success)",
  lineHeight: 1.5,
};

const primaryButtonStyle: React.CSSProperties = {
  height: 42,
  background: "var(--color-button-primary)",
  color: "var(--color-button-primary-text)",
  border: "none",
  borderRadius: 7,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};

const fullWidthButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  width: "100%",
};

const footerTextStyle: React.CSSProperties = {
  margin: "18px 0 0",
  fontSize: 12.5,
  color: "var(--color-text-muted)",
  textAlign: "center",
};

const linkStyle: React.CSSProperties = {
  color: "var(--color-text-accent)",
  fontWeight: 700,
  textDecoration: "none",
};
