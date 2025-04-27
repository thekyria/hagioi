
export default async function handler(req, res) {
    const markers = [
        { title: "Holy Sepulchre", lat: 31.77846303313139, lng: 35.22971821508876 },
        { title: "Louvre Museum", lat: 48.8606, lng: 2.3376 }
    ];

    res.status(200).json(markers);
}
