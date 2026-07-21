import type { Lang } from "@/lib/i18n/lang-store";

export const sharedCopy = {
  EN: {
    // howItWorks/login/createAltr added by Prompt 019 (public header) —
    // product/pricing/menu/closeMenu/language were already correct for the
    // header's own needs and are reused as-is; the signed-in state reuses
    // common.backDashboard ("Dashboard") rather than adding a duplicate key.
    nav: { product: "Product", memory: "Memory", assistants: "Assistants", pricing: "Pricing", profile: "Profile", menu: "Open menu", closeMenu: "Close menu", language: "Language", howItWorks: "How it works", login: "Log in", createAltr: "Create your Altr", menuTitle: "Menu" },
    common: { loading: "Loading", save: "Save", cancel: "Cancel", close: "Close", error: "Something went wrong.", backDashboard: "Dashboard" },
    cookie: { title: "Necessary cookies and optional language storage", body: "Supabase Auth cookies are required for sign-in and security. You may also allow local storage for your language preference. Analytics and marketing are not enabled.", allow: "Allow language storage", necessary: "Necessary only", details: "Details", dialog: "Cookie preferences" },
    // Prompt 023 — pricing page. Plan *names* and one-line positioning are
    // written fresh here rather than reusing lib/plans.ts's Ukrainian-only
    // marketing copy verbatim: that file's feature lists include
    // roadmap-only claims (team workspace, work integrations —
    // FEATURE_PARITY_MATRIX's own "Roadmap only" list) and an
    // originalPrice discount framing ($30->$20, $60->$40) with no
    // corresponding field in lib/billing/plans.ts's canonical amounts —
    // never actually charged, so not repeated here. Limits themselves are
    // never hardcoded in copy — the component reads lib/billing/limits.ts
    // directly and this object only supplies the labels for each field.
    pricingPage: {
      eyebrow: "Pricing",
      title: "One Altr. More capable with time.",
      subtitle: "Start free. Upgrade only when you need more room.",
      perMonth: "/mo",
      planNames: { free: "Free", personal: "Personal", work: "Work" },
      positioning: {
        free: "Try Altr with your own conversations — no time limit on the free plan.",
        personal: "For everyday use: more imports, more memory, more drafts.",
        work: "For heavier volume — client work, more concurrent imports.",
      },
      limitLabels: {
        importsPerMonth: "Imports per month",
        maxFileBytes: "Max file size",
        maxActiveMemories: "Active memories",
        aiDraftsPerMonth: "Twin drafts per month",
      },
      ctaRegister: "Create your Altr",
      ctaCheckout: "Continue to checkout",
      yourPlan: "Your plan",
      freeIncluded: "Included with every account",
      plansUnavailable: "We couldn't confirm live pricing just now — showing standard pricing below.",
      retry: "Retry",
      checkoutError: "Couldn't start checkout — please try again.",
      footnoteCancellation: "Manage or cancel your subscription any time from the billing portal.",
      footnoteRefunds: "Refunds are processed through Lemon Squeezy; your invoice updates automatically once one completes — refund eligibility isn't guaranteed beyond that process.",
    },
  },
  UA: {
    nav: { product: "Продукт", memory: "Памʼять", assistants: "Асистенти", pricing: "Тарифи", profile: "Профіль", menu: "Відкрити меню", closeMenu: "Закрити меню", language: "Мова", howItWorks: "Як працює", login: "Увійти", createAltr: "Створити свій Altr", menuTitle: "Меню" },
    common: { loading: "Завантаження", save: "Зберегти", cancel: "Скасувати", close: "Закрити", error: "Сталася помилка.", backDashboard: "Кабінет" },
    cookie: { title: "Необхідні cookie та необовʼязкове збереження мови", body: "Supabase Auth cookie потрібні для входу й безпеки. Також можна дозволити localStorage для вибраної мови. Аналітика й маркетинг не підключені.", allow: "Дозволити мову", necessary: "Лише необхідні", details: "Деталі", dialog: "Налаштування cookie" },
    pricingPage: {
      eyebrow: "Тарифи",
      title: "Один Altr. З часом — більше можливостей.",
      subtitle: "Почни безкоштовно. Оновлюй лише тоді, коли потрібно більше можливостей.",
      perMonth: "/міс",
      planNames: { free: "Безкоштовний", personal: "Особистий", work: "Робочий" },
      positioning: {
        free: "Спробуй Altr на власних розмовах — безкоштовний план без обмеження за часом.",
        personal: "Для щоденного використання: більше імпортів, більше памʼяті, більше чернеток.",
        work: "Для більших обсягів — робота з клієнтами, більше одночасних імпортів.",
      },
      limitLabels: {
        importsPerMonth: "Імпортів на місяць",
        maxFileBytes: "Максимальний розмір файлу",
        maxActiveMemories: "Активних спогадів",
        aiDraftsPerMonth: "Чернеток Twin на місяць",
      },
      ctaRegister: "Створити свій Altr",
      ctaCheckout: "Перейти до оплати",
      yourPlan: "Твій план",
      freeIncluded: "Включено в кожен акаунт",
      plansUnavailable: "Не вдалося підтвердити актуальні ціни — показуємо стандартні ціни нижче.",
      retry: "Повторити",
      checkoutError: "Не вдалося почати оформлення — спробуй ще раз.",
      footnoteCancellation: "Керуй підпискою або скасуй її будь-коли через портал білінгу.",
      footnoteRefunds: "Повернення коштів обробляються через Lemon Squeezy; твій рахунок оновлюється автоматично після завершення — окремих гарантій повернення поза цим процесом немає.",
    },
  },
} as const satisfies Record<Lang, unknown>;

export function getSharedCopy(lang: Lang) { return sharedCopy[lang]; }
