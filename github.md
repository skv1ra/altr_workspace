repo: skv1ra/altr_workspace
branch: main

## Last sync
date: 2026-07-27T16:32:24Z

### Updated in this project
- Recreated the public landing page as a single Design Component (`Altr Landing.dc.html`).
- Hero scene, header and footer reproduced unchanged from source (shard field, fragments, particles, fog, vignette).
- The five body sections (Product, How it works, Memory, Twin, Privacy) redesigned as a premium light theme.
- Twin section gained an interactive draft-typing moment; EN/UA switch wired.

## Screen map
| Project screen | Repo files |
| --- | --- |
| Altr Landing.dc.html — header | components/site/Header.tsx, Header.module.css, components/site/Logo.tsx |
| Altr Landing.dc.html — hero | components/hero/HeroScene.tsx, HeroScene.module.css, HeroLayers.tsx, HeroCopy.tsx, HeroCopy.module.css, HeroFragments.tsx, HeroFragments.module.css, fragments.ts, HeroParticles.tsx |
| Altr Landing.dc.html — #product | components/site/ProductSection.tsx, ProductSection.module.css, lib/i18n/home-copy.ts |
| Altr Landing.dc.html — #how-it-works | components/site/HowItWorks.tsx, HowItWorks.module.css, lib/i18n/home-copy.ts |
| Altr Landing.dc.html — #memory | components/site/MemoryDemo.tsx, MemoryDemo.module.css, lib/i18n/home-copy.ts |
| Altr Landing.dc.html — #twin | components/site/TwinDemo.tsx, TwinDemo.module.css, lib/i18n/home-copy.ts |
| Altr Landing.dc.html — #privacy | components/site/PrivacySection.tsx, PrivacySection.module.css, lib/i18n/home-copy.ts |
| Altr Landing.dc.html — footer | components/site/Footer.tsx, Footer.module.css, lib/i18n/copy.ts |
| Tokens / type / motion | app/styles/tokens.css, typography.css, materials.css, controls.css, motion.css, app/layout.tsx |
| Hero assets | public/assets/hero/shards-trimmed/*.png |
