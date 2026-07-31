"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./AccountTabs.module.css";

export function AccountTabs() {
  const pathname = usePathname();
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).connections.tabs;
  const items = [
    { href: "/settings", label: t.profile },
    { href: "/connections", label: t.connections },
  ];

  return (
    <nav aria-label={t.label} className={styles.tabs}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={active ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
