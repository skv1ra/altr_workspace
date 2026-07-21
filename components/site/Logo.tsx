import Link from "next/link";

/**
 * Small dark shard-glyph wordmark (Prompt 019). An original, hand-authored
 * SVG in the same visual family as the hero shards (`components/hero/`) —
 * a faceted glass silhouette, not a literal reuse of any hero raster asset
 * (those are large, JPEG/PNG-detailed reference-quality renders, entirely
 * wrong weight/format for a 20px header mark). Two flat facets (obsidian +
 * a lighter graphite-silver gradient) reads as "cut glass" at this size the
 * same way the hero shards' own faceted-edge language does, just reduced to
 * the two planes that actually survive at 20px.
 *
 * Links home (`/`) — this is the one non-anchor, non-auth link in the
 * header that always goes to the same place regardless of session state.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Altr home"
      className={`inline-flex items-center gap-2.5 text-body font-medium text-altr-obsidian ${className}`}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="20"
        viewBox="0 0 18 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9 0L1 18H9V0Z" className="fill-altr-obsidian" />
        <path d="M9 0L17 18H9V0Z" fill="url(#altr-logo-facet)" />
        <defs>
          <linearGradient id="altr-logo-facet" x1="9" y1="0" x2="17" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--altr-silver)" />
            <stop offset="1" stopColor="var(--altr-graphite)" />
          </linearGradient>
        </defs>
      </svg>
      <span>Altr</span>
    </Link>
  );
}
