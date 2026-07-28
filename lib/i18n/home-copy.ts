export const homeCopy = {
  EN: {
    eyebrow: "Personal AI activation interface",
    heroTitle: "Your digital self is being activated.",
    heroSubtitle: "Altr learns from the way you write, decide and communicate — then turns your communication patterns into a private intelligence layer.",
    cta: "Create Your Second Self",
    secondary: "View Learning System",
    statA: "Private tone model",
    statB: "Conversation memory",
    statC: "Context routing",
    cards: [
      ["How it works", "Connect your workflow.", "Altr reads the patterns across your chats, email and work context — then builds a live model of how you respond."],
      ["Memory", "Context that stays with you.", "People, tasks, decisions and conversations become a connected memory layer that follows your work."],
      ["Vision", "Not another assistant.", "A personal intelligence system that grows around your behavior until it can act as your digital second self."],
    ],
    featureTitle: "A quiet system for human patterns.",
    featureBody: "Every panel is a part of one private AI system: communication, memory, context and action.",
    features: ["Tone fingerprint", "Decision memory", "Client context", "Email continuity", "Team workflows", "Autonomous drafts"],
    finalEyebrow: "Final activation",
    finalTitle: "Your routine is not your identity.",
    finalSubtitle: "Let Altr handle the patterns — so you can focus on what matters.",
    openMemory: "Open Memory",
    openAssistants: "Open Assistants",
    footer: { product: "Product", how: "How it works", memory: "Memory", vision: "Vision", privacy: "Privacy", terms: "Terms", cookies: "Cookies", deletion: "Data deletion", status: "Systems available" },
  },
  UA: {
    eyebrow: "Інтерфейс активації персонального AI",
    heroTitle: "Твоя цифрова версія активується.",
    heroSubtitle: "Altr вчиться з того, як ти пишеш, ухвалюєш рішення і спілкуєшся, а потім перетворює ці патерни на приватний інтелектуальний шар.",
    cta: "Створити другого себе",
    secondary: "Показати систему навчання",
    statA: "Приватна модель тону",
    statB: "Памʼять переписок",
    statC: "Контекстні відповіді",
    cards: [
      ["Як це працює", "Підключи свій робочий контекст.", "Altr аналізує дозволені чати, пошту та робочий контекст і будує модель того, як ти відповідаєш."],
      ["Памʼять", "Контекст, який залишається з тобою.", "Люди, завдання, рішення та переписки стають повʼязаним шаром памʼяті навколо твоєї роботи."],
      ["Візія", "Не просто ще один асистент.", "Персональна AI-система, яка розвивається навколо твоєї поведінки та допомагає діяти як твоя цифрова версія."],
    ],
    featureTitle: "Тиха система для людських патернів.",
    featureBody: "Кожна панель — частина однієї приватної AI-системи: комунікація, памʼять, контекст і дія.",
    features: ["Відбиток тону", "Памʼять рішень", "Контекст клієнтів", "Безперервність email", "Командні процеси", "Чернетки відповідей"],
    finalEyebrow: "Фінальна активація",
    finalTitle: "Твоя рутина — це не твоя особистість.",
    finalSubtitle: "Дозволь Altr взяти на себе повторювані патерни, щоб ти міг зосередитися на важливому.",
    openMemory: "Відкрити памʼять",
    openAssistants: "Відкрити асистентів",
    footer: { product: "Продукт", how: "Як працює", memory: "Памʼять", vision: "Візія", privacy: "Приватність", terms: "Умови", cookies: "Cookie", deletion: "Видалення даних", status: "Системи доступні" },
  },
} as const;

/**
 * `#product` section (Prompt 020) — a new, self-contained export rather
 * than folded into `homeCopy` above: `homeCopy`'s existing EN/UA shape
 * (cards/features/final CTA/footer) is legacy "Second Self" copy that was
 * never actually rendered by LEGACY's real `app/page.tsx` (which has its
 * own separate inline `copy` object — verified directly against the
 * LEGACY checkout) and isn't used anywhere in this workspace either
 * (`grep`-confirmed) — dead weight this prompt didn't create and isn't
 * scoped to clean up, but also the wrong shape/voice to extend for new,
 * truthful copy about what's actually implemented today.
 *
 * Truthful to FEATURE_PARITY_MATRIX's "Roadmap only" list: imports are
 * user-supplied exported conversation files (`lib/imports/parsers.ts`
 * handles WhatsApp/Telegram/Instagram/Messenger export formats), not live
 * OAuth/API sync (Gmail, live Telegram/WhatsApp/Meta sync are explicitly
 * roadmap-only); drafts are proposals the user reviews before sending
 * (`app/api/ai/draft-reply`), never autonomous action.
 */
