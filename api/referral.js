import db from './db.js';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { referrer_id, referred_id } = req.body;
    if (!referrer_id || !referred_id) return res.status(400).json({ error: 'Missing parameters' });

    db.addReferral(referrer_id, referred_id);
    res.status(200).json({ ok: true, message: `Пользователь ${referred_id} привязан к рефереру ${referrer_id}` });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
