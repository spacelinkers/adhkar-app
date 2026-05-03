/**
 * Imports duas from scripts/duas.json into Firestore.
 *
 * Requires a Firebase service account key file.
 * ─────────────────────────────────────────────
 * How to get it:
 *   1. Firebase Console → your project → ⚙ Project settings → Service accounts
 *   2. Click "Generate new private key"
 *   3. Save the downloaded JSON file as:  scripts/serviceaccount.json
 *
 * Usage:
 *   node import.mjs
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node import.mjs
 *
 * Optional env vars:
 *   ADMIN_EMAIL   — email recorded as createdBy (default: srbd.conn@gmail.com)
 *   DRY_RUN=1     — print what would be imported without writing to Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore }        from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dir      = path.dirname(fileURLToPath(import.meta.url));
const SA_PATH    = process.env.GOOGLE_APPLICATION_CREDENTIALS
                     ?? path.join(__dir, 'serviceaccount.json');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'srbd.conn@gmail.com';
const DRY_RUN    = process.env.DRY_RUN === '1';
const DUAS_FILE  = path.join(__dir, 'duas.json');

// ── Validate prerequisites ───────────────────────────────────────────────────
if (!existsSync(SA_PATH)) {
  console.error(`
ERROR: Service account key not found.

Expected: ${SA_PATH}

Steps to fix:
  1. Firebase Console → Project settings → Service accounts
  2. "Generate new private key" → save as scripts/serviceaccount.json
`);
  process.exit(1);
}

if (!existsSync(DUAS_FILE)) {
  console.error(`ERROR: ${DUAS_FILE} not found. Run scrape.mjs first.`);
  process.exit(1);
}

// ── Initialise Firebase Admin ────────────────────────────────────────────────
const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Load duas ────────────────────────────────────────────────────────────────
const duas = JSON.parse(readFileSync(DUAS_FILE, 'utf-8'));
console.log(`Found ${duas.length} duas in duas.json`);
if (DRY_RUN) console.log('DRY RUN — nothing will be written.\n');
console.log('');

// ── Import ───────────────────────────────────────────────────────────────────
let imported = 0;
let skipped  = 0;

for (const dua of duas) {
  const label = `[${String(dua.n).padStart(3)}] ${dua.title}`;

  if (!dua.arabic || !dua.title) {
    console.log(`  SKIP  ${label}  (missing title or arabic)`);
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  DRY   ${label}`);
    console.log(`        arabic:      ${dua.arabic.slice(0, 60)}…`);
    console.log(`        translation: ${dua.translation.slice(0, 60)}…`);
    console.log('');
    imported++;
    continue;
  }

  try {
    const ref = await db.collection('duas').add({
      title:       dua.title,
      arabic:      dua.arabic,
      translation: dua.translation,
      reward:      dua.reward ?? '',
      createdAt:   Date.now(),
      createdBy:   ADMIN_EMAIL,
    });
    console.log(`  ✓  ${label}  → ${ref.id}`);
    imported++;
  } catch (err) {
    console.error(`  ✗  ${label}  — ${err.message}`);
  }
}

console.log(`\n──────────────────────────────────────`);
console.log(`Imported : ${imported}`);
console.log(`Skipped  : ${skipped}`);
if (!DRY_RUN) console.log(`\nDone! Refresh the Dua Library page to see them.`);
process.exit(0);
