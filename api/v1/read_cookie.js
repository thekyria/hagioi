
import { parse } from 'cookie';
import jwt from 'jsonwebtoken'; 

export default function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.authToken || 'None';
  if (token === 'None') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  // Check if the token is available
  if (!jwtSecret) {
    console.error('JWT_SECRET is not set in environment variables.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ token: decoded });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
