import db from './db.js';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { user_id, username, first_name } = req.body;
    if (!user_id) return res.status(400).json({ error: 'No user_id' });

    const user = db.createUser(user_id, username, first_name);
    res.status(200).json({ ok: true, user });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
