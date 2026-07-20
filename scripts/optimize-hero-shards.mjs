// Production shard asset pipeline (Prompt 013).
//
// Source: public/assets/hero/shards-trimmed/*.png — real, reference-grade
// glass fragment renders supplied externally (not by
// generate-hero-shards.mjs; that procedural generator was evaluated and
// rejected in Prompt 012 for reading as matte rock, not glossy refractive
// glass — see ADR-007 / STATUS.md 012 entry). This script does not create
// new imagery; it only re-encodes the supplied masters into the format/
// density/DOF-variant set the production hero needs, within budget.
//
// Existing plain `<name>.png` files in that directory are left byte-for-byte
// untouched — they are already relied on by in-progress hero-composition
// work elsewhere in the tree. This script only adds new sibling files:
//   <name>.avif / <name>.webp                 — 2x tier (master resolution)
//   <name>@1x.avif / .webp / .png             — 1x tier (50% resolution)
//   <name>-blur.avif / .webp / .png           — 2x pre-blurred DOF variant
//   <name>-blur@1x.avif / .webp / .png        — 1x pre-blurred DOF variant
// Blur variants are only produced for shards the hero layer plan uses at
// heavy DOF (mid/foreground/background tiers); the hero-carrying "main"
// shard is always in sharp focus and gets no blur variant.
import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "fs";
import { join, basename, extname } from "path";

const SRC_DIR = "public/assets/hero/shards-trimmed";

// Per-shard blur radius (px, at master/2x resolution) for the DOF variant.
// Tuned per asset: thin/wide shards (background-02) need a larger radius to
// read as soft at their thin dimension; small dense shards need less.
const BLUR_RADIUS = {
  "shard-mid-01": 10,
  "shard-mid-02": 9,
  "shard-mid-03": 6,
  "shard-foreground-01": 20,
  "shard-foreground-02": 4,
  "shard-background-01": 8,
  "shard-background-02": 22,
};

const AVIF_OPTS = { quality: 55, effort: 6 };
const WEBP_OPTS = { quality: 68, effort: 6 };
const PNG_OPTS = { compressionLevel: 9, palette: true, quality: 90 };

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

async function writeVariant(pipeline, outPath, results) {
  const avif = await pipeline.clone().avif(AVIF_OPTS).toBuffer();
  const webp = await pipeline.clone().webp(WEBP_OPTS).toBuffer();
  const png = await pipeline.clone().png(PNG_OPTS).toBuffer();
  writeFileSync(`${outPath}.avif`, avif);
  writeFileSync(`${outPath}.webp`, webp);
  writeFileSync(`${outPath}.png`, png);
  results.push(
    { file: `${outPath}.avif`, bytes: avif.length },
    { file: `${outPath}.webp`, bytes: webp.length },
    { file: `${outPath}.png`, bytes: png.length },
  );
}

async function run() {
  const files = readdirSync(SRC_DIR).filter((f) => extname(f) === ".png" && !f.includes("@") && !f.includes("-blur"));
  const results = [];

  for (const file of files) {
    const name = basename(file, ".png");
    const srcPath = join(SRC_DIR, file);
    const meta = await sharp(srcPath).metadata();

    // 2x tier: re-encode master resolution in avif/webp (+ compressed png
    // reference, not used as the shipped fallback since the untouched
    // original already serves that role for in-flight consumer code).
    await writeVariant(sharp(srcPath), join(SRC_DIR, `${name}`), results);

    // 1x tier: 50% resolution.
    const half = sharp(srcPath).resize({ width: Math.round(meta.width / 2) });
    await writeVariant(half, join(SRC_DIR, `${name}@1x`), results);

    const blurRadius = BLUR_RADIUS[name];
    if (blurRadius) {
      const blurred2x = sharp(srcPath).blur(blurRadius);
      await writeVariant(blurred2x, join(SRC_DIR, `${name}-blur`), results);

      const blurred1x = sharp(srcPath)
        .resize({ width: Math.round(meta.width / 2) })
        .blur(blurRadius / 2);
      await writeVariant(blurred1x, join(SRC_DIR, `${name}-blur@1x`), results);
    }
  }

  console.log("\nGenerated files:");
  for (const r of results) console.log(`  ${r.file}  ${kb(r.bytes)} KB`);

  const totalNew = results.reduce((s, r) => s + r.bytes, 0);
  console.log(`\nTotal new-file weight: ${kb(totalNew)} KB across ${results.length} files`);
}

run();
