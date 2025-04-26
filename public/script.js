
async function getApiKey() {
    const response = await fetch('/api/google_maps_key');
    const data = await response.json();
    return data.key;
}

async function initMap() {
    const center = { lat: 31.77846303313139, lng: 35.22971821508876 }; // The Holy Sepulchre

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: center,
    });

    const markers = [
        { position: center, title: "Holy Sepulchre" },
        { position: { lat: 48.8606, lng: 2.3376 }, title: "The Louvre" },
    ];

    markers.forEach(markerInfo => {
        new google.maps.Marker({
            position: markerInfo.position,
            map: map,
            title: markerInfo.title,
        });
    });
}

async function loadGoogleMapsAPI() {
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.error('Google Maps API key is not defined.');
        return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onerror = function () {
        console.error('Google Maps API failed to load.');
    };
}

// Start loading after DOM is ready
document.addEventListener('DOMContentLoaded', loadGoogleMapsAPI);
