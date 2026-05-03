/**
 * Scrapes duas from https://dua.gtaf.org/dua/<n>/
 * and saves them to scripts/duas.json for review.
 *
 * Usage:
 *   npm run preview -- <start> <end>
 *
 * Examples:
 *   npm run preview -- 6 13      preview duas 6 to 13
 *   npm run preview -- 1 50      preview duas 1 to 50
 *   npm run preview -- 2 335     full library
 *
 * After reviewing duas.json, run:
 *   npm run import
 */

import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dir  = path.dirname(fileURLToPath(import.meta.url));
const START  = Number(process.argv[2] ?? 1);
const END    = Number(process.argv[3] ?? 50);
const BASE   = 'https://dua.gtaf.org/dua/';
const DELAY  = 700; // ms between requests — be polite to the server

async function scrapeDua(n) {
  const url = `${BASE}${n}/`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $    = cheerio.load(html);

  const title = $('h1').first().text().trim();

  // The content div is the .m-auto that contains a p with font-size:1.9rem
  const mAuto = $('.m-auto').filter((_, el) =>
    $(el).find('p[style*="1.9rem"]').length > 0,
  ).first();

  const arabic      = mAuto.find('p[style*="1.9rem"] span').text().trim();
  const translation = mAuto.find('p[style*="1.25rem"] span').text().trim();

  // The last p.text-base inside the content div holds the reward / virtue text
  const reward = mAuto.find('p.text-base').last().find('span').text().trim();

  return { n, title, arabic, translation, reward, sourceUrl: url };
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log(`Scraping duas ${START}–${END} from dua.gtaf.org…\n`);
const results = [];

for (let i = START; i <= END; i++) {
  process.stdout.write(`  [${String(i).padStart(3)}] `);
  try {
    const dua = await scrapeDua(i);
    results.push(dua);
    console.log(`✓  ${dua.title}`);
    if (i < END) await new Promise(r => setTimeout(r, DELAY));
  } catch (err) {
    console.log(`✗  ${err.message}`);
  }
}

const outPath = path.join(__dir, 'duas.json');
writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

console.log(`\n──────────────────────────────────────`);
console.log(`Scraped : ${results.length} / ${END - START + 1} duas`);
console.log(`Saved   : ${outPath}`);
console.log(`\nReview the file, then run: node import.mjs`);
