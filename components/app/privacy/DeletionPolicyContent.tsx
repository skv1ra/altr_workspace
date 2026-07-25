"use client";

import Link from "next/link";
import { Prose } from "@/components/ui/Text";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { getDeletionContent } from "@/lib/legal/deletion-content";
import type { LegalBlock } from "@/lib/legal/types";

/**
 * A self-contained renderer for `lib/legal/deletion-content.ts`
 * (must-not-change content) — deliberately not extending the shared
 * `components/legal/LegalDocumentPage.tsx` (used by the three live
 * `/privacy`, `/terms`, `/cookies` routes and outside this prompt's own
 * allowed-files list), so this new route can render real content without
 * risking that shared component's existing behavior. Simpler than that
 * component on purpose (no sidebar table of contents, no print button) —
 * a deliberate, documented scope-down, not an oversight.
 *
 * One honest, unresolved finding from reading this content directly: it
 * still describes "a browser-only prototype" whose "deletion tool ...
 * cannot prove deletion from a future production database ... until
 * those systems are implemented" — stale from before Prompt 004's real
 * backend port. `lib/legal/**` content is must-not-change for this
 * prompt, so it renders verbatim, exactly as read; see RISKS.md.
 */
function renderBlock(block: LegalBlock, key: number) {
  if (block.type === "paragraph") return <p key={key}>{block.text}</p>;
  if (block.type === "note")
    return (
      <aside key={key} className="rounded-xl border border-[var(--edge-hairline)] p-4 text-label normal-case text-text-muted">
        {block.text}
      </aside>
    );
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag key={key} className="list-disc space-y-1 pl-5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Tag>
    );
  }
  return (
    <div key={key} className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            {block.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DeletionPolicyContent() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).legalPage;
  const content = getDeletionContent(lang === "UA" ? "UA" : "EN");

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <Link href="/" className="text-label text-text-muted underline underline-offset-2">
        {t.back}
      </Link>
      <p className="mt-6 text-label uppercase text-text-muted">{content.eyebrow}</p>
      <h1 className="mt-4 text-h1 font-normal text-text-primary">{content.title}</h1>
      <p className="mt-2 text-label text-text-muted">
        {t.version} {content.version} · {t.updated}: {content.lastUpdated}
      </p>

      <Prose as="div" className="mt-8">
        {content.intro.map((block, index) => renderBlock(block, index))}
        {content.sections.map((section) => (
          <section key={section.id} id={section.id} className="mt-8">
            <h2 className="text-h3 font-normal text-text-primary">{section.heading}</h2>
            <div className="mt-3 space-y-3">{section.blocks.map((block, index) => renderBlock(block, index))}</div>
          </section>
        ))}
      </Prose>
    </article>
  );
}
