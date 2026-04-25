import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase, isConfigured } from "../lib/supabase";
import type { Profile } from "../lib/types";

interface DirectoryEntry {
  profile: Profile;
  entry_count: number;
}

export function Home() {
  const { user, profile } = useAuth();
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);

  useEffect(() => {
    if (!isConfigured) return;
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      if (!profiles?.length) return;
      const ids = profiles.map((p) => p.id);
      const { data: counts } = await supabase
        .from("entries")
        .select("user_id")
        .eq("is_draft", false)
        .in("user_id", ids);
      const tally = new Map<string, number>();
      (counts ?? []).forEach((row: { user_id: string }) => {
        tally.set(row.user_id, (tally.get(row.user_id) ?? 0) + 1);
      });
      const result = (profiles as Profile[])
        .map((p) => ({ profile: p, entry_count: tally.get(p.id) ?? 0 }))
        .filter((d) => d.entry_count > 0);
      setDirectory(result);
    })();
  }, []);

  return (
    <main className="home">
      <p className="home__eyebrow reveal">NOVA · for performing artists</p>
      <h1 className="home__title reveal">
        every show<br />
        is over <em>too soon</em>.<br />
        write it down.
      </h1>
      <p className="home__lede reveal">
        NOVA is a small archive for the rehearsal-floor residue, the photos friends sent afterwards, and whatever you can remember before it fades. Music, dance, theatre — log your shows with photos, recordings, and the words you only find on the walk home. Share your diary as a single link.
      </p>

      <div className="home__cta reveal">
        {user && profile ? (
          <>
            <Link to="/new" className="btn btn--accent">+ new entry</Link>
            <Link to={`/@${profile.handle}`} className="btn btn--ghost">view your diary →</Link>
          </>
        ) : user && !profile ? (
          <Link to="/onboarding" className="btn btn--accent">choose your handle →</Link>
        ) : (
          <>
            <Link to="/login" className="btn btn--accent">start your diary →</Link>
            <span className="field__hint" style={{ margin: 0 }}>magic link · no password</span>
          </>
        )}
      </div>

      {directory.length > 0 && (
        <section className="home__directory reveal">
          <h2 className="home__directory-heading">
            <span>the stage</span>
            <span>{directory.length} {directory.length === 1 ? "diary" : "diaries"}</span>
          </h2>
          <ol className="home__directory-list">
            {directory.map(({ profile: p, entry_count }) => (
              <li key={p.id}>
                <Link to={`/@${p.handle}`} className="home__diary-card">
                  <div className="h-handle">@{p.handle} · {entry_count} {entry_count === 1 ? "entry" : "entries"}</div>
                  <div className="h-name">{p.display_name || p.handle}</div>
                  {p.bio && <div className="h-bio">{p.bio}</div>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="page-foot" style={{ maxWidth: "100%" }}>
        <span>NOVA · {new Date().getFullYear()}</span>
        <span>↓ scroll · share via link</span>
      </footer>
    </main>
  );
}
