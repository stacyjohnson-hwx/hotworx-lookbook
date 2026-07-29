# HOTWORX Studio Lookbook

A simple, mobile-friendly apparel lookbook and ordering site for a HOTWORX studio. Members browse
everything available, pick a size and color, and place an order that emails you. Runs free on
Vercel + Formspree. No coding platform, no database.

**Using a coding assistant (Codex, Claude Code)?** Open this folder in it and say
*"read AGENTS.md and set this up for my studio."* [AGENTS.md](AGENTS.md) has the full technical
walkthrough.

---

## Set it up (about 15 minutes, all free)

You'll create three free accounts: **GitHub**, **Vercel**, **Formspree**.

### 1. Put the code on GitHub
Create a GitHub account, then get this project into a repo on your account (fork it, use it as a
template, or have your assistant push it for you).

### 2. Deploy to Vercel
- Sign up at [vercel.com](https://vercel.com) with GitHub (free "Hobby" plan).
- **Add New → Project → Import** your lookbook repo → **Deploy**.
- You'll get a live link like `your-studio-lookbook.vercel.app`.

### 3. Get orders by email (Formspree)
- Sign up at [formspree.io](https://formspree.io) (free = 50 orders/month; paid ~$10/mo for more).
- Create a form, set the notification email to **you**, and copy the form ID — the `xxxxxxx` in
  `formspree.io/f/xxxxxxx`.
- In Vercel → your project → **Settings → Environment Variables**, add
  `FORMSPREE_ID` = `xxxxxxx`. Then **Deployments → latest → ⋯ → Redeploy**.

### 4. Test
Open your site, add an item, check out with a test name/email, and place the order. You should get
a Formspree email with the details.

---

## Make it yours
| What | Where |
|------|-------|
| Products & prices | `catalog.json` |
| Studio name (checkout) | `index.html` — search "HOTWORX Pewaukee" |
| "Who helped you shop?" staff names | `index.html` — the `fhelper` dropdown |
| Logo | `hotworx-logo.png` |
| Hero photos & headline | top of `index.html` |
| Category tabs | `CATS` in `index.html` |

## Updating later
Edit `catalog.json` (or any file), commit, and push — Vercel redeploys in ~30 seconds. To collect
orders in a Google Sheet, connect Formspree's Google Sheets integration or a Zapier zap.

## Costs
$0 to start (Vercel Hobby + Formspree free). The only likely paid item is Formspree if you exceed
50 orders/month.
