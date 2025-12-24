import users from './db.js';
export default function handler(req,res) {
  const { userId, amount } = req.body;
  let u = users.find(u=>u.userId===userId);
  if(u) u.balance += amount;
  res.json({ok:true, user:u});
}