export const productCopy = {
  EN: {
    eyebrow: "01 — Product",
    title: "Your history becomes memory. Memory becomes your voice.",
    body: "Import the conversations you already have — exported chats, messages, decisions — and Altr turns them into a private memory layer: who you talk to, how you actually write, what you've already decided. When a reply is needed, your Twin drafts one in your own voice, grounded in that memory, for you to review before anything is sent.",
    beats: [
      { label: "Import", body: "Bring your own exported conversation history." },
      { label: "Memory", body: "Altr connects people, decisions, and phrasing into context that stays with you." },
      { label: "Drafts", body: "Your Twin proposes a reply in your voice — you approve before it's sent." },
    ],
    fragmentKicker: "MEMORY",
    fragmentLine: "not a chatbot",
  },
  UA: {
    eyebrow: "01 — Продукт",
    title: "Твоя історія стає памʼяттю. Памʼять стає твоїм голосом.",
    body: "Імпортуй розмови, які в тебе вже є, — експортовані чати, повідомлення, рішення, — і Altr перетворює їх на приватний шар памʼяті: з ким ти спілкуєшся, як насправді пишеш, що вже вирішив. Коли потрібна відповідь, твій Twin пропонує чернетку твоїм голосом на основі цієї памʼяті — ти переглядаєш її, перш ніж щось надсилається.",
    beats: [
      { label: "Імпорт", body: "Завантаж власну експортовану історію переписок." },
      { label: "Памʼять", body: "Altr повʼязує людей, рішення й манеру спілкування в контекст, який залишається з тобою." },
      { label: "Чернетки", body: "Twin пропонує відповідь твоїм голосом — ти підтверджуєш, перш ніж її надсилають." },
    ],
    fragmentKicker: "ПАМ'ЯТЬ",
    fragmentLine: "не чат-бот",
  },
} as const;

/**
 * `#how-it-works` (Prompt 021). Each step's claim is checked against
 * FEATURE_PARITY_MATRIX's own COMPLETE rows, not asserted: step 1 (local
 * parsing, raw file never uploaded) matches "Local parsing in Web Worker"
 * (`workers/conversation-parser.worker.ts`) and "Raw archive never
 * uploaded" (`rawFileStored: z.literal(false)` in
 * `app/api/imports/route.ts`) — also the exact privacy-boundary wording
 * LEGACY's own `docs/IMPORT_SECURITY.md` uses ("parsed in a browser Web
 * Worker... raw files are not stored by default"), which was never
 * ported into this workspace (read from a disposable LEGACY clone, same
 * as 019/020's own gap-resolution method) but whose underlying claim is
 * independently true of this workspace's own code, checked directly.
 * Step 2 (edit/disable/delete) matches "Memory editing", "Memory
 * disabling (is_active)", "Memory deletion" (all COMPLETE). Step 3
 * (reviewable drafts only, no autonomous send) matches
 * `app/api/ai/draft-reply` returning a draft string for the user to
 * review — there is no send-on-behalf-of-user path anywhere in the
 * ported API surface, and autonomous action is explicitly Roadmap-only
 * (FEATURE_PARITY_MATRIX's Operator/Negotiator entries).
 */
