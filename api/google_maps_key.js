
export default function handler(req, res) {
    const key_ = process.env.GOOGLE_MAPS_API_KEY
    res.status(200).json({ key: key_ });
}
