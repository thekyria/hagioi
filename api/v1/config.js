// Serves public client config. Security relies on HTTP-referrer restriction
// configured on the API key in Google Cloud Console, not on this endpoint.
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  res.status(200).json({ apiKey });
}
