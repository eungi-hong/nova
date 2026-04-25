export type Medium = "dance" | "music" | "theatre" | "voice" | "other";

export interface Profile {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  hero_photo_path: string | null;
  created_at: string;
}

export interface EntryRow {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  title_html: string | null;
  eyebrow: string | null;
  medium: Medium;
  venue: string | null;
  performed_on: string | null;
  intro: string | null;
  pull_quote: string | null;
  video_url: string | null;
  video_caption: string | null;
  is_draft: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EntrySection {
  id: string;
  entry_id: string;
  label: string;
  body: string;
  position: number;
}

export interface EntryMeta {
  id: string;
  entry_id: string;
  label: string;
  value: string;
  position: number;
}

export interface EntryPhoto {
  id: string;
  entry_id: string;
  storage_path: string;
  caption: string | null;
  position: number;
}

export interface EntryAudio {
  id: string;
  entry_id: string;
  storage_path: string;
  caption: string | null;
  position: number;
}

export interface FullEntry {
  entry: EntryRow;
  profile: Profile;
  sections: EntrySection[];
  meta: EntryMeta[];
  photos: EntryPhoto[];
  audio: EntryAudio[];
}
