export default function handler(req, res) {
  const online = Math.floor(Math.random() * 400) + 100;  // 100–500
  res.status(200).json({ online });
}
