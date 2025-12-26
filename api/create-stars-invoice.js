export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'BOT_TOKEN not configured' });
  }

  const { title, description, payload, amount } = req.body;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload,
        currency: 'XTR',
        prices: [{ label: `${amount} Stars`, amount: amount }] // для XTR — целые звёзды, без *100
      })
    });

    const data = await response.json();

    if (data.ok) {
      res.json({ invoice_link: data.result });
    } else {
      res.status(500).json({ error: data.description || 'Telegram API error' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
