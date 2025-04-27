
export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    // Currently, the API only supports GET requests
    if (req.method === 'GET') {
        const key_ = process.env.GOOGLE_MAPS_API_KEY
        res.status(200).json({ key: key_ });
    }
}
