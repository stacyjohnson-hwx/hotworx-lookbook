// Vercel serverless function — rebuilds the lookbook catalog server-side.
// Logs into the password-protected HOTWORX store, pulls live products, applies
// the lookbook rules (2x price, in-stock sizes only, exclude promo/bulk/etc.),
// merges in the emilyhsudesigns.com HOTWORX collection, and returns catalog.json data.
//
// Requires env var SHOPIFY_PASSWORD (the storefront lock-screen password).
// Usage: GET /api/refresh-catalog  ->  JSON array of catalog items.

const APPAREL_TYPES = new Set(['Tank Tops','Tees','Tees L/S','Bottoms','Outerwear','Yoga','Youth','shorts','Polos','Headwear','Location Tees','Pants']);
const SKIP_TITLE = /\bpkg\b|\bpackage\b|\bpiece\b|\b\d+ ?pc\b|ambassador|made.?to.?order|custom/i;
const MARKUP = 2;

function categoryOf(title) {
  const t = title.toLowerCase();
  if (/legging|jogger|short|pant|sweatpant|7\/8/.test(t)) return 'Bottoms';
  if (/bralette|sports bra|tank|crop top|muscle t/.test(t)) return 'Tanks';
  if (/hoodie|sweatshirt|pullover|zip|jacket|fleece|crewneck/.test(t)) return 'Outerwear';
  if (/polo/.test(t)) return 'Polos';
  if (/onesie|youth|yxl|\bys\b|\bym\b|toddler/.test(t)) return 'Youth';
  if (/tee|t-shirt|shirt|jersey|v-neck|vneck/.test(t)) return 'Tees';
  return 'Apparel';
}

function optIndex(product, re) {
  const o = product.options.find(o => re.test(o.name));
  return o ? product.options.indexOf(o) + 1 : null;
}

function mapProduct(p, source) {
  const avail = p.variants.filter(v => v.available);
  if (!avail.length) return null;
  const sI = optIndex(p, /size/i);
  const cI = optIndex(p, /color|colour/i);
  const sizes = sI ? [...new Set(avail.map(v => v['option' + sI]).filter(Boolean))] : [];
  const colors = cI ? [...new Set(avail.map(v => v['option' + cI]).filter(Boolean))] : [];
  // drop bulk/wholesale (sizes like "25 Piece Pkg") and sizeless items
  if (!sizes.length || sizes.some(s => /pkg|piece/i.test(s))) return null;
  const price = +(Math.min(...p.variants.map(v => parseFloat(v.price))) * MARKUP).toFixed(2);
  return {
    name: p.title,
    price,
    sizes,
    colors,
    image: (p.images[0]?.src || '').replace(/\?v=\d+/, ''),
    category: categoryOf(p.title),
    source,
  };
}

async function storeLogin(storeUrl, pass) {
  const loginRes = await fetch(`${storeUrl}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
    body: `form_type=storefront_password&utf8=%E2%9C%93&password=${encodeURIComponent(pass)}`,
    redirect: 'manual',
  });
  const raw = loginRes.headers.get('set-cookie') || '';
  const m = raw.match(/storefront_digest=[^;]+/);
  return m ? m[0] : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const STORE_URL = process.env.SHOPIFY_STORE_URL || 'https://hotworxapparel.com';
  const STORE_PASS = process.env.SHOPIFY_PASSWORD || '';

  try {
    // ── HOTWORX (password-protected) ──
    const cookie = await storeLogin(STORE_URL, STORE_PASS);
    if (!cookie) {
      return res.status(401).json({ error: 'Could not authenticate with the store. Check SHOPIFY_PASSWORD.' });
    }
    const hwxRes = await fetch(`${STORE_URL}/products.json?limit=250`, {
      headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' },
    });
    if (!hwxRes.ok) return res.status(hwxRes.status).json({ error: 'Failed to fetch store products.' });
    const hwxData = await hwxRes.json();
    const hwx = hwxData.products
      .filter(p => APPAREL_TYPES.has(p.product_type) && !SKIP_TITLE.test(p.title))
      .map(p => mapProduct(p, 'hotworxapparel.com'))
      .filter(Boolean);

    // ── Emily Hsu (public) ──
    let eh = [];
    try {
      const ehRes = await fetch('https://emilyhsudesigns.com/collections/hotworx-collection/products.json?limit=250', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (ehRes.ok) {
        const ehData = await ehRes.json();
        eh = ehData.products.map(p => mapProduct(p, 'emilyhsudesigns.com')).filter(Boolean);
      }
    } catch (_) { /* Emily is a nice-to-have; store items are the core */ }

    const catalog = [...hwx, ...eh];
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ count: catalog.length, hotworx: hwx.length, emily: eh.length, catalog });
  } catch (err) {
    console.error('refresh-catalog error:', err);
    res.status(500).json({ error: 'Internal server error.', detail: String(err) });
  }
}
