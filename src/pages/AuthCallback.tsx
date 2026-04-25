import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

/**
 * Handles return-from-magic-link in both Supabase auth flows:
 *   - PKCE:     /auth/callback?code=xxx        → exchangeCodeForSession
 *   - Implicit: /auth/callback#access_token=…  → detectSessionInUrl picks it up
 *
 * Once a session is established, redirect to the diary (or onboarding if
 * the user hasn't picked a handle yet).
 */
export function AuthCallback() {
  const { user, profile, ready } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const errorDescription =
      url.searchParams.get("error_description") ||
      new URLSearchParams(url.hash.replace(/^#/, "")).get("error_description");

    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message);
        // strip ?code= from address bar regardless
        window.history.replaceState({}, "", "/auth/callback");
      });
    }
    // hash flow is auto-handled by detectSessionInUrl in the SDK
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (error) return;
    if (!user) return;
    navigate(profile ? `/@${profile.handle}` : "/onboarding", { replace: true });
  }, [ready, user, profile, error, navigate]);

  return (
    <main className="auth">
      <h1 className="auth__title">{error ? "couldn't sign you in." : "signing you in…"}</h1>
      {error ? (
        <>
          <p className="auth__lede">{error}</p>
          <Link to="/login" className="btn btn--accent">← back to sign in</Link>
        </>
      ) : (
        <p className="auth__lede">one moment — confirming the link.</p>
      )}
    </main>
  );
}
