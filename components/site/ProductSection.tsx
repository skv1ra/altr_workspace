"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { productCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./ProductSection.module.css";

export function ProductSection() {
  const [lang] = useLang("EN");
  const t = productCopy[lang];

  return (
    <Surface
      variant="page"
      as="section"
      id="product"
      className={`${styles.section} relative overflow-hidden`}
    >
      <Surface variant="fog" aria-hidden="true" />

      <div className={styles.frame}>
        <Reveal className={styles.intro}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h2 className={styles.title}>{t.title}</h2>
          <p className={styles.body}>{t.body}</p>
        </Reveal>

        <Reveal delay={0.08} className={styles.visualStage}>
          <div className={styles.assetField} aria-hidden="true">
            <picture className={styles.primaryShard}>
              <source
                srcSet="/assets/hero/shards-trimmed/shard-mid-02@1x.avif"
                type="image/avif"
              />
              <source
                srcSet="/assets/hero/shards-trimmed/shard-mid-02@1x.webp"
                type="image/webp"
              />
              <img
                src="/assets/hero/shards-trimmed/shard-mid-02@1x.png"
                alt=""
                width={481}
                height={690}
                loading="lazy"
              />
            </picture>

            <div className={styles.memoryEtching}>
              <span>{t.fragmentKicker}</span>
              <strong>{t.fragmentLine}</strong>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <ol className={styles.sequence}>
            {t.beats.map((beat, index) => (
              <li key={beat.label} className={styles.beat}>
                <span className={styles.beatNumber}>0{index + 1}</span>
                <div>
                  <h3 className={styles.beatTitle}>{beat.label}</h3>
                  <p className={styles.beatBody}>{beat.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Surface>
  );
}
