import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  isHandleAvailable,
  publicPhotoUrl,
  updateProfile,
  uploadPhoto,
} from "../lib/api";
import { slugify } from "../lib/util";

export function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setHandle(profile.handle);
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  if (!user || !profile) return null;

  const onHeroUpload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setMessage(null);
    setHeroUploading(true);
    try {
      const path = await uploadPhoto(user.id, file);
      await updateProfile(user.id, { hero_photo_path: path });
      await refreshProfile();
      setMessage("hero photo updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setHeroUploading(false);
    }
  };

  const onHeroRemove = async () => {
    setError(null);
    setMessage(null);
    setHeroUploading(true);
    try {
      await updateProfile(user.id, { hero_photo_path: null });
      await refreshProfile();
      setMessage("hero photo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove.");
    } finally {
      setHeroUploading(false);
    }
  };

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
      await updateProfile(user.id, {
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

        <div className="field">
          <span className="field__label">hero photo</span>
          {profile.hero_photo_path ? (
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 12 }}>
              <img
                src={publicPhotoUrl(profile.hero_photo_path)}
                alt="hero"
                style={{ width: 180, height: 120, objectFit: "cover", border: "1px solid var(--line)" }}
              />
              <button
                type="button"
                className="btn btn--small btn--ghost"
                disabled={heroUploading}
                onClick={onHeroRemove}
              >
                remove
              </button>
            </div>
          ) : null}
          <label className="editor__upload">
            <input
              type="file"
              accept="image/*"
              disabled={heroUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                onHeroUpload(file);
              }}
            />
            {heroUploading ? "uploading…" : profile.hero_photo_path ? "+ replace photo" : "+ upload photo"}
          </label>
          <span className="field__hint">
            shown on the cover of /@{profile.handle}. falls back to your first entry's first photo when empty.
          </span>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button className="btn btn--accent" disabled={saving}>{saving ? "saving…" : "save changes"}</button>
          {message && <span style={{ color: "var(--accent-2)", fontFamily: "var(--sans)", fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>{message}</span>}
          {error && <span className="auth__error" style={{ margin: 0 }}>{error}</span>}
        </div>
      </form>
    </main>
  );
}
