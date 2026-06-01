// Vercel serverless function — fetches HOTWORX Apparel catalog with auth
// and applies the configured price markup before returning to the client.

export default async function handler(req, res) {
  // Allow CORS for the same Vercel domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const STORE_URL   = process.env.SHOPIFY_STORE_URL  || 'https://hotworxapparel.com';
  const STORE_PASS  = process.env.SHOPIFY_PASSWORD   || '';
  const MARKUP      = parseFloat(process.env.PRICE_MARKUP || '2.0');

  try {
    // Step 1: Authenticate with the password-protected Shopify store
    const loginRes = await fetch(`${STORE_URL}/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
      },
      body: `form_type=storefront_password&utf8=%E2%9C%93&password=${encodeURIComponent(STORE_PASS)}`,
      redirect: 'manual',
    });

    // Extract the storefront_digest cookie
    const rawCookies = loginRes.headers.get('set-cookie') || '';
    const digestMatch = rawCookies.match(/storefront_digest=[^;]+/);
    const sessionCookie = digestMatch ? digestMatch[0] : '';

    if (!sessionCookie) {
      return res.status(401).json({ error: 'Could not authenticate with the Shopify store. Check SHOPIFY_PASSWORD.' });
    }

    // Step 2: Fetch products with the session cookie
    const productsRes = await fetch(`${STORE_URL}/products.json?limit=250`, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!productsRes.ok) {
      return res.status(productsRes.status).json({ error: 'Failed to fetch products from Shopify.' });
    }

    const data = await productsRes.json();

    // Step 3: Apply price markup and shape the catalog
    const products = data.products.map(p => ({
      title: p.title,
      handle: p.handle,
      image: p.images[0]?.src || null,
      images: p.images.slice(0, 4).map(i => i.src),
      options: p.options.map(o => ({ name: o.name, values: o.values })),
      price_min: (Math.min(...p.variants.map(v => parseFloat(v.price))) * MARKUP).toFixed(2),
      variants: p.variants
        .filter(v => v.available)
        .map(v => ({
          id: v.id,
          title: v.title,
          price: (parseFloat(v.price) * MARKUP).toFixed(2),
        })),
    })).filter(p => p.variants.length > 0); // only show in-stock items

    // Cache for 1 hour on Vercel's CDN edge
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({ products });

  } catch (err) {
    console.error('products API error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}
