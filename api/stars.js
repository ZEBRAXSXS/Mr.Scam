import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, amount } = JSON.parse(req.body);
  const BOT_TOKEN = process.env.BOT_TOKEN; // из переменных Vercel
  const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN; // из переменных Vercel

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user_id,
        title: 'Premium in Mr. Scam',
        description: `${amount} Stars`,
        payload: `payload_${amount}`,
        provider_token: PROVIDER_TOKEN,
        start_parameter: 'premium',
        currency: 'XTR',
        prices: [{ label: `${amount} Stars`, amount: amount * 100 }]
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
