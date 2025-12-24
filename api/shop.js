import db from './db.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { user_id, amount } = req.body;
    if (!user_id || !amount) return res.status(400).json({ error: 'Missing parameters' });

    const user = db.getUser(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Здесь будет интеграция с TonConnect, пока просто тест
    db.addBalance(user_id, amount);

    res.status(200).json({ ok: true, message: `Пользователю ${user.username} добавлено ${amount} TON`, balance: user.balance });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
