export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, order_id, redirect_url } = req.body;

  if (!amount || !order_id || !redirect_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUMUP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: 'CHF',
        checkout_reference: order_id,
        description: description || 'Commande KaïKaï',
        merchant_code: process.env.SUMUP_MERCHANT_CODE,
        redirect_url,
        hosted_checkout: { enabled: true },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[KaïKaï] SumUp error:', data);
      return res.status(response.status).json({ error: data.message || 'Erreur SumUp' });
    }

    return res.status(200).json({ checkout_url: data.hosted_checkout_url });
  } catch (err) {
    console.error('[KaïKaï] SumUp network error:', err);
    return res.status(500).json({ error: 'Impossible de contacter SumUp' });
  }
}
