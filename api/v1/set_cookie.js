
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const jwtSecret = process.env.JWT_SECRET;

  // Check if the token is available
  if (!apiKey || !jwtSecret) {
    console.error('GOOGLE_MAPS_API_KEY or JWT_SECRET is not set in environment variables.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  // Generate a signed JWT token
  const token = jwt.sign({ apiKey }, jwtSecret, { expiresIn: '1h' });

  console.log(process.env.NODE_ENV === 'production')
  const cookie = serialize('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({ message: 'Cookie set' });
}
