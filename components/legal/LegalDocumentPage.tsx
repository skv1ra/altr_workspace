"use client";

import Link from "next/link";
import { FileText, Printer } from "lucide-react";
import { Fragment, useMemo, type ReactNode } from "react";
import { Prose } from "@/components/ui/Text";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { getCookiesContent } from "@/lib/legal/cookies-content";
import { getMissingLegalConfigKeys, hasMissingLegalConfig } from "@/lib/legal/legal-config";
import { getPrivacyContent } from "@/lib/legal/privacy-content";
import { getTermsContent } from "@/lib/legal/terms-content";
import type { LegalBlock, LegalDocument } from "@/lib/legal/types";
import styles from "./LegalDocumentPage.module.css";

export type LegalPageKind = "privacy" | "terms" | "cookies";

function resolveDocument(kind: LegalPageKind, lang: "EN" | "UA"): LegalDocument {
  if (kind === "privacy") return getPrivacyContent(lang);
  if (kind === "terms") return getTermsContent(lang);
  return getCookiesContent(lang);
}

/** Auto-linkifies `/privacy`, `/terms`, `/cookies` mentions and email addresses inside legal prose — matches LEGACY's own `LegalDocumentPage` behavior. */
function inline(text: string): ReactNode {
  const pattern = /(\/(?:privacy|terms|cookies)\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  return text.split(pattern).map((part, index) => {
    if (/^\/(privacy|terms|cookies)\b/.test(part)) {
      return (
        <Link key={`${part}-${index}`} href={part} className={styles.inlineLink}>
          {part}
        </Link>
      );
    }
    if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(part)) {
      return (
        <a key={`${part}-${index}`} href={`mailto:${part}`} className={styles.inlineLink}>
          {part}
        </a>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (block.type === "paragraph") return <p>{inline(block.text)}</p>;
  if (block.type === "note") {
    return (
      <aside className={styles.note}>
        <p>{inline(block.text)}</p>
      </aside>
    );
  }
  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag>
        {block.items.map((item, index) => (
          <li key={`${index}-${item}`}>{inline(item)}</li>
        ))}
      </ListTag>
    );
  }
  return (
    <div className={styles.tableWrap}>
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
                <td key={`${rowIndex}-${cellIndex}`}>{inline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Generic legal-document shell (Prompt 024) — renders any of the ported
 * `lib/legal/*-content.ts` documents (content/config themselves are
 * out of scope and untouched). Uses the shared `useLang()` hook rather
 * than LEGACY's own local `useState` + `getStoredLanguage()` effect,
 * since every other bilingual component in this workspace already
 * standardized on that hook (Header, PricingTable, etc.) — same
 * cross-tab/cross-component sync behavior, one less pattern to maintain.
 *
 * Typography is the `Prose` primitive (68ch `--measure-body`) — "read like
 * a well-set book" per this prompt's own visual requirement.
 */
export function LegalDocumentPage({ kind }: { kind: LegalPageKind }) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).legalPage;
  const content = useMemo(() => resolveDocument(kind, lang), [kind, lang]);
  const missing = getMissingLegalConfigKeys();
  const showDevNotice = process.env.NODE_ENV !== "production" && hasMissingLegalConfig();

  return (
    <article className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/" className={styles.back}>
          {t.back}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn btn-secondary">
          <Printer aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
          {t.print}
        </button>
      </div>

      {showDevNotice && (
        <aside className={styles.devNotice}>
          <p className="text-label uppercase text-text-muted">{t.devNoticeTitle}</p>
          <p className="mt-2 text-body text-text-muted">{t.devNoticeBody}</p>
          <p className="mt-2 text-label text-text-muted">
            {t.missingFields}: {missing.join(", ")}
          </p>
        </aside>
      )}

      <header className={styles.hero}>
        <p className="text-label uppercase text-text-muted">{content.eyebrow}</p>
        <h1 className="mt-4 text-h1 font-normal text-text-primary">{content.title}</h1>
        <div className={styles.metaRow}>
          <span className={styles.metaChip}>
            {t.version} {content.version}
          </span>
          {content.effectiveDate && (
            <span className={styles.metaChip}>
              {t.effective}: {content.effectiveDate}
            </span>
          )}
          <span className={styles.metaChip}>
            {t.updated}: {content.lastUpdated}
          </span>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.toc}>
          <details open>
            <summary>
              <FileText aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
              {t.toc}
            </summary>
            <nav>
              {content.sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.heading}
                </a>
              ))}
            </nav>
          </details>
        </aside>

        <Prose as="div" className={styles.article}>
          {content.intro.map((block, index) => (
            <LegalBlockView key={index} block={block} />
          ))}

          {content.sections.map((section, sectionIndex) => (
            <section id={section.id} key={section.id} className={styles.section}>
              <h2>
                <span className="text-label text-text-muted">{String(sectionIndex + 1).padStart(2, "0")}</span>{" "}
                {section.heading}
              </h2>
              {section.blocks.map((block, blockIndex) => (
                <LegalBlockView key={blockIndex} block={block} />
              ))}
            </section>
          ))}
        </Prose>
      </div>

      <p className={styles.ownerReview}>{t.ownerReview}</p>
    </article>
  );
}
