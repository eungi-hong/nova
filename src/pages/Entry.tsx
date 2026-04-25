import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PhotoSlot } from "../components/PhotoSlot";
import { useAuth } from "../lib/auth";
import {
  getEntriesForProfile,
  getFullEntry,
  publicAudioUrl,
  publicPhotoUrl,
} from "../lib/api";
import type { EntryRow, FullEntry } from "../lib/types";
import { formatDay, num, youtubeEmbed } from "../lib/util";
import { NotFound } from "./NotFound";

export function Entry() {
  const { handlePath = "", slug = "" } = useParams();
  const handle = handlePath.startsWith("@") ? handlePath.slice(1) : "";
  const { user } = useAuth();
  const [data, setData] = useState<FullEntry | null>(null);
  const [siblings, setSiblings] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const full = await getFullEntry(handle, slug);
      if (cancelled) return;
      setData(full);
      if (full) {
        const sibs = await getEntriesForProfile(full.profile.id, user?.id === full.profile.id);
        if (!cancelled) setSiblings(sibs);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [handle, slug, user?.id]);

  if (!handle) return <NotFound />;

  if (loading) {
    return (
      <main className="page">
        <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", letterSpacing: "0.24em", textTransform: "uppercase", fontSize: "0.7rem" }}>
          loading…
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <h1 className="cover__title">entry not found.</h1>
        <p className="cover__lede" style={{ marginTop: 32 }}>
          <Link to={`/@${handle}`} style={{ color: "var(--accent)" }}>← back to /@{handle}</Link>
        </p>
      </main>
    );
  }

  const { entry, profile, sections, meta, photos, audio } = data;
  const isOwner = user?.id === profile.id;
  const visible = siblings.filter((s) => isOwner || !s.is_draft);
  const idx = visible.findIndex((s) => s.id === entry.id);
  const total = visible.length;
  const prev = visible[idx - 1] ?? null;
  const next = visible[idx + 1] ?? null;
  const embed = entry.video_url ? youtubeEmbed(entry.video_url) : null;

  return (
    <>
      {isOwner && (
        <div className="owner-bar">
          {entry.is_draft && <span className="owner-bar__draft">· private draft</span>}
          <Link to={`/edit/${entry.id}`} className="btn btn--small btn--ghost">edit</Link>
          <Link to={`/@${profile.handle}`} className="btn btn--small btn--ghost">all entries</Link>
        </div>
      )}
      <main className="page">
        <section className="grid">
          <p className="post-eyebrow reveal">{entry.eyebrow || `${entry.medium} · ${profile.display_name || profile.handle}`}</p>
          <h1
            className="post-title reveal"
            dangerouslySetInnerHTML={{ __html: entry.title_html || escapeHtml(entry.title) }}
          />
          {meta.length > 0 && (
            <div className="post-meta reveal">
              {meta.map((m) => (
                <span key={m.id}>
                  {m.label}{" "}
                  <strong>{m.value}</strong>
                </span>
              ))}
              {meta.find((m) => m.label.toLowerCase() === "date") ? null : entry.performed_on && (
                <span>
                  date <strong>{formatDay(entry.performed_on)}</strong>
                </span>
              )}
            </div>
          )}
          {entry.intro && <p className="post-intro reveal">{entry.intro}</p>}
        </section>

        {sections.map((section) => (
          <section className="section-row" key={section.id}>
            <p className="section-label reveal">{section.label}</p>
            <div className="section-body reveal">
              {section.body
                .split(/\n{2,}/)
                .map((para, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: inlineHtml(para) }} />
                ))}
            </div>
          </section>
        ))}

        {audio.length > 0 && (
          <section className="grid" style={{ marginBottom: 64 }}>
            {audio.map((a) => (
              <figure className="audio-row reveal" key={a.id}>
                {a.caption && <figcaption>{a.caption}</figcaption>}
                <audio controls src={publicAudioUrl(a.storage_path)} />
              </figure>
            ))}
          </section>
        )}

        {photos.length > 0 && (
          <section className="photo-grid">
            {photos.map((p, i) => (
              <figure className="reveal" key={p.id}>
                <PhotoSlot
                  label={`photo ${num(i + 1)}${i === 0 ? " · hero" : ""}`}
                  src={publicPhotoUrl(p.storage_path)}
                  className={`photo-slot--${String.fromCharCode(97 + (i % 4))}`}
                  alt={p.caption ?? ""}
                />
                {p.caption && <figcaption className="caption">{p.caption}</figcaption>}
              </figure>
            ))}
          </section>
        )}

        {entry.pull_quote && (
          <blockquote className="pull-quote reveal">
            <q>{entry.pull_quote}</q>
          </blockquote>
        )}

        {entry.video_url && (
          <figure className="reveal">
            <div className="video-slot">
              {embed ? (
                <iframe
                  src={embed}
                  title="performance video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : null}
            </div>
            {entry.video_caption && <figcaption className="caption">{entry.video_caption}</figcaption>}
          </figure>
        )}

        <nav className="post-nav">
          <Link to={prev ? `/@${profile.handle}/${prev.slug}` : `/@${profile.handle}`} className="prev">
            <div className="post-nav__kicker" dangerouslySetInnerHTML={{ __html: prev ? `${num(idx)} — previously` : "← back to" }} />
            <div
              className="post-nav__title"
              dangerouslySetInnerHTML={{ __html: prev ? prev.title_html || escapeHtml(prev.title) : `<em>the index</em>` }}
            />
          </Link>
          <Link to={next ? `/@${profile.handle}/${next.slug}` : `/@${profile.handle}`} className="next">
            <div className="post-nav__kicker" dangerouslySetInnerHTML={{ __html: next ? `${num(idx + 2)} — next` : "↑ back to" }} />
            <div
              className="post-nav__title"
              dangerouslySetInnerHTML={{ __html: next ? next.title_html || escapeHtml(next.title) : `<em>the index</em>` }}
            />
          </Link>
        </nav>

        <div className="folio">
          <span>p. {num(idx + 1)} / {num(total)}</span>
          <span>{profile.handle} · {entry.medium}</span>
        </div>
      </main>
    </>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineHtml(s: string): string {
  return escapeHtml(s)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}