export const howItWorksCopy = {
  EN: {
    eyebrow: "02 — How it works",
    title: "Three movements, always in your control.",
    steps: [
      {
        number: "01",
        title: "Bring your conversations",
        body: "Import exported chats from WhatsApp, Telegram, Instagram, Messenger, and more. Everything is parsed locally in your browser — the raw file is never uploaded, only the structured result is.",
      },
      {
        number: "02",
        title: "Shape your memory",
        body: "What Altr learns becomes a plain, editable memory list. Edit any memory, disable it, or delete it outright — nothing stays that you don't want kept.",
      },
      {
        number: "03",
        title: "Meet your continuation",
        body: "Your Twin drafts replies in your voice, grounded in that memory. Every draft is yours to review — nothing sends itself.",
      },
    ],
  },
  UA: {
    eyebrow: "02 — Як це працює",
    title: "Три кроки, які завжди під твоїм контролем.",
    steps: [
      {
        number: "01",
        title: "Принеси свої розмови",
        body: "Імпортуй експортовані чати з WhatsApp, Telegram, Instagram, Messenger та інших. Усе обробляється локально у твоєму браузері — необроблений файл ніколи не завантажується, лише структурований результат.",
      },
      {
        number: "02",
        title: "Сформуй свою памʼять",
        body: "Те, що вивчає Altr, стає простим, редагованим списком памʼяті. Редагуй будь-яку памʼять, вимикай її або видаляй повністю — нічого не залишається без твоєї згоди.",
      },
      {
        number: "03",
        title: "Познайомся зі своїм продовженням",
        body: "Twin пропонує відповіді твоїм голосом на основі цієї памʼяті. Кожну чернетку ти переглядаєш сам — нічого не надсилається автоматично.",
      },
    ],
  },
} as const;

/**
 * Memory demonstration section (Prompt 021) — static, fictional data
 * mirroring the *real* `altr_memories` shape this workspace's own API
 * already returns (`app/api/memories/route.ts`:
 * `category, title, description, confidence, source_type,
 * source_reference, is_active`; provenance via the joined
 * `altr_memory_sources` rows) — deliberately **not** LEGACY's
 * `lib/memoryData.ts` shape, whose `confidence` is a 0-100 int; this
 * workspace's real schema is a 0-1 float
 * (`z.number().min(0).max(1)`), so 0-100 values would misrepresent the
 * actual product. Field/category *ideas* are reused from LEGACY's demo
 * data (communication style, frequent phrase, relationship, typical
 * decision), per this prompt's own "reuse fictional data ideas, not the
 * visuals" instruction — the visual presentation is new (calm hairline-
 * divided list, not LEGACY's card layout).
 */
export const memoryDemoCopy = {
  EN: {
    eyebrow: "03 — Memory",
    title: "What Altr remembers, plainly.",
    body: "A preview of the real memory list — not a mockup, the same fields the actual product stores: a category, a short title, a description, and where it came from.",
    editingLabel: "Editing",
    memories: [
      {
        category: "Communication style",
        title: "Short, direct replies",
        description: "Keeps replies concise and avoids unnecessary wording, especially with the team.",
        provenance: "Telegram export · Mar 2026",
      },
      {
        category: "Frequent phrase",
        title: "“Sounds good”",
        description: "A short confirmation used when a proposed direction is acceptable.",
        provenance: "Telegram export · Mar 2026",
        editing: true,
      },
      {
        category: "Relationship",
        title: "Client tone",
        description: "Formal enough, clear, and reliable — more measured than the team channel.",
        provenance: "Email export · Feb 2026",
      },
      {
        category: "Typical decision",
        title: "Verify before confirming",
        description: "Confirms only after checking final details and dependencies.",
        provenance: "Manual entry",
      },
    ],
  },
  UA: {
    eyebrow: "03 — Памʼять",
    title: "Що памʼятає Altr, без прикрас.",
    body: "Попередній перегляд реального списку памʼяті — не макет, а ті самі поля, які насправді зберігає продукт: категорія, короткий заголовок, опис і джерело.",
    editingLabel: "Редагування",
    memories: [
      {
        category: "Стиль спілкування",
        title: "Короткі, прямі відповіді",
        description: "Тримає відповіді лаконічними й уникає зайвих слів, особливо з командою.",
        provenance: "Експорт з Telegram · березень 2026",
      },
      {
        category: "Часта фраза",
        title: "«Sounds good»",
        description: "Коротке підтвердження, коли запропонований напрямок прийнятний.",
        provenance: "Експорт з Telegram · березень 2026",
        editing: true,
      },
      {
        category: "Стосунки",
        title: "Тон із клієнтами",
        description: "Достатньо формальний, чіткий і надійний — стриманіший, ніж у командному каналі.",
        provenance: "Експорт з Email · лютий 2026",
      },
      {
        category: "Типове рішення",
        title: "Перевірити перед підтвердженням",
        description: "Підтверджує лише після перевірки фінальних деталей і залежностей.",
        provenance: "Введено вручну",
      },
    ],
  },
} as const;

