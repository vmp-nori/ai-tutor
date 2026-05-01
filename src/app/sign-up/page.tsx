"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setNotice("Account created. Check your email to confirm your account, then sign in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <AuthLogo />
      <section aria-label="Create account" style={panelStyle}>
        <h1 style={titleStyle}>Create account</h1>
        <p style={copyStyle}>Use Supabase Auth to save generated paths and progress.</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              disabled={loading}
              style={inputStyle}
            />
          </label>

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
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          {notice && <div role="status" style={noticeStyle}>{notice}</div>}
          {error && <div role="alert" style={errorStyle}>{error}</div>}
          {!supabaseConfigured && (
            <div role="alert" style={errorStyle}>
              Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
            </div>
          )}

          <button type="submit" disabled={loading || !supabaseConfigured} style={primaryButtonStyle}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={footerTextStyle}>
          Already have an account? <Link href="/sign-in" style={linkStyle}>Sign in</Link>
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

const noticeStyle: React.CSSProperties = {
  background: "#F0FDF4",
  border: "1px solid #BBF7D0",
  borderRadius: 7,
  padding: "10px 12px",
  fontSize: 12.5,
  color: "#15803D",
  lineHeight: 1.5,
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
