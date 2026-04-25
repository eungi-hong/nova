import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { isHandleAvailable, upsertProfile } from "../lib/api";
import { slugify } from "../lib/util";

export function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setHandle(profile.handle);
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  if (!user || !profile) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const cleaned = slugify(handle);
      if (cleaned !== profile.handle) {
        const ok = await isHandleAvailable(cleaned, user.id);
        if (!ok) {
          setError(`@${cleaned} is taken.`);
          setSaving(false);
          return;
        }
      }
      await upsertProfile({
        id: user.id,
        handle: cleaned,
        display_name: displayName.trim() || cleaned,
        bio: bio.trim() || null,
      });
      await refreshProfile();
      setMessage("saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="editor">
      <div className="editor__head">
        <h1>settings</h1>
        <span style={{ fontFamily: "var(--sans)", fontSize: "0.66rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--muted)" }}>
          {user.email}
        </span>
      </div>

      <form className="editor__section" onSubmit={submit}>
        <label className="field">
          <span className="field__label">handle</span>
          <input
            className="input"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <span className="field__hint">your diary lives at /@{slugify(handle || profile.handle)}</span>
        </label>

        <label className="field">
          <span className="field__label">display name</span>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">bio</span>
          <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={240} />
        </label>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button className="btn btn--accent" disabled={saving}>{saving ? "saving…" : "save changes"}</button>
          {message && <span style={{ color: "var(--accent-2)", fontFamily: "var(--sans)", fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>{message}</span>}
          {error && <span className="auth__error" style={{ margin: 0 }}>{error}</span>}
        </div>
      </form>
    </main>
  );
}
