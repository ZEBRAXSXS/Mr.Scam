export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.BOT_TOKEN; // Добавь в Vercel Environment Variables
  const { userId, title, description, payload, amount } = req.body;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendInvoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: userId,
      title,
      description,
      payload,
      currency: 'XTR',
      prices: [{ label: `${amount} Stars`, amount: amount * 100 }]
    })
  });

  const data = await response.json();
  if (data.ok) {
    res.json({ invoice_link: data.result.invoice_link });
  } else {
    res.status(500).json({ error: data.description });
  }
};