/**
 * Twin demonstration (Prompt 022). A single static, composed moment —
 * fictional incoming message + fictional draft — checked against what
 * `app/api/ai/draft-reply/route.ts` actually returns/enforces: the
 * response's own `status` field is literally `"draft"` (never "sent"),
 * and its own developer instruction to the model says outright "Never
 * claim it was sent, accepted, completed, booked, paid, delivered, or
 * otherwise acted on" — there is no send-on-behalf-of-user code path
 * anywhere in the ported API surface. `draftLabel` below ("Draft — you
 * decide what sends") is this prompt's own required literal phrase.
 */
export const twinDemoCopy = {
  EN: {
    eyebrow: "04 — Your Twin",
    title: "A draft, in your voice — never sent without you.",
    figureLabel: "Example Twin draft, for illustration only — not a live conversation",
    incomingLabel: "Incoming · 09:42",
    incomingMessage: "Can you confirm the final price and delivery date today?",
    draftLabel: "Draft — you decide what sends",
    draftMessage: "Yes — I'll confirm the final price and delivery date today. I'm checking the last details now and will follow up shortly.",
    provenance: "Drawing on 3 memories",
  },
  UA: {
    eyebrow: "04 — Твій Twin",
    title: "Чернетка твоїм голосом — ніколи не надсилається без тебе.",
    figureLabel: "Приклад чернетки Twin, лише для ілюстрації — не жива розмова",
    incomingLabel: "Вхідне · 09:42",
    incomingMessage: "Можеш сьогодні підтвердити фінальну ціну і дату доставки?",
    draftLabel: "Чернетка — ти вирішуєш, що надсилати",
    draftMessage: "Так — сьогодні підтверджу фінальну ціну і дату доставки. Зараз перевіряю останні деталі й скоро повернусь з відповіддю.",
    provenance: "На основі 3 спогадів",
  },
} as const;

/**
 * Privacy section (Prompt 022) — "enumerate only verified guarantees...
 * verify [no-training claim] against code/docs before writing it — if
 * unverifiable, do not claim it." Each guarantee below is traceable to a
 * specific MASTER_CONTEXT.md security invariant and/or real code; the
 * suggested "no training on your data" guarantee was checked
 * (`lib/ai/openai.ts`'s `createResponse` passes no data-retention/opt-out
 * parameter to the OpenAI API, and no doc in this workspace or LEGACY —
 * `docs/SECURITY.md`, read from a disposable LEGACY clone since it isn't
 * ported here — states a training policy either way) and **deliberately
 * left out**, per this prompt's own instruction, rather than asserted on
 * assumption. See STATUS.md's own guarantee-to-evidence mapping table for
 * the other four.
 */
export const privacySectionCopy = {
  EN: {
    eyebrow: "05 — Privacy",
    title: "Specific guarantees, not vague promises.",
    guarantees: [
      {
        title: "Parsed in your browser",
        body: "Raw conversation exports are parsed locally in a background worker — the file itself is never uploaded, only the structured result is.",
      },
      {
        title: "Scoped to you",
        body: "Every read and write is scoped to your authenticated account, enforced at the database level.",
      },
      {
        title: "Never sent without you",
        body: "Altr's Twin produces drafts only. Nothing is sent, scheduled, or acted on without you reviewing it first.",
      },
      {
        title: "Yours to export or delete",
        body: "Export your data or delete your account at any time — deletion requires explicit confirmation, never a single accidental click.",
      },
    ],
    privacyLink: "Read the full privacy policy",
  },
  UA: {
    eyebrow: "05 — Приватність",
    title: "Конкретні гарантії, а не розпливчасті обіцянки.",
    guarantees: [
      {
        title: "Обробка у твоєму браузері",
        body: "Необроблені експорти розмов парсяться локально у фоновому воркері — сам файл ніколи не завантажується, лише структурований результат.",
      },
      {
        title: "Лише для тебе",
        body: "Кожен запит на читання чи запис прив'язаний до твого автентифікованого акаунта на рівні бази даних.",
      },
      {
        title: "Ніколи не надсилається без тебе",
        body: "Twin створює лише чернетки. Нічого не надсилається, не планується і не виконується без твого перегляду.",
      },
      {
        title: "Твоє право експортувати чи видалити",
        body: "Експортуй дані або видали акаунт у будь-який момент — видалення потребує явного підтвердження, ніколи не одним випадковим кліком.",
      },
    ],
    privacyLink: "Читати повну політику приватності",
  },
} as const;
