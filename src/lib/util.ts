export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";

export const formatMonth = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleString("en-GB", { month: "short", year: "numeric" })
    .toLowerCase()
    .replace(" ", " · ");
};

export const formatDay = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toLowerCase();
};

export const num = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const ENTRY_COLORS = ["var(--accent)", "var(--accent-2)", "var(--accent-4)", "var(--accent-3)", "var(--accent-5)"];
export const colorFor = (i: number) => ENTRY_COLORS[i % ENTRY_COLORS.length];

export const youtubeEmbed = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
};
