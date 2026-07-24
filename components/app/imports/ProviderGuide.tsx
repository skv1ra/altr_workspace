import {
  Bot,
  FileText,
  Hash,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import type { ImportPlatform } from "@/lib/imports/types";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./ProviderGuide.module.css";

export interface ProviderGuideProps {
  platform: ImportPlatform;
  onSelect: (platform: ImportPlatform) => void;
  lang: Lang;
  disabled?: boolean;
}

/**
 * Small monochrome marks only (this prompt's own visual requirement) —
 * generic `lucide-react` glyphs, never a provider's actual brand logo (no
 * such asset exists in this workspace, and using one would be a trademark
 * concern this app has no license to take on).
 */
const ICONS: Record<ImportPlatform, typeof Send> = {
  telegram: Send,
  gmail: Mail,
  whatsapp: MessageCircle,
  instagram: ImageIcon,
  messenger: MessageSquare,
  slack: Hash,
  discord: Bot,
  manual: FileText,
};

const PLATFORMS: ImportPlatform[] = ["telegram", "gmail", "whatsapp", "instagram", "messenger", "slack", "discord", "manual"];

/**
 * Editorial provider list + the selected provider's own export guidance.
 * Every step below was written only after reading `lib/imports/parsers.ts`
 * in full (must-not-change) to confirm what each platform's branch
 * actually accepts — Telegram/Instagram/Messenger have bespoke JSON
 * parsing, WhatsApp has a bespoke `.txt` line format, Gmail expects
 * `.mbox`, and Slack/Discord/Manual have no bespoke branch at all (they
 * fall through to the same generic JSON/CSV/TXT candidate detection any
 * unrecognized platform gets) — their guidance is phrased honestly around
 * that generic handling rather than claiming bespoke fidelity Altr doesn't
 * have. Every step names only each provider's own official export/data-
 * request tool, never a workaround or third-party scraper (this prompt's
 * own "must not tell users to bypass provider export safeguards"
 * requirement).
 */
export function ProviderGuide({ platform, onSelect, lang, disabled = false }: ProviderGuideProps) {
  const t = getSharedCopy(lang).imports;

  return (
    <div>
      <p className={styles.heading}>{t.providerHeading}</p>
      <div className={styles.list} role="radiogroup" aria-label={t.providerHeading}>
        {PLATFORMS.map((item) => {
          const Icon = ICONS[item];
          const active = item === platform;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onSelect(item)}
              className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
            >
              <Icon aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
              <span>{t.providers[item].label}</span>
            </button>
          );
        })}
      </div>

      <ol className={styles.steps}>
        {t.providers[platform].steps.map((step, index) => (
          <li key={index} className={styles.step}>
            <span className={styles.stepIndex}>{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
