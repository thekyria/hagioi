
import { parse } from 'cookie';

export default function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.authToken || 'None';
  res.status(200).json({ token });
}
