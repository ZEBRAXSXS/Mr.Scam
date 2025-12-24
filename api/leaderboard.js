import users from './db.js';
export default function handler(req, res) {
  res.json(users.sort((a,b)=>b.balance-a.balance));
}
