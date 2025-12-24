import users from './db.js';
export default function handler(req,res) {
  const { userId, username } = req.body;
  let u = users.find(u=>u.userId===userId);
  if(!u) {
    u={userId, username, balance:0};
    users.push(u);
  }
  res.json({ok:true, user:u});
}
