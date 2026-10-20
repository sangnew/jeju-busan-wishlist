# Busan & Jeju Trip Wishlist

A tiny bilingual (English main / Korean) website for collecting what everyone
wants to eat, do, see, and where to stay for the trip:

- Busan: Dec 22 (Tue) – Dec 23 (Wed)
- Jeju: Dec 23 (Wed) night – Dec 26 (Sat) night

No login required for anyone — open the link, type your name, add items.
Everyone sees the same shared list.

## How it stores data

It uses [jsonblob.com](https://jsonblob.com), a free, keyless JSON storage
API, called directly from each visitor's browser. There's no server to run
and no account needed for people using the site.

## One-time setup (do this once after deploying to GitHub Pages)

1. Push this folder to a GitHub repo and enable **GitHub Pages** (Settings →
   Pages → Deploy from branch → `main` / root).
2. Open the live Pages URL in your own browser.
3. Click the small ⚙️ gear icon in the bottom-right corner → **Create shared
   storage**.
4. Copy the generated ID it shows you.
5. Open `config.js`, replace `REPLACE_WITH_BLOB_ID` with that ID:
   ```js
   const BLOB_ID = "your-id-here";
   ```
6. Commit and push. Redeploy. Now everyone who opens the link uses the same
   shared storage — share the Pages URL with your family.

Until step 6 is done, the site shows a "not set up yet" banner and new
entries can't be saved for other visitors.

## Notes / limitations

- jsonblob.com blocks obvious bot/script traffic (e.g. `curl`), but works
  fine from real browsers — this is how the admin-setup button and the whole
  app are designed to run.
- If two people submit at the exact same moment, the very last save wins
  (rare for a small family group, but worth knowing).
- Deleting an item removes it for everyone — there's a confirm step, but no
  undo.
- Data lives on jsonblob.com's free tier, not meant for sensitive
  information — fine for restaurant names and sightseeing ideas.
