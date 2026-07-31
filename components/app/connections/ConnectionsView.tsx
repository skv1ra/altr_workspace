"use client";

import {
  Bot,
  Check,
  Clock3,
  Copy,
  Hash,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccountTabs } from "@/components/app/settings/AccountTabs";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { CONNECTION_PROVIDERS, type ConnectionProvider, type ReplyState } from "@/lib/connections";
import { handleSessionExpired } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./ConnectionsView.module.css";

type ProviderSummary = {
  provider: ConnectionProvider;
  connectionId: string | null;
  displayName: string | null;
  status: "connected" | "disconnected" | "error" | "revoked";
  connectedAt: string | null;
  lastSyncedAt: string | null;
  imports: number;
  conversations: number;
  messages: number;
};

type InboxItem = {
  id: string;
  platform: string;
  title: string;
  participants: string[];
  lastMessageAt: string | null;
  latestMessage: {
    id: string;
    senderType: string;
    senderLabel: string | null;
    content: string;
    sentAt: string;
  } | null;
  latestDraft: { id: string; content: string; completedAt: string | null } | null;
  state: ReplyState;
};

type InboxFilter = "all" | ReplyState;

const PROVIDER_ICONS: Record<ConnectionProvider, typeof Send> = {
  telegram: Send,
  gmail: Mail,
  whatsapp: MessageCircle,
  instagram: ImageIcon,
  messenger: MessageSquare,
  slack: Hash,
  discord: Bot,
};

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    handleSessionExpired("/connections");
    throw new Error("AUTH_REQUIRED");
  }
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `REQUEST_FAILED_${response.status}`);
  return body as T;
}

