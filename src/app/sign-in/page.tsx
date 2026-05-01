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
  const error = new URLSearchParams(window.location.search).get("error");
  if (error === "confirmation_failed") {
    return "Email confirmation failed. Please try signing up again.";
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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
        <p style={copyStyle}>Use your Supabase account to continue building learning paths.</p>

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
          {!supabaseConfigured && (
            <div role="alert" style={errorStyle}>
              Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
            </div>
          )}

          <button type="submit" disabled={loading || !supabaseConfigured} style={primaryButtonStyle}>
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
      <span style={markStyle}><span style={dotStyle} /></span>
      <span>Pathwise</span>
    </Link>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#FCFCFA",
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
  color: "#0E0F12",
  fontSize: 14.5,
  fontWeight: 700,
};

const markStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  background: "#0E0F12",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  background: "#FCFCFA",
  borderRadius: "50%",
};

const panelStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#FFFFFF",
  border: "1px solid #E6E5DF",
  borderRadius: 8,
  padding: "28px 26px",
  boxShadow: "0 2px 12px rgba(20,15,10,0.07)",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 20,
  fontWeight: 700,
  color: "#0E0F12",
};

const copyStyle: React.CSSProperties = {
  margin: "0 0 24px",
  fontSize: 13,
  color: "#8A8A82",
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
  color: "#4D4E54",
};

const inputStyle: React.CSSProperties = {
  height: 38,
  border: "1px solid #E6E5DF",
  borderRadius: 7,
  padding: "0 12px",
  fontSize: 13,
  color: "#0E0F12",
  background: "#FFFFFF",
};

const errorStyle: React.CSSProperties = {
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  borderRadius: 7,
  padding: "10px 12px",
  fontSize: 12.5,
  color: "#DC2626",
  lineHeight: 1.5,
};

const primaryButtonStyle: React.CSSProperties = {
  height: 42,
  background: "#0E0F12",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 7,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};

const footerTextStyle: React.CSSProperties = {
  margin: "18px 0 0",
  fontSize: 12.5,
  color: "#8A8A82",
  textAlign: "center",
};

const linkStyle: React.CSSProperties = {
  color: "#2563EB",
  fontWeight: 700,
  textDecoration: "none",
};
