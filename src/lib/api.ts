import { AUDIO_BUCKET, PHOTO_BUCKET, supabase } from "./supabase";
import type {
  EntryAudio,
  EntryMeta,
  EntryPhoto,
  EntryRow,
  EntrySection,
  FullEntry,
  Profile,
} from "./types";

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function getEntriesForProfile(
  profileId: string,
  includeDrafts: boolean,
): Promise<EntryRow[]> {
  let query = supabase.from("entries").select("*").eq("user_id", profileId);
  if (!includeDrafts) query = query.eq("is_draft", false);
  const { data } = await query.order("sort_order", { ascending: true });
  return (data as EntryRow[] | null) ?? [];
}

export async function getFullEntry(handle: string, slug: string): Promise<FullEntry | null> {
  const profile = await getProfileByHandle(handle);
  if (!profile) return null;
  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();
  if (!entry) return null;
  const e = entry as EntryRow;
  const [{ data: sections }, { data: meta }, { data: photos }, { data: audio }] = await Promise.all([
    supabase.from("entry_sections").select("*").eq("entry_id", e.id).order("position"),
    supabase.from("entry_meta").select("*").eq("entry_id", e.id).order("position"),
    supabase.from("entry_photos").select("*").eq("entry_id", e.id).order("position"),
    supabase.from("entry_audio").select("*").eq("entry_id", e.id).order("position"),
  ]);
  return {
    entry: e,
    profile,
    sections: (sections as EntrySection[] | null) ?? [],
    meta: (meta as EntryMeta[] | null) ?? [],
    photos: (photos as EntryPhoto[] | null) ?? [],
    audio: (audio as EntryAudio[] | null) ?? [],
  };
}

export async function getMyEntry(entryId: string): Promise<FullEntry | null> {
  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry) return null;
  const e = entry as EntryRow;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", e.user_id)
    .maybeSingle();
  const [{ data: sections }, { data: meta }, { data: photos }, { data: audio }] = await Promise.all([
    supabase.from("entry_sections").select("*").eq("entry_id", e.id).order("position"),
    supabase.from("entry_meta").select("*").eq("entry_id", e.id).order("position"),
    supabase.from("entry_photos").select("*").eq("entry_id", e.id).order("position"),
    supabase.from("entry_audio").select("*").eq("entry_id", e.id).order("position"),
  ]);
  return {
    entry: e,
    profile: profile as Profile,
    sections: (sections as EntrySection[] | null) ?? [],
    meta: (meta as EntryMeta[] | null) ?? [],
    photos: (photos as EntryPhoto[] | null) ?? [],
    audio: (audio as EntryAudio[] | null) ?? [],
  };
}

export function publicPhotoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
export function publicAudioUrl(path: string): string {
  return supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function uploadAudio(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "mp3";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function isHandleAvailable(handle: string, excludeUserId?: string): Promise<boolean> {
  const lower = handle.toLowerCase();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", lower)
    .maybeSingle();
  if (!data) return true;
  return excludeUserId ? data.id === excludeUserId : false;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<void> {
  const payload = { ...profile, handle: profile.handle?.toLowerCase() };
  const { error } = await supabase.from("profiles").upsert(payload);
  if (error) throw error;
}

export interface SaveEntryInput {
  id?: string;
  slug: string;
  title: string;
  title_html: string | null;
  eyebrow: string | null;
  medium: EntryRow["medium"];
  venue: string | null;
  performed_on: string | null;
  intro: string | null;
  pull_quote: string | null;
  video_url: string | null;
  video_caption: string | null;
  is_draft: boolean;
  sort_order: number;
  sections: { label: string; body: string }[];
  meta: { label: string; value: string }[];
  photos: { storage_path: string; caption: string | null }[];
  audio: { storage_path: string; caption: string | null }[];
}

export async function saveEntry(userId: string, input: SaveEntryInput): Promise<string> {
  const entryPayload = {
    user_id: userId,
    slug: input.slug,
    title: input.title,
    title_html: input.title_html,
    eyebrow: input.eyebrow,
    medium: input.medium,
    venue: input.venue,
    performed_on: input.performed_on,
    intro: input.intro,
    pull_quote: input.pull_quote,
    video_url: input.video_url,
    video_caption: input.video_caption,
    is_draft: input.is_draft,
    sort_order: input.sort_order,
  };

  let entryId = input.id;
  if (entryId) {
    const { error } = await supabase.from("entries").update(entryPayload).eq("id", entryId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("entries")
      .insert(entryPayload)
      .select("id")
      .single();
    if (error) throw error;
    entryId = (data as { id: string }).id;
  }

  await Promise.all([
    supabase.from("entry_sections").delete().eq("entry_id", entryId),
    supabase.from("entry_meta").delete().eq("entry_id", entryId),
    supabase.from("entry_photos").delete().eq("entry_id", entryId),
    supabase.from("entry_audio").delete().eq("entry_id", entryId),
  ]);

  const sectionRows = input.sections.map((s, i) => ({
    entry_id: entryId,
    label: s.label,
    body: s.body,
    position: i,
  }));
  const metaRows = input.meta.map((m, i) => ({
    entry_id: entryId,
    label: m.label,
    value: m.value,
    position: i,
  }));
  const photoRows = input.photos.map((p, i) => ({
    entry_id: entryId,
    storage_path: p.storage_path,
    caption: p.caption,
    position: i,
  }));
  const audioRows = input.audio.map((a, i) => ({
    entry_id: entryId,
    storage_path: a.storage_path,
    caption: a.caption,
    position: i,
  }));

  await Promise.all([
    sectionRows.length ? supabase.from("entry_sections").insert(sectionRows) : Promise.resolve(),
    metaRows.length ? supabase.from("entry_meta").insert(metaRows) : Promise.resolve(),
    photoRows.length ? supabase.from("entry_photos").insert(photoRows) : Promise.resolve(),
    audioRows.length ? supabase.from("entry_audio").insert(audioRows) : Promise.resolve(),
  ]);

  return entryId!;
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", entryId);
  if (error) throw error;
}
