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
