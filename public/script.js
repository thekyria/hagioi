
async function initMap() {
    const center = { lat: 31.77846303313139, lng: 35.22971821508876 }; // The Holy Sepulchre
    const { Map } = await google.maps.importLibrary("maps");
    const map = new Map(document.getElementById("map"), {
        zoom: 14,
        center: center,
        mapId: "MAIN_MAP_ID",
    });

    const response = await fetch('/api/markers');
    const markers = await response.json();  
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    markers.forEach(marker => {
        new AdvancedMarkerElement({
            map: map,
            title: marker.title,
            position: { lat: marker.lat, lng: marker.lng },
        });
    });
}

async function loadGoogleMapsAPI() {
    const set_response = await fetch('/api/set_cookie');
    if (!set_response.ok) {
        console.error('Failed to set cookie.');
        return null;
    }
    const read_response = await fetch('/api/read_cookie');
    if (!read_response.ok) {
        console.error('Failed to read cookie.');
        return null;
    }
    const read_data = await read_response.json();
    if (read_data.token === 'None') {
        console.error('Google Maps API key is None.');
        return null;
    }
    const token = read_data.token;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${token}&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onerror = function () {
        console.error('Google Maps API failed to load.');
    };
}

// Start loading after DOM is ready
document.addEventListener('DOMContentLoaded', loadGoogleMapsAPI);
