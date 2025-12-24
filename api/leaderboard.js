import db from './db.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const leaderboard = db.getLeaderboard();
    res.status(200).json({ ok: true, leaderboard });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
