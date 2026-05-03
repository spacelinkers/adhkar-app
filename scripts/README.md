# Adhkar Scripts

Scripts for scraping duas from [dua.gtaf.org](https://dua.gtaf.org) and importing them into Firestore.

---

## Setup

Run once inside the `scripts/` folder to install dependencies:

```bash
cd scripts
npm install
```

---

## Step 1 — Preview (Scrape & Save)

Fetches duas from the website and saves them to `duas.json` for review.

```bash
# Syntax
npm run preview -- <start> <end>

# Examples
npm run preview -- 6 13       # duas 6 to 13
npm run preview -- 1 50       # duas 1 to 50
npm run preview -- 2 335      # full library (2 to 335)
```

Output file: `scripts/duas.json`

Open `duas.json` and check that titles, Arabic text, translations, and rewards look correct before importing.

---

## Step 2 — Import to Firestore

### Get a Service Account Key (one-time setup)

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Click ⚙ **Project settings** → **Service accounts**
3. Click **"Generate new private key"**
4. Save the downloaded JSON file as `scripts/serviceaccount.json`

> ⚠️ Never commit `serviceaccount.json` to git — it contains admin credentials.

### Run the import

```bash
npm run import
```

### Dry run (preview without writing to Firestore)

```bash
DRY_RUN=1 npm run import
```

### Use a custom service account path

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run import
```

### Use a custom admin email (recorded as `createdBy`)

```bash
ADMIN_EMAIL=your@email.com npm run import
```

---

## URL structure

Duas are at: `https://dua.gtaf.org/dua/<n>/`
Valid range: **2 to 335**

---

## Fields extracted

| Field         | Source on page                          |
|---------------|-----------------------------------------|
| `title`       | `<h1>` text                             |
| `arabic`      | `<p style="font-size:1.9rem">` span     |
| `translation` | `<p style="font-size:1.25rem">` span    |
| `reward`      | Last `<p class="text-base">` span       |

> Titles and translations are in **Bangla**. You can edit them in the app after importing using the Admin edit button on each dua.
