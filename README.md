# Busan & Jeju Trip Wishlist

A tiny bilingual (English main / Korean) website for collecting what everyone
wants to eat, do, see, and where to stay for the trip:

- Busan: Dec 22 (Tue) – Dec 23 (Wed)
- Jeju: Dec 23 (Wed) night – Dec 26 (Sat) night

No login required for anyone — open the link, type your name, add items.
Everyone sees the same shared list, updated live.

## How it stores data

Text data (wishlist items, likes, comments) uses [Firebase
Firestore](https://firebase.google.com/docs/firestore), called directly from
each visitor's browser via the Firebase Web SDK (loaded from CDN, no build
step).

Photos go through [ImgBB](https://api.imgbb.com/) instead of Firebase
Storage — Firebase Storage now requires the billing-enabled Blaze plan even
for free-tier usage, while ImgBB's free API needs only an email signup, no
card. The client compresses each photo (max 1600px, JPEG) before upload.

There's no server to run and no account needed for people using the site —
only the project owner needs the free Firebase project and the free ImgBB
API key.

## One-time setup (already done for this deployment)

1. Create a Firebase project at https://console.firebase.google.com.
2. Build → Firestore Database → create a database (any region) in test
   mode.
3. In the **Rules** tab, replace the default (time-limited) rule with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   This has no expiry, unlike the default test-mode rule (which expires in
   30 days) — needed since the trip is in December.
4. Project settings → your apps → add a Web app → copy the `firebaseConfig`
   object into `config.js` as `FIREBASE_CONFIG`.
5. Get a free API key at https://api.imgbb.com/ (email signup only) → put it
   in `config.js` as `IMGBB_API_KEY`.
6. Push to GitHub and enable GitHub Pages (Settings → Pages → Deploy from
   branch → `master` / root).

The app creates its single Firestore document (`wishlist/data`) automatically
on first write — no manual initialization needed.

## Notes / limitations

- Open security rules (`allow read, write: if true`) mean anyone with the
  Firestore config (which is public in the page source) could technically
  write to this database directly, not just through the site's UI. Fine for
  a casual family trip list — don't store anything sensitive in it.
- Deleting an item removes it for everyone — there's a confirm step, but no
  undo.
- Firestore's free tier (Spark plan) comfortably covers a small family trip's
  worth of reads/writes.
- Deleting a photo only removes it from the wishlist item — the image stays
  hosted on ibb.co (publicly viewable by anyone with its direct link, like
  any image link). Fine for trip snapshots, not for anything private.
