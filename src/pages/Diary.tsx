import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PhotoSlot } from "../components/PhotoSlot";
import { useAuth } from "../lib/auth";
import {
  getEntriesForProfile,
  getProfileByHandle,
  publicPhotoUrl,
} from "../lib/api";
import { supabase } from "../lib/supabase";
import type { EntryPhoto, EntryRow, Profile } from "../lib/types";
import { colorFor, formatMonth, num } from "../lib/util";
import { NotFound } from "./NotFound";

export function Diary() {
  const { handlePath = "" } = useParams();
  const handle = handlePath.startsWith("@") ? handlePath.slice(1) : "";
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.id === profile?.id;

  useEffect(() => {
    if (!handle) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const p = await getProfileByHandle(handle);
      if (cancelled) return;
      setProfile(p);
      if (!p) {
        setLoading(false);
        return;
      }
      const ents = await getEntriesForProfile(p.id, user?.id === p.id);
      if (cancelled) return;
      setEntries(ents);
      if (p.hero_photo_path) {
        setHeroPhoto(publicPhotoUrl(p.hero_photo_path));
      } else if (ents.length) {
        const { data: photos } = await supabase
          .from("entry_photos")
          .select("*")
          .eq("entry_id", ents[0]!.id)
          .order("position")
          .limit(1);
        const first = (photos as EntryPhoto[] | null)?.[0];
        setHeroPhoto(first ? publicPhotoUrl(first.storage_path) : null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [handle, user?.id]);

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

  if (!profile) {
    return (
      <main className="page">
        <h1 className="cover__title">no diary at <em>@{handle}</em>.</h1>
        <p className="cover__lede" style={{ marginTop: 32 }}>
          The handle <strong>@{handle}</strong> hasn't been claimed yet. <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link> to start your own.
        </p>
      </main>
    );
  }

  const visibleEntries = entries.filter((e) => isOwner || !e.is_draft);
  const displayName = profile.display_name || profile.handle;

  return (
    <main className="page">
      <section className="cover grid">
        <p className="cover__eyebrow reveal">{displayName}'s performance log</p>
        <h1 className="cover__title reveal" dangerouslySetInnerHTML={{
          __html: `welcome to<br /><em>${escapeHtml(displayName.toLowerCase())}'s stage</em>`,
        }} />
        <figure className="cover__hero reveal">
          <PhotoSlot label="hero · curtain call" src={heroPhoto} alt={`${displayName} on stage`} />
          <figcaption className="caption">
            {visibleEntries.length
              ? `${visibleEntries.length} ${visibleEntries.length === 1 ? "entry" : "entries"} · share /@${profile.handle}`
              : "no entries yet"}
          </figcaption>
        </figure>
        <p className="cover__sub reveal">
          a stage<br />diary<br />by @{profile.handle}
        </p>
        <p className="cover__lede reveal">
          {profile.bio ||
            "A small archive of the shows I've been lucky enough to be a part of — not a résumé, not a highlight reel. Just the rehearsal-floor residue, the photos friends sent afterwards, and whatever I can remember before it fades."}
        </p>
      </section>

      <div className="divider grid">
        <span></span>
        <span className="divider__mark">✻</span>
        <span></span>
      </div>

      <section className="index grid">
        <h2 className="index__heading reveal">
          <span>the index</span>
          <span>
            {num(visibleEntries.length)} {visibleEntries.length === 1 ? "entry" : "entries"}
          </span>
        </h2>
        {visibleEntries.length === 0 ? (
          <p className="cover__lede" style={{ gridColumn: "1 / -1", marginTop: 0, borderTop: "1px solid var(--line)", paddingTop: 32 }}>
            {isOwner
              ? "Nothing here yet. "
              : `${displayName} hasn't posted any entries yet. `}
            {isOwner && (
              <Link to="/new" style={{ color: "var(--accent)" }}>
                Add your first entry →
              </Link>
            )}
          </p>
        ) : (
          <ol className="index__list">
            {visibleEntries.map((entry, i) => (
              <li key={entry.id} style={{ ["--entry-color" as string]: colorFor(i) }}>
                <Link className="entry reveal" to={`/@${profile.handle}/${entry.slug}`}>
                  <span className="entry__num">{num(i + 1)}{entry.is_draft ? " · draft" : ""}</span>
                  <span
                    className="entry__title"
                    dangerouslySetInnerHTML={{ __html: entry.title_html || escapeHtml(entry.title) }}
                  />
                  <span className="entry__venue">{entry.venue || entry.medium}</span>
                  <span className="entry__date">{formatMonth(entry.performed_on)}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="page-foot">
        <span>{displayName} · {new Date().getFullYear()}</span>
        <span>↓ scroll · NOVA</span>
      </footer>
    </main>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
