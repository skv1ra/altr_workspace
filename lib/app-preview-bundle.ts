import fs from "node:fs";
import path from "node:path";

let cachedHtml: string | null = null;

function readBundle(): string {
  if (cachedHtml !== null) return cachedHtml;
  const filePath = path.join(process.cwd(), "content/app-preview-bundle/deploy-index.html");
  cachedHtml = fs.readFileSync(filePath, "utf8");
  return cachedHtml;
}

/**
 * Renders the `/app-preview` design exactly as exported from Claude Design
 * (`content/app-preview-bundle/deploy-index.html`), same self-contained
 * bundler format as `lib/homepage-bundle.ts` (see that file for why this
 * needs a Route Handler, a CSP nonce, and `'strict-dynamic'`/`'unsafe-eval'`
 * scoped to its path in `middleware.ts`).
 */
export function renderAppPreviewBundle(nonce: string): string {
  const html = readBundle();
  const withNonce = html.replace("<script>", `<script nonce="${nonce}">`);
  const titleFix = `<script nonce="${nonce}">(function(){function setTitle(){if(document.title!=="Altr")document.title="Altr";}setTitle();new MutationObserver(setTitle).observe(document.documentElement,{childList:true,subtree:true});var n=0;var t=setInterval(function(){setTitle();if(++n>20)clearInterval(t);},250);})();</script>`;
  return withNonce.replace("</body>", `${titleFix}</body>`);
}
