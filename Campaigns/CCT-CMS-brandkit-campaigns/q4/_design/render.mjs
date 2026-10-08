// Renders the campaign HTML sources to PDF/PNG.
// Usage (from repo root): NODE_PATH=<dir with playwright> node Campaigns/CCT-CMS-brandkit-campaigns/q4/_design/render.mjs
// Any Playwright install works; Google Fonts must be reachable so Fraunces and Space Mono load.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(root, ...a);

// Print pieces: one page each → PDF (+ PNG preview).
const print = [
  { src: "02-offer/offer-sheet.html", out: "02-offer/CMS-Starter-Package-Offer-Sheet", w: 794, h: 1123 },
  { src: "03-print/flyer-a4.html", out: "03-print/CMS-Laguna-Flyer-A4", w: 794, h: 1123 },
  { src: "03-print/tarpaulin-3x2ft.html", out: "03-print/CMS-Laguna-Tarpaulin-3x2ft", w: 1728, h: 1152 },
  { src: "03-print/calling-card.html", out: "03-print/CMS-Calling-Card", w: 800, h: 252 },
];

// Social frames: every element with [data-export] in these files → PNG.
const social = ["04-social/graphics/feed-posts.html", "04-social/graphics/carousel.html", "04-social/graphics/stories.html", "04-social/graphics/covers.html"];

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();

for (const t of print) {
  if (!fs.existsSync(p(t.src))) continue;
  await page.setViewportSize({ width: t.w, height: t.h });
  await page.goto(pathToFileURL(p(t.src)).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: p(t.out + ".pdf"), preferCSSPageSize: true, printBackground: true });
  await page.screenshot({ path: p(t.out + ".png"), fullPage: false });
  const overflow = await page.evaluate(() => [...document.querySelectorAll(".page")].some((el) => el.scrollHeight > el.clientHeight + 1));
  console.log(`${overflow ? "OVERFLOW" : "ok      "} ${t.out}`);
}

for (const src of social) {
  if (!fs.existsSync(p(src))) continue;
  await page.setViewportSize({ width: 1200, height: 1000 });
  await page.goto(pathToFileURL(p(src)).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const el of await page.$$("[data-export]")) {
    const name = await el.getAttribute("data-export");
    const over = await el.evaluate((n) => [n, ...n.querySelectorAll("*")].some((c) => c.scrollHeight > c.clientHeight + 2 && getComputedStyle(c).overflow === "hidden"));
    await el.screenshot({ path: p("04-social/exports", name + ".png") });
    console.log(`${over ? "OVERFLOW" : "ok      "} exports/${name}.png`);
  }
}

await browser.close();