export function ConnectionsView() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).connections;
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      const [providerPayload, inboxPayload] = await Promise.all([
        readJson<{ providers: ProviderSummary[] }>("/api/connections"),
        readJson<{ items: InboxItem[] }>("/api/connections/inbox"),
      ]);
      setProviders(providerPayload.providers);
      setItems(inboxPayload.items);
    } catch (error) {
      if (!(error instanceof Error && error.message === "AUTH_REQUIRED")) setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // The page has one explicit refresh action; avoid an unstable function
    // dependency and perform only the intended first-load request here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => ({
    needsReply: items.filter((item) => item.state === "needs_reply").length,
    draftReady: items.filter((item) => item.state === "draft_ready").length,
    total: items.length,
  }), [items]);

  const visibleItems = filter === "all" ? items : items.filter((item) => item.state === filter);

  async function setReplyState(item: InboxItem, state: "needs_reply" | "snoozed" | "up_to_date") {
    setWorkingId(item.id);
    try {
      const snoozedUntil = state === "snoozed" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
      await readJson(`/api/connections/inbox/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, snoozedUntil }),
      });
      setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, state } : candidate));
      toast.push(state === "snoozed" ? t.snoozedToast : t.updatedToast);
    } catch (error) {
      if (!(error instanceof Error && error.message === "AUTH_REQUIRED")) toast.push(t.actionFailed);
    } finally {
      setWorkingId(null);
    }
  }

  async function generateDraft(item: InboxItem) {
    if (!item.latestMessage) return;
    setWorkingId(item.id);
    try {
      const payload = await readJson<{
        assistantRunId: string;
        draft: string;
        status: "draft";
      }>("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incomingMessage: item.latestMessage.content,
          conversationId: item.id,
          contact: item.latestMessage.senderLabel || item.title,
          requestedLength: "short",
          language: lang === "UA" ? "Ukrainian" : "auto",
        }),
      });
      setItems((current) => current.map((candidate) => candidate.id === item.id ? {
        ...candidate,
        state: "draft_ready",
        latestDraft: { id: payload.assistantRunId, content: payload.draft, completedAt: new Date().toISOString() },
      } : candidate));
      toast.push(t.draftReadyToast);
    } catch (error) {
      if (!(error instanceof Error && error.message === "AUTH_REQUIRED")) toast.push(t.draftFailedToast);
    } finally {
      setWorkingId(null);
    }
  }

  async function copyDraft(item: InboxItem) {
    if (!item.latestDraft) return;
    try {
      await navigator.clipboard.writeText(item.latestDraft.content);
      toast.push(t.copiedToast);
    } catch {
      toast.push(t.copyFailedToast);
    }
  }

  return (
    <div className={styles.wrap}>
      <AccountTabs />
      <p className="v3-eyebrow">{t.eyebrow}</p>
      <div className={styles.titleRow}>
        <div>
          <h1 className="v3-h1">{t.heading}</h1>
          <p className="v3-intro">{t.intro}</p>
        </div>
        <Button variant="secondary" onClick={() => void load()} loading={loading}>
          <RefreshCw aria-hidden="true" width={15} height={15} />
          {t.refresh}
        </Button>
      </div>

      <section className={styles.section} aria-labelledby="connection-sources-heading">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="connection-sources-heading" className="v3-h2">{t.sourcesHeading}</h2>
            <p className={styles.sectionBody}>{t.sourcesBody}</p>
          </div>
        </div>
        <div className={styles.providerGrid}>
          {CONNECTION_PROVIDERS.map((provider) => {
            const summary = providers.find((item) => item.provider === provider);
            const Icon = PROVIDER_ICONS[provider];
            const connected = summary?.status === "connected";
            return (
              <article key={provider} className={`v3-panel ${styles.providerCard}`}>
                <div className={styles.providerTop}>
                  <span className={styles.providerIcon}><Icon aria-hidden="true" width={18} height={18} /></span>
                  <span className={connected ? styles.statusConnected : styles.statusMuted}>
                    {connected ? t.connected : summary?.imports ? t.imported : t.notConnected}
                  </span>
                </div>
                <h3 className={styles.providerName}>{t.providers[provider]}</h3>
                <p className={styles.providerMeta}>
                  {summary?.messages ? `${summary.messages.toLocaleString()} ${t.messages}` : t.noData}
                </p>
                <Link href={`/import-conversations?provider=${provider}`} className={styles.providerAction}>
                  {summary?.imports ? t.importMore : t.importMessages}
                </Link>
              </article>
            );
          })}
        </div>
        <p className={styles.liveSyncNote}>{t.liveSyncNote}</p>
      </section>

      <section className={styles.section} aria-labelledby="reply-queue-heading">
        <div className={styles.queueHeader}>
          <div>
            <h2 id="reply-queue-heading" className="v3-h2">{t.queueHeading}</h2>
            <p className={styles.sectionBody}>{t.queueBody}</p>
          </div>
          <div className={styles.summary} aria-label={t.queueSummaryLabel}>
            <span><strong>{counts.needsReply}</strong>{t.needsReply}</span>
            <span><strong>{counts.draftReady}</strong>{t.draftReady}</span>
            <span><strong>{counts.total}</strong>{t.total}</span>
          </div>
        </div>

        <div className={styles.filters} role="group" aria-label={t.filterLabel}>
          {(["all", "needs_reply", "draft_ready", "snoozed", "up_to_date"] as InboxFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              className="v3-chip"
              data-active={filter === value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {t.filters[value]}
            </button>
          ))}
        </div>

        {failed ? (
          <div className={`v3-panel ${styles.empty}`} role="alert">
            <p>{t.loadFailed}</p>
            <Button variant="secondary" onClick={() => void load()}>{t.retry}</Button>
          </div>
        ) : loading ? (
          <div className={`v3-panel ${styles.empty}`} aria-busy="true">{t.loading}</div>
        ) : visibleItems.length === 0 ? (
          <div className={`v3-panel ${styles.empty}`}>
            <p>{items.length ? t.filterEmpty : t.empty}</p>
            {!items.length && <Link className="btn btn-secondary control-focus" href="/import-conversations">{t.emptyCta}</Link>}
          </div>
        ) : (
          <div className={styles.queueList}>
            {visibleItems.map((item) => (
              <ConversationCard
                key={item.id}
                item={item}
                lang={lang}
                labels={t}
                busy={workingId === item.id}
                onGenerate={() => void generateDraft(item)}
                onCopy={() => void copyDraft(item)}
                onMarkReplied={() => void setReplyState(item, "up_to_date")}
                onSnooze={() => void setReplyState(item, "snoozed")}
                onReopen={() => void setReplyState(item, "needs_reply")}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ConversationCard({
  item,
  lang,
  labels,
  busy,
  onGenerate,
  onCopy,
  onMarkReplied,
  onSnooze,
  onReopen,
}: {
  item: InboxItem;
  lang: "EN" | "UA";
  labels: ReturnType<typeof getSharedCopy>["connections"];
  busy: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onMarkReplied: () => void;
  onSnooze: () => void;
  onReopen: () => void;
}) {
  const stateIcon = item.state === "needs_reply" ? MessageCircle : item.state === "draft_ready" ? Sparkles : item.state === "snoozed" ? Clock3 : Check;
  const StateIcon = stateIcon;
  const date = item.lastMessageAt
    ? new Intl.DateTimeFormat(lang === "UA" ? "uk-UA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastMessageAt))
    : labels.unknownDate;

  return (
    <article className={`v3-panel ${styles.conversation}`}>
      <div className={styles.conversationTop}>
        <div className={styles.conversationIdentity}>
          <span className={styles.platform}>{item.platform}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{date}</p>
          </div>
        </div>
        <span className={styles.replyState} data-state={item.state}>
          <StateIcon aria-hidden="true" width={14} height={14} />
          {labels.states[item.state]}
        </span>
      </div>

      {item.latestMessage && (
        <div className={styles.messagePreview}>
          <span>{item.latestMessage.senderLabel || labels.unknownContact}</span>
          <p>{item.latestMessage.content}</p>
        </div>
      )}

      {item.latestDraft && (
        <div className={styles.draftBox}>
          <span>{labels.draftLabel}</span>
          <p>{item.latestDraft.content}</p>
        </div>
      )}

      <div className={styles.actions}>
        {item.latestDraft ? (
          <Button variant="secondary" onClick={onCopy} disabled={busy}>
            <Copy aria-hidden="true" width={14} height={14} />
            {labels.copyDraft}
          </Button>
        ) : (
          <Button variant="secondary" onClick={onGenerate} loading={busy} disabled={!item.latestMessage}>
            <Sparkles aria-hidden="true" width={14} height={14} />
            {labels.generateDraft}
          </Button>
        )}
        {item.state === "up_to_date" ? (
          <button type="button" className="v3-btn-quiet" onClick={onReopen} disabled={busy}>{labels.markNeedsReply}</button>
        ) : (
          <button type="button" className="v3-btn-quiet" onClick={onMarkReplied} disabled={busy}>{labels.markReplied}</button>
        )}
        {item.state !== "snoozed" && (
          <button type="button" className="v3-btn-quiet" onClick={onSnooze} disabled={busy}>{labels.snooze}</button>
        )}
      </div>
    </article>
  );
}
