import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";

type Mode = "magic" | "signin" | "signup";

export function Login() {
  const { user, profile, signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(() => {
    const m = params.get("mode");
    return m === "signin" || m === "signup" || m === "magic" ? (m as Mode) : "magic";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    navigate(profile ? `/@${profile.handle}` : "/onboarding", { replace: true });
  }, [user, profile, navigate]);

  const reset = () => {
    setError(null);
    setMagicSent(false);
    setConfirmSent(false);
  };

  const switchMode = (next: Mode) => {
    reset();
    setMode(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    reset();
    setSubmitting(true);
    if (mode === "magic") {
      const { error } = await signInWithEmail(email.trim());
      setSubmitting(false);
      if (error) setError(error);
      else setMagicSent(true);
    } else if (mode === "signin") {
      const { error } = await signInWithPassword(email.trim(), password);
      setSubmitting(false);
      if (error) setError(error);
      // success: useEffect on `user` will navigate
    } else {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setSubmitting(false);
        return;
      }
      const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password);
      setSubmitting(false);
      if (error) setError(error);
      else if (needsConfirmation) setConfirmSent(true);
      // else: session is live, useEffect navigates
    }
  };

  const headings: Record<Mode, { title: string; lede: string; cta: string }> = {
    magic: {
      title: "welcome in.",
      lede:
        "NOVA uses magic links — enter your email and we'll send you a one-time sign-in link. No password required.",
      cta: "send magic link →",
    },
    signin: {
      title: "sign in.",
      lede: "If you set a password, you can sign in directly here.",
      cta: "sign in →",
    },
    signup: {
      title: "make an account.",
      lede:
        "Create an account with an email and a password. You'll pick a handle on the next screen.",
      cta: "create account →",
    },
  };
  const h = headings[mode];

  const Tab = ({ value, label }: { value: Mode; label: string }) => (
    <button
      type="button"
      className={`pill${mode === value ? " pill--accent" : ""}`}
      style={{
        fontFamily: "var(--sans)",
        fontSize: "0.62rem",
        letterSpacing: "0.26em",
        textTransform: "uppercase",
      }}
      onClick={() => switchMode(value)}
    >
      {label}
    </button>
  );

  return (
    <main className="auth">
      <h1 className="auth__title">{h.title}</h1>
      <p className="auth__lede">{h.lede}</p>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
        <Tab value="magic" label="magic link" />
        <Tab value="signin" label="password sign in" />
        <Tab value="signup" label="new account" />
      </div>

      {magicSent ? (
        <div className="auth__notice">
          <strong>Check your inbox.</strong> We sent a sign-in link to <em>{email}</em>. Open it on this device to continue.
        </div>
      ) : confirmSent ? (
        <div className="auth__notice">
          <strong>Confirm your email.</strong> We sent a confirmation link to <em>{email}</em>. Click it to activate your account, then come back to sign in.
        </div>
      ) : (
        <form className="auth__form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">email address</span>
            <input
              type="email"
              required
              autoFocus
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          {mode !== "magic" && (
            <label className="field">
              <span className="field__label">password</span>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "at least 8 characters" : "your password"}
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              {mode === "signin" && (
                <span className="field__hint">
                  forgot your password?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("magic")}
                    style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", padding: 0, font: "inherit", textDecoration: "underline" }}
                  >
                    sign in with a magic link instead
                  </button>
                </span>
              )}
            </label>
          )}

          <button className="btn btn--accent" disabled={submitting}>
            {submitting ? "…" : h.cta}
          </button>
          {error && <div className="auth__error">{error}</div>}
        </form>
      )}
    </main>
  );
}
