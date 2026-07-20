import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

/**
 * Serves references/altr-hero-reference.png for the /hero-lab calibration
 * overlay. That directory isn't under public/, so it can't be reached by a
 * plain <img> src without this route — duplicating the file into public/
 * would ship it in every build regardless of environment; this route
 * 404s outright in production instead, so nothing is ever exposed there.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const filePath = path.join(process.cwd(), "references", "altr-hero-reference.png");
  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
