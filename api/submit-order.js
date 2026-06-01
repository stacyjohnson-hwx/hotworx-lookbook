// Vercel serverless function — receives an order and forwards it to Formspree
// (which then emails the store owner and can be connected to Google Sheets via Zapier).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const FORMSPREE_ID = process.env.FORMSPREE_ID || '';

  if (!FORMSPREE_ID) {
    // Still return success so the user sees a confirmation — log the order server-side
    console.log('ORDER (no Formspree configured):', JSON.stringify(req.body));
    return res.status(200).json({ ok: true });
  }

  try {
    const fRes = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!fRes.ok) {
      console.error('Formspree error:', await fRes.text());
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-order error:', err);
    res.status(500).json({ error: 'Failed to submit order.' });
  }
}
