# AGENTS.md — HOTWORX Studio Lookbook

Instructions for a coding agent (Codex, Claude Code, etc.) setting up or maintaining this
project for a HOTWORX studio. Read this fully before making changes.

## What this is
A single-page apparel lookbook + simple ordering site for a HOTWORX studio. Members browse
everything available, pick size/color, and place an order. There is **no build step** and **no
database** — it's static HTML + a JSON catalog + two tiny serverless functions, hosted on Vercel.

## File map
- `index.html` — the entire app (HTML, CSS, JS in one file). Landing page + shop + cart + checkout.
- `catalog.json` — the product data. Editing this changes what the store sells. Array of:
  `{ "name": str, "price": number, "sizes": [str], "colors": [str], "image": url, "category": str, "source": str }`
  The site filters category **chips by keywords in `name`**, not the `category` field.
- `api/submit-order.js` — Vercel serverless function. Receives an order (POST) and forwards it to
  Formspree, which emails the studio owner. Needs env var `FORMSPREE_ID`.
- `api/products.js`, `api/refresh-catalog.js` — optional HOTWORX-store scrapers (see "Refreshing").
- `hotworx-logo.png` — logo (shown white via CSS filter on dark backgrounds).
- `vercel.json` — SPA routing config.

## Run locally
No install needed. Serve the folder statically, e.g. `python3 -m http.server 8000`, open
`http://localhost:8000`. The catalog loads from `./catalog.json` (same origin). Orders will no-op
locally unless the Formspree function is running (that's fine for previewing).

## First-time setup for a new studio
1. **Deploy:** push this repo to the owner's GitHub, then import it in Vercel (vercel.com →
   Add New → Project → Import → Deploy). Vercel auto-deploys on every push to `main`.
2. **Orders → Formspree:** create a form at formspree.io, set its notify email to the owner.
   In Vercel → Settings → Environment Variables add `FORMSPREE_ID` = the form's short id
   (the `xxxxxxx` in `formspree.io/f/xxxxxxx`). Redeploy so it takes effect.
3. **Test:** place a test order on the live site; confirm the owner gets the Formspree email.

## Customization checklist (do these for the new studio)
- **Studio name:** in `index.html`, the checkout authorization line reads "HOTWORX Pewaukee" —
  change to the new studio (search `HOTWORX Pewaukee`).
- **"Who helped you shop?" staff names:** the `<select id="fhelper">` options in `index.html`
  (currently Chrissy/Marisa/Olivia/Synneva) → the studio's staff. The chosen name is sent to
  Formspree as `helpedBy` (for referral/commission tracking).
- **Products:** replace `catalog.json` with the studio's inventory (or reuse as-is if they carry
  the same HOTWORX apparel line).
- **Logo:** replace `hotworx-logo.png` (keep the same filename, or update the `<img src>` refs).
- **Landing hero images + headline/copy:** near the top of `index.html` (`<section class="hero">`
  and the "Our Picks"/"Shop by Style" sections).
- **Category chips:** the `CATS` array in `index.html`. Remove any category the studio doesn't
  carry; `catMatch()` defines how each chip matches product names.

## How orders work
Checkout collects name/email/phone/notes + "who helped" + cart, POSTs JSON to
`/api/submit-order`, which forwards to Formspree → owner's email. To also land orders in a Google
Sheet, connect Formspree's Google Sheets integration (or Zapier: "new submission → add row"). If
you add order fields, they pass through automatically, but a fixed Sheet/Zap mapping may need the
new column added once.

## Design system (keep it consistent)
Editorial / minimal-premium. Warm off-white palette, HOTWORX orange (`--orange:#E85D25`) as the
single accent, Fraunces (serif) for headlines + Inter for body. Product cards are chrome-free
(no borders/shadows) with portrait 4/5 imagery. Category filter is text-tabs with an orange
underline; size filter is bordered pills. Match this when adding UI.

## Deploy
`git add -A && git commit -m "..." && git push origin main`. Vercel deploys in ~30s.

## Refreshing the catalog (HOTWORX franchises only)
hotworxapparel.com is a password-protected Shopify store, so its `products.json` needs the store's
storefront password. `api/refresh-catalog.js` logs in with env var `SHOPIFY_PASSWORD`, pulls live
products, doubles prices, keeps in-stock sizes, drops promo/bulk/ambassador/MTO items, merges the
emilyhsudesigns.com HOTWORX collection, and returns finished catalog data. To refresh: set
`SHOPIFY_PASSWORD` in Vercel, GET `/api/refresh-catalog`, write the `catalog` array to
`catalog.json`, commit, push. (Prices are 2× the store price by rule.)

## Rules
- Prices in `catalog.json` are 2× the underlying store price.
- Only include in-stock sizes.
- Exclude promotional/bulk/ambassador/made-to-order/wholesale items.
