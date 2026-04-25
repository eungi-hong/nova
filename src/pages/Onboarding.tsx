import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { isHandleAvailable, upsertProfile } from "../lib/api";
import { slugify } from "../lib/util";

export function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) navigate(`/@${profile.handle}`, { replace: true });
  }, [profile, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleaned = slugify(handle);
    if (!cleaned || cleaned.length < 2) {
      setError("Handle must be at least 2 characters (letters, numbers, hyphens).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ok = await isHandleAvailable(cleaned);
      if (!ok) {
        setError(`@${cleaned} is taken — try another.`);
        setSaving(false);
        return;
      }
      await upsertProfile({
        id: user.id,
        handle: cleaned,
        display_name: displayName.trim() || cleaned,
        bio: bio.trim() || null,
      });
      await refreshProfile();
      navigate(`/@${cleaned}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  };

  return (
    <main className="auth" style={{ maxWidth: 640 }}>
      <h1 className="auth__title">choose your handle.</h1>
      <p className="auth__lede">
        Your diary will live at <code>/@handle</code>. Pick something short and memorable — it's the link you'll share.
      </p>

      <form className="auth__form" onSubmit={submit}>
        <label className="field">
          <span className="field__label">handle</span>
          <input
            className="input"
            autoFocus
            placeholder="eungi"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={32}
          />
          <span className="field__hint">
            preview: <strong>{window.location.origin}/@{slugify(handle || "your-handle")}</strong>
          </span>
        </label>

        <label className="field">
          <span className="field__label">display name</span>
          <input
            className="input"
            placeholder="Eungi Hong"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">bio (optional)</span>
          <textarea
            className="textarea"
            placeholder="a one-line description of who you are and what you make."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={240}
          />
        </label>

        <button className="btn btn--accent" disabled={saving}>
          {saving ? "saving…" : "open my diary →"}
        </button>
        {error && <div className="auth__error">{error}</div>}
      </form>
    </main>
  );
}
