import fs from "node:fs";
import path from "node:path";

let cachedHtml: string | null = null;

function readBundle(): string {
  if (cachedHtml !== null) return cachedHtml;
  const filePath = path.join(process.cwd(), "content/homepage-bundle/deploy-index.html");
  cachedHtml = fs.readFileSync(filePath, "utf8");
  return cachedHtml;
}

/**
 * Renders the homepage exactly as exported from Claude Design
 * (`content/homepage-bundle/deploy-index.html`) — a fully self-contained
 * HTML document (own `<html>`/`<head>`/`<body>`), not reimplemented as
 * React components, so it can't drift from what was actually designed.
 * Served from a Route Handler rather than a page component specifically
 * *because* it's self-contained: its own bootstrap `<script>` unpacks the
 * rest of the page by mutating the DOM at runtime (replacing the loading
 * placeholder), which conflicts with React's hydration reconciliation if
 * rendered inside the normal page tree (tried first — produced permanent
 * hydration-mismatch errors). A Route Handler returns the document as
 * plain HTML with no React runtime attached to it at all, avoiding that
 * conflict entirely.
 *
 * The bootstrap script is the bundle's only real executable `<script>`
 * (the rest are `type="__bundler/..."` data islands, inert regardless of
 * nonce) — it needs the request's CSP nonce to run, and `middleware.ts`
 * adds `'strict-dynamic'` scoped to `/` so the further `<script>` elements
 * *it* creates while unpacking are trusted too, since those don't carry
 * their own nonce. `indexOf`/`replace` on the literal, attribute-less
 * `<script>` tag is safe because it's always the first such substring in
 * the file — anything with a `type="..."` attribute doesn't match, and the
 * bootstrap script sits at the very start of `<body>`, long before any
 * incidental occurrence deeper in the embedded data.
 *
 * The runtime also wholesale-replaces `<head>` while unpacking (dropping
 * the original `<title>` with nothing to replace it), so a small tab-title
 * fix is appended before `</body>`: set it once, then re-assert on every
 * `<head>` mutation so it survives that replacement.
 */
export function renderHomepageBundle(nonce: string): string {
  const html = readBundle();
  const withAuthLinks = html.replace(
    /<a\b[^>]*href=\\"#auth\\"[^>]*>.*?<\\u002Fa>/g,
    (anchor) =>
      anchor.replace(
        'href=\\"#auth\\"',
        anchor.includes("t.nav.login")
          ? 'href=\\"/auth?mode=login\\"'
          : 'href=\\"/auth?mode=register\\"',
      ),
  );
  const withNonce = withAuthLinks.replace("<script>", `<script nonce="${nonce}">`);
  const titleFix = `<script nonce="${nonce}">(function(){function setTitle(){if(document.title!=="Altr")document.title="Altr";}setTitle();new MutationObserver(setTitle).observe(document.documentElement,{childList:true,subtree:true});var n=0;var t=setInterval(function(){setTitle();if(++n>20)clearInterval(t);},250);})();</script>`;
  return withNonce.replace("</body>", `${titleFix}</body>`);
}
