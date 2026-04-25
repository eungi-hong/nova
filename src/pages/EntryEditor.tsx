import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  deleteEntry,
  getMyEntry,
  publicAudioUrl,
  publicPhotoUrl,
  saveEntry,
  uploadAudio,
  uploadPhoto,
} from "../lib/api";
import type { Medium } from "../lib/types";
import { slugify } from "../lib/util";

interface SectionDraft {
  label: string;
  body: string;
}

interface MetaDraft {
  label: string;
  value: string;
}

interface MediaDraft {
  storage_path: string;
  caption: string | null;
  preview: string;
}

const MEDIA_MEDIUMS: Medium[] = ["dance", "music", "theatre", "voice", "other"];

const blankSection = (i: number): SectionDraft => ({
  label: ["i — the rehearsal", "ii — the night", "iii — what stayed"][i] || `${i + 1} — section`,
  body: "",
});

export function EntryEditor() {
  const { entryId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(Boolean(entryId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [titleHtml, setTitleHtml] = useState("");
  const [eyebrow, setEyebrow] = useState("");
  const [medium, setMedium] = useState<Medium>("dance");
  const [venue, setVenue] = useState("");
  const [performedOn, setPerformedOn] = useState("");
  const [intro, setIntro] = useState("");
  const [pullQuote, setPullQuote] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [sections, setSections] = useState<SectionDraft[]>([
    blankSection(0),
    blankSection(1),
    blankSection(2),
  ]);
  const [meta, setMeta] = useState<MetaDraft[]>([
    { label: "date", value: "" },
    { label: "venue", value: "" },
    { label: "crew", value: "" },
    { label: "piece", value: "" },
  ]);
  const [photos, setPhotos] = useState<MediaDraft[]>([]);
  const [audio, setAudio] = useState<MediaDraft[]>([]);

  useEffect(() => {
    if (!entryId) return;
    (async () => {
      const data = await getMyEntry(entryId);
      if (!data) {
        setError("Entry not found.");
        setLoading(false);
        return;
      }
      const e = data.entry;
      setTitle(e.title);
      setTitleHtml(e.title_html || "");
      setEyebrow(e.eyebrow || "");
      setMedium(e.medium);
      setVenue(e.venue || "");
      setPerformedOn(e.performed_on ? e.performed_on.slice(0, 10) : "");
      setIntro(e.intro || "");
      setPullQuote(e.pull_quote || "");
      setVideoUrl(e.video_url || "");
      setVideoCaption(e.video_caption || "");
      setIsDraft(e.is_draft);
      setSlug(e.slug);
      setSlugTouched(true);
      setSections(
        data.sections.length
          ? data.sections.map((s) => ({ label: s.label, body: s.body }))
          : [blankSection(0)],
      );
      setMeta(
        data.meta.length
          ? data.meta.map((m) => ({ label: m.label, value: m.value }))
          : [{ label: "date", value: "" }],
      );
      setPhotos(
        data.photos.map((p) => ({
          storage_path: p.storage_path,
          caption: p.caption,
          preview: publicPhotoUrl(p.storage_path),
        })),
      );
      setAudio(
        data.audio.map((a) => ({
          storage_path: a.storage_path,
          caption: a.caption,
          preview: publicAudioUrl(a.storage_path),
        })),
      );
      setLoading(false);
    })();
  }, [entryId]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(title));
  }, [title, slugTouched]);

  const finalSlug = useMemo(() => slugify(slug || title || "untitled"), [slug, title]);

  if (loading) {
    return (
      <main className="editor">
        <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", letterSpacing: "0.24em", textTransform: "uppercase", fontSize: "0.7rem" }}>loading…</p>
      </main>
    );
  }

  if (!user || !profile) return null;

  const handleSave = async (publish?: "publish" | "draft") => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const finalDraft = publish ? publish === "draft" : isDraft;
      const id = await saveEntry(user.id, {
        id: entryId,
        slug: finalSlug,
        title: title.trim(),
        title_html: titleHtml.trim() || null,
        eyebrow: eyebrow.trim() || null,
        medium,
        venue: venue.trim() || null,
        performed_on: performedOn || null,
        intro: intro.trim() || null,
        pull_quote: pullQuote.trim() || null,
        video_url: videoUrl.trim() || null,
        video_caption: videoCaption.trim() || null,
        is_draft: finalDraft,
        sort_order: 0,
        sections: sections
          .filter((s) => s.label.trim() || s.body.trim())
          .map((s) => ({ label: s.label.trim(), body: s.body.trim() })),
        meta: meta
          .filter((m) => m.label.trim() && m.value.trim())
          .map((m) => ({ label: m.label.trim(), value: m.value.trim() })),
        photos: photos.map((p) => ({ storage_path: p.storage_path, caption: p.caption })),
        audio: audio.map((a) => ({ storage_path: a.storage_path, caption: a.caption })),
      });
      setIsDraft(finalDraft);
      if (publish === "publish") {
        navigate(`/@${profile.handle}/${finalSlug}`);
      } else if (!entryId) {
        navigate(`/edit/${id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const onAddPhotos = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const drafts: MediaDraft[] = [];
    for (const file of Array.from(files)) {
      try {
        const path = await uploadPhoto(user.id, file);
        drafts.push({
          storage_path: path,
          caption: null,
          preview: publicPhotoUrl(path),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    }
    setPhotos((prev) => [...prev, ...drafts]);
  };

  const onAddAudio = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const drafts: MediaDraft[] = [];
    for (const file of Array.from(files)) {
      try {
        const path = await uploadAudio(user.id, file);
        drafts.push({
          storage_path: path,
          caption: null,
          preview: publicAudioUrl(path),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    }
    setAudio((prev) => [...prev, ...drafts]);
  };

  const handleDelete = async () => {
    if (!entryId) return;
    if (!confirm("Delete this entry permanently? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteEntry(entryId);
      navigate(`/@${profile.handle}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  };

  return (
    <main className="editor">
      <div className="editor__head">
        <h1>{entryId ? "edit entry" : "new entry"}</h1>
        <span style={{ fontFamily: "var(--sans)", fontSize: "0.66rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--muted)" }}>
          /@{profile.handle}/{finalSlug}
        </span>
      </div>

      <section className="editor__section">
        <div className="editor__section-head"><span>i — the basics</span></div>
        <label className="field">
          <span className="field__label">title</span>
          <input
            className="input input--display"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Supernova"
          />
          <span className="field__hint">how this entry appears in your index.</span>
        </label>

        <label className="field">
          <span className="field__label">title (with formatting · optional)</span>
          <textarea
            className="textarea"
            style={{ minHeight: 90, fontFamily: "var(--display)", fontStyle: "italic", fontSize: "1.1rem" }}
            value={titleHtml}
            onChange={(e) => setTitleHtml(e.target.value)}
            placeholder={'<em>supernova</em>,<br />or: first night<br />on the floor.'}
          />
          <span className="field__hint">use &lt;em&gt; for italic accents, &lt;br /&gt; for line breaks. Leave blank to use the plain title.</span>
        </label>

        <div className="editor__row editor__row--three">
          <label className="field">
            <span className="field__label">medium</span>
            <select className="select" value={medium} onChange={(e) => setMedium(e.target.value as Medium)}>
              {MEDIA_MEDIUMS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">venue</span>
            <input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="University Cultural Centre" />
          </label>
          <label className="field">
            <span className="field__label">performed on</span>
            <input className="input" type="date" value={performedOn} onChange={(e) => setPerformedOn(e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span className="field__label">eyebrow line</span>
          <input
            className="input"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="dance · hip-hop · funkstyles"
          />
        </label>

        <label className="field">
          <span className="field__label">slug · the URL piece</span>
          <input
            className="input"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
          />
        </label>
      </section>

      <section className="editor__section">
        <div className="editor__section-head"><span>ii — opening paragraph</span></div>
        <label className="field">
          <span className="field__label">intro</span>
          <textarea
            className="textarea"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="The first time I stepped onto the UCC stage I could feel the bass before I heard it…"
          />
        </label>
      </section>

      <section className="editor__section">
        <div className="editor__section-head">
          <span>iii — meta facts</span>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => setMeta((prev) => [...prev, { label: "", value: "" }])}
          >
            + add row
          </button>
        </div>
        {meta.map((m, i) => (
          <div className="editor__row" key={i} style={{ marginBottom: 12 }}>
            <input
              className="input"
              placeholder="label (e.g. crew)"
              value={m.label}
              onChange={(e) => {
                const v = e.target.value;
                setMeta((prev) => prev.map((row, j) => (j === i ? { ...row, label: v } : row)));
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                placeholder="value"
                value={m.value}
                onChange={(e) => {
                  const v = e.target.value;
                  setMeta((prev) => prev.map((row, j) => (j === i ? { ...row, value: v } : row)));
                }}
              />
              <button
                type="button"
                className="btn btn--small btn--ghost"
                onClick={() => setMeta((prev) => prev.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="editor__section">
        <div className="editor__section-head">
          <span>iv — body sections</span>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() =>
              setSections((prev) => [...prev, blankSection(prev.length)])
            }
          >
            + add section
          </button>
        </div>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 22, padding: 18, border: "1px dashed var(--line)", background: "rgba(244,235,207,0.5)" }}>
            <div className="editor__row">
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="field__label">section label</span>
                <input
                  className="input"
                  value={s.label}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSections((prev) => prev.map((row, j) => (j === i ? { ...row, label: v } : row)));
                  }}
                  placeholder="i — the rehearsal"
                />
              </label>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  onClick={() => setSections((prev) => prev.filter((_, j) => j !== i))}
                >
                  remove
                </button>
              </div>
            </div>
            <label className="field" style={{ marginTop: 18, marginBottom: 0 }}>
              <span className="field__label">body</span>
              <textarea
                className="textarea"
                style={{ minHeight: 220 }}
                value={s.body}
                onChange={(e) => {
                  const v = e.target.value;
                  setSections((prev) => prev.map((row, j) => (j === i ? { ...row, body: v } : row)));
                }}
                placeholder="Two paragraphs separated by a blank line. Wrap *italics* in asterisks."
              />
              <span className="field__hint">blank lines split paragraphs. *italics* highlight in accent.</span>
            </label>
          </div>
        ))}
      </section>

      <section className="editor__section">
        <div className="editor__section-head"><span>v — photos</span></div>
        <span className="field__hint" style={{ marginTop: 0, marginBottom: 14 }}>
          uploaded to Supabase Storage. drag the order isn't supported yet — use the × to remove.
        </span>
        <label className="editor__upload">
          <input type="file" accept="image/*" multiple onChange={(e) => onAddPhotos(e.target.files)} />
          + add photos
        </label>
        {photos.length > 0 && (
          <div className="editor__media">
            {photos.map((p, i) => (
              <div className="editor__media-tile" key={p.storage_path}>
                <img src={p.preview} alt="" />
                <input
                  className="caption-input"
                  placeholder="caption"
                  value={p.caption ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPhotos((prev) =>
                      prev.map((row, j) => (j === i ? { ...row, caption: v || null } : row)),
                    );
                  }}
                />
                <button
                  type="button"
                  className="remove-x"
                  onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="editor__section">
        <div className="editor__section-head"><span>vi — audio</span></div>
        <label className="editor__upload">
          <input type="file" accept="audio/*" multiple onChange={(e) => onAddAudio(e.target.files)} />
          + add audio
        </label>
        {audio.length > 0 && (
          <div className="editor__media">
            {audio.map((a, i) => (
              <div className="editor__media-tile" key={a.storage_path} style={{ aspectRatio: "auto", padding: 12, justifyContent: "flex-end" }}>
                <input
                  className="input"
                  placeholder="caption"
                  value={a.caption ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAudio((prev) =>
                      prev.map((row, j) => (j === i ? { ...row, caption: v || null } : row)),
                    );
                  }}
                  style={{ marginBottom: 8 }}
                />
                <audio controls src={a.preview} />
                <button
                  type="button"
                  className="remove-x"
                  onClick={() => setAudio((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="editor__section">
        <div className="editor__section-head"><span>vii — video</span></div>
        <label className="field">
          <span className="field__label">video URL (YouTube or Vimeo)</span>
          <input className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/…" />
        </label>
        <label className="field">
          <span className="field__label">video caption</span>
          <input className="input" value={videoCaption} onChange={(e) => setVideoCaption(e.target.value)} placeholder="full set · UCC" />
        </label>
      </section>

      <section className="editor__section">
        <div className="editor__section-head"><span>viii — pull quote</span></div>
        <label className="field">
          <span className="field__label">a single line that should land</span>
          <textarea
            className="textarea"
            value={pullQuote}
            onChange={(e) => setPullQuote(e.target.value)}
            placeholder="halfway through, I stopped counting and started listening…"
          />
        </label>
      </section>

      <div className="toggle-row">
        <input
          id="is-draft"
          type="checkbox"
          checked={isDraft}
          onChange={(e) => setIsDraft(e.target.checked)}
        />
        <label htmlFor="is-draft">private draft</label>
        <span className="field__hint">drafts are visible only when you're signed in.</span>
      </div>

      <div className="editor__sticky">
        <div style={{ fontFamily: "var(--sans)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--muted)" }}>
          {entryId ? "editing" : "new"} · /@{profile.handle}/{finalSlug}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {error && <span className="auth__error" style={{ margin: 0 }}>{error}</span>}
          {entryId && (
            <button
              type="button"
              className="btn btn--small btn--danger"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "deleting…" : "delete"}
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={saving}
            onClick={() => handleSave("draft")}
          >
            save as draft
          </button>
          <button
            type="button"
            className="btn btn--accent"
            disabled={saving}
            onClick={() => handleSave("publish")}
          >
            {saving ? "saving…" : entryId ? "save & view" : "publish →"}
          </button>
        </div>
      </div>
    </main>
  );
}
