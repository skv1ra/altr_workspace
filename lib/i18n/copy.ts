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
    // Prompt 024 — footer + legal pages. `nav.product`/`nav.pricing`/
    // `nav.language`/`nav.login`/`nav.createAltr`/`common.backDashboard`
    // are reused as-is for the Footer's own Product/Account columns and
    // language switch (same words, no duplicate keys).
    footer: {
      legalHeading: "Legal",
      accountHeading: "Account",
      privacyLink: "Privacy",
      termsLink: "Terms",
      cookiesLink: "Cookies",
      cookiePreferences: "Cookie preferences",
      copyright: "© 2026 Altr",
    },
    legalPage: {
      back: "Back to Altr",
      toc: "On this page",
      version: "Version",
      effective: "Effective",
      updated: "Last updated",
      print: "Print or save as PDF",
      devNoticeTitle: "Development notice",
      devNoticeBody: "Mandatory legal configuration is incomplete — the fields below still need real owner/legal input before this document can go live.",
      missingFields: "Missing fields",
      ownerReview: "These documents require owner and qualified legal review before commercial launch.",
    },
    // Prompt 025 — auth screens. `footer.termsLink`/`footer.privacyLink` are
    // reused as-is for the inline Terms/Privacy links inside the consent
    // checkbox (same words, no duplicate keys).
    authPage: {
      backHome: "Back home",
      visualLabel: "Your context, assembled with permission",
      visualTitle: "A private intelligence that becomes more like you.",
      visualBody: "Start with one account. Add only the memories and connections you choose. Altr learns quietly, then acts within your boundaries.",
      fragmentKicker: "MEMORY",
      fragmentLine: "shaped by you, not sold",
      registerEyebrow: "New account",
      loginEyebrow: "Private access",
      registerTitle: "Create your Altr",
      loginTitle: "Return to your Altr",
      registerBody: "Create the account first. You'll shape your Altr during a short onboarding.",
      loginBody: "Return to your private workspace.",
      google: "Continue with Google",
      divider: "or email",
      emailLabel: "Email",
      passwordLabel: "Password",
      forgot: "Forgot password?",
      registerSubmit: "Create account",
      loginSubmit: "Log in",
      registerPrompt: "Already have an account?",
      loginPrompt: "New to Altr?",
      registerLink: "Log in",
      loginLink: "Create one",
      legalSummary: "Privacy and processing permissions",
      consentTerms: "I accept the",
      consentTermsAnd: "and",
      consentConversations: "I allow Altr to process conversations I explicitly import.",
      consentMemory: "I allow Altr to create personalized memory from approved sources.",
      verification: "Check your email and confirm registration. After confirmation, you'll return to Altr.",
      errors: {
        email: "Enter a valid email address.",
        password: "Password must be at least 8 characters.",
        consent: "Confirm all three permissions to create your Altr.",
        generic: "Couldn't complete that — check your details and try again.",
        rateLimited: "Too many attempts — please try again shortly.",
      },
    },
    // Prompt 026 — recovery, reset, callback. `authPage.backHome`/
    // `common.loading`/`authPage.emailLabel`/`authPage.passwordLabel`/
    // `authPage.errors.generic`/`authPage.errors.rateLimited` are reused as
    // -is (same words, no duplicate keys) for the shared chrome, loading
    // check, field labels, and generic/rate-limit error copy on both pages.
    recoveryPage: {
      forgotEyebrow: "Account recovery",
      forgotTitle: "Reset your password",
      forgotBody: "Enter your email and we'll send recovery instructions if an account exists — the response is always the same either way.",
      forgotSubmit: "Send instructions",
      forgotSentTitle: "Check your email",
      forgotSentBody: "If that address has an Altr account, a recovery link is on its way. It can take a few minutes to arrive.",
      backToLogin: "Return to sign in",
      resetEyebrow: "Secure reset",
      resetTitle: "Choose a new password",
      resetBody: "Set a new password for your Altr account.",
      confirmPasswordLabel: "Confirm password",
      resetSubmit: "Save password",
      resetMismatch: "Passwords don't match.",
      invalidTitle: "This link is invalid or has expired",
      invalidBody: "Recovery links can only be used once and expire after a short time. Request a new one to continue.",
      invalidCta: "Request a new link",
      successTitle: "Password updated",
      successBody: "Your password has been changed. You're signed in and ready to continue.",
      successCta: "Continue to your Altr",
    },
    // Prompt 028 — auth polish. Migrated out of `SignOutButton.tsx`'s own
    // local copy object (027 couldn't touch this file; 028 can) so every
    // auth surface's copy lives in one place, per this prompt's own
    // "verify no hardcoded strings remain... all via i18n" instruction.
    signOut: {
      label: "Sign out",
      confirmed: "You've been signed out.",
      failed: "Couldn't sign out — please try again.",
    },
    // Prompt 029 — dashboard shell. `common.backDashboard`/`nav.menu`/
    // `nav.closeMenu`/`nav.language`/`pricingPage.planNames` are reused as
    // -is (same words, no duplicate keys) for the nav rail's Dashboard
    // link, mobile menu triggers, language switch, and plan badge text.
    dashboard: {
      greetingPrefix: "Hi,",
      ofLimit: "of",
      thisMonth: "this month",
      memoryQuotaLabel: "active memories",
      importsLabel: "Imports",
      importsLastPrefix: "Last:",
      importsEmpty: "No imports yet.",
      twinLabel: "Twin",
      twinQuotaLabel: "drafts",
      twinEmpty: "No drafts yet this month.",
      emptyAccountTitle: "Your Altr is just getting started.",
      emptyAccountBody: "Once you import a conversation, memories and drafts will start appearing here.",
      importStatus: { processing: "Processing", completed: "Completed", failed: "Failed", deleted: "Removed" },
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
    footer: {
      legalHeading: "Правові",
      accountHeading: "Акаунт",
      privacyLink: "Приватність",
      termsLink: "Умови",
      cookiesLink: "Cookie",
      cookiePreferences: "Налаштування cookie",
      copyright: "© 2026 Altr",
    },
    legalPage: {
      back: "Назад до Altr",
      toc: "На цій сторінці",
      version: "Версія",
      effective: "Набуває чинності",
      updated: "Оновлено",
      print: "Друк або збереження PDF",
      devNoticeTitle: "Повідомлення для розробки",
      devNoticeBody: "Обовʼязкова юридична конфігурація не заповнена — поля нижче ще потребують реального рішення власника чи юриста, перш ніж цей документ можна буде опублікувати.",
      missingFields: "Незаповнені поля",
      ownerReview: "Перед комерційним запуском ці документи потребують перевірки власника та кваліфікованого юриста.",
    },
    authPage: {
      backHome: "На головну",
      visualLabel: "Твій контекст, зібраний лише з дозволу",
      visualTitle: "Приватний інтелект, який поступово стає схожим на тебе.",
      visualBody: "Почни з одного акаунта. Додавай лише ті спогади й звʼязки, які обираєш сам. Altr навчається тихо й діє у визначених тобою межах.",
      fragmentKicker: "ПАМ'ЯТЬ",
      fragmentLine: "твоя, а не на продаж",
      registerEyebrow: "Новий акаунт",
      loginEyebrow: "Приватний доступ",
      registerTitle: "Створи свій Altr",
      loginTitle: "Повернись до свого Altr",
      registerBody: "Спочатку створи акаунт. Особистість Altr налаштуєш під час короткого онбордингу.",
      loginBody: "Повернись у свій приватний простір.",
      google: "Продовжити з Google",
      divider: "або email",
      emailLabel: "Email",
      passwordLabel: "Пароль",
      forgot: "Забув пароль?",
      registerSubmit: "Створити акаунт",
      loginSubmit: "Увійти",
      registerPrompt: "Уже маєш акаунт?",
      loginPrompt: "Ще не маєш Altr?",
      registerLink: "Увійти",
      loginLink: "Створити",
      legalSummary: "Приватність і дозволи на обробку",
      consentTerms: "Я приймаю",
      consentTermsAnd: "та",
      consentConversations: "Я дозволяю обробляти лише ті переписки, які сам імпортую.",
      consentMemory: "Я дозволяю створювати персональну памʼять із підтверджених джерел.",
      verification: "Перевір email і підтвердь реєстрацію. Після підтвердження ти повернешся в Altr.",
      errors: {
        email: "Вкажи коректну email-адресу.",
        password: "Пароль має містити щонайменше 8 символів.",
        consent: "Підтвердь усі три дозволи для створення Altr.",
        generic: "Не вдалося виконати дію — перевір дані й спробуй ще раз.",
        rateLimited: "Забагато спроб — спробуй трохи пізніше.",
      },
    },
    recoveryPage: {
      forgotEyebrow: "Відновлення акаунта",
      forgotTitle: "Скинь пароль",
      forgotBody: "Введи email — ми надішлемо інструкції з відновлення, якщо акаунт існує. Відповідь однакова в обох випадках.",
      forgotSubmit: "Надіслати інструкції",
      forgotSentTitle: "Перевір email",
      forgotSentBody: "Якщо на цю адресу зареєстровано Altr, лист із посиланням уже в дорозі. Це може зайняти кілька хвилин.",
      backToLogin: "Повернутися до входу",
      resetEyebrow: "Безпечне скидання",
      resetTitle: "Обери новий пароль",
      resetBody: "Встанови новий пароль для свого акаунта Altr.",
      confirmPasswordLabel: "Повтори пароль",
      resetSubmit: "Зберегти пароль",
      resetMismatch: "Паролі не збігаються.",
      invalidTitle: "Це посилання недійсне або застаріло",
      invalidBody: "Посилання для відновлення можна використати лише раз, і воно діє обмежений час. Запроси нове, щоб продовжити.",
      invalidCta: "Запросити нове посилання",
      successTitle: "Пароль оновлено",
      successBody: "Твій пароль змінено. Ти увійшов і можеш продовжити.",
      successCta: "Перейти до свого Altr",
    },
    signOut: {
      label: "Вийти",
      confirmed: "Ти вийшов з акаунта.",
      failed: "Не вдалося вийти — спробуй ще раз.",
    },
    dashboard: {
      greetingPrefix: "Привіт,",
      ofLimit: "з",
      thisMonth: "цього місяця",
      memoryQuotaLabel: "активних спогадів",
      importsLabel: "Імпорти",
      importsLastPrefix: "Останній:",
      importsEmpty: "Поки немає імпортів.",
      twinLabel: "Твін",
      twinQuotaLabel: "чернеток",
      twinEmpty: "Цього місяця ще немає чернеток.",
      emptyAccountTitle: "Твій Altr щойно починається.",
      emptyAccountBody: "Щойно ти імпортуєш переписку, тут з'являться спогади та чернетки.",
      importStatus: { processing: "Обробка", completed: "Завершено", failed: "Помилка", deleted: "Видалено" },
    },
  },
} as const satisfies Record<Lang, unknown>;

export function getSharedCopy(lang: Lang) { return sharedCopy[lang]; }
