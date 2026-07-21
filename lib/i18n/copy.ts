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
  },
  UA: {
    nav: { product: "Продукт", memory: "Памʼять", assistants: "Асистенти", pricing: "Тарифи", profile: "Профіль", menu: "Відкрити меню", closeMenu: "Закрити меню", language: "Мова", howItWorks: "Як працює", login: "Увійти", createAltr: "Створити свій Altr", menuTitle: "Меню" },
    common: { loading: "Завантаження", save: "Зберегти", cancel: "Скасувати", close: "Закрити", error: "Сталася помилка.", backDashboard: "Кабінет" },
    cookie: { title: "Необхідні cookie та необовʼязкове збереження мови", body: "Supabase Auth cookie потрібні для входу й безпеки. Також можна дозволити localStorage для вибраної мови. Аналітика й маркетинг не підключені.", allow: "Дозволити мову", necessary: "Лише необхідні", details: "Деталі", dialog: "Налаштування cookie" },
  },
} as const satisfies Record<Lang, unknown>;

export function getSharedCopy(lang: Lang) { return sharedCopy[lang]; }
