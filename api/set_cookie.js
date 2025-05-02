
import { serialize } from 'cookie';

export default function handler(req, res) {
  const token = process.env.GOOGLE_MAPS_API_KEY;

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
