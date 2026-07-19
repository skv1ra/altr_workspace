import type { Config } from "tailwindcss";

function withOpacity(cssVarRgb: string) {
  return `rgb(var(${cssVarRgb}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "altr-white": withOpacity("--altr-white-rgb"),
        "altr-silver": withOpacity("--altr-silver-rgb"),
        "altr-mist": withOpacity("--altr-mist-rgb"),
        "altr-graphite": withOpacity("--altr-graphite-rgb"),
        "altr-obsidian": withOpacity("--altr-obsidian-rgb"),
        "altr-black": withOpacity("--altr-black-rgb"),
        "surface-page": "var(--surface-page)",
        "surface-inverse": "var(--surface-inverse)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "edge-hairline": "var(--edge-hairline)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["var(--text-display)", { lineHeight: "var(--leading-display)", letterSpacing: "var(--tracking-tight)" }],
        h1: ["var(--text-h1)", { lineHeight: "var(--leading-display)", letterSpacing: "var(--tracking-tight)" }],
        h2: ["var(--text-h2)", { lineHeight: "var(--leading-heading)" }],
        h3: ["var(--text-h3)", { lineHeight: "var(--leading-heading)" }],
        h4: ["var(--text-h4)", { lineHeight: "var(--leading-heading)" }],
        body: ["var(--text-body)", { lineHeight: "var(--leading-body)" }],
        label: ["var(--text-label)", { lineHeight: "1.4", letterSpacing: "var(--tracking-label)" }],
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        14: "var(--space-14)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        hairline: "var(--shadow-hairline)",
        soft: "var(--shadow-soft)",
        elevated: "var(--shadow-elevated)",
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        slow: "var(--motion-slow)",
        drift: "var(--motion-drift)",
      },
      transitionTimingFunction: {
        altr: "var(--ease-altr)",
      },
      maxWidth: {
        prose: "var(--measure-body)",
      },
    },
  },
  plugins: [],
};

export default config;
