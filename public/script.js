
async function initMap() {
    const center = { lat: 31.77846303313139, lng: 35.22971821508876 }; // The Holy Sepulchre
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    const map = new Map(document.getElementById("map"), {
        zoom: 8,
        center: center,
        mapId: "MAIN_MAP_ID",
    });

    const response = await fetch('/data/saints.json');
    const saints = await response.json();
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const infoWindow = new InfoWindow();

    saints.forEach(saint => {
        saint.locations.forEach(location => {
            const marker = new AdvancedMarkerElement({
                map: map,
                title: `${saint.name} \u2014 ${location.label}`,
                position: { lat: location.lat, lng: location.lng },
            });

            marker.addListener('click', () => {
                infoWindow.setContent(`
                    <div class="saint-info">
                        <img src="assets/icons/${saint.icon}" alt="Icon of ${saint.name}" onerror="this.onerror=null;this.src='assets/avatar-placeholder.svg';">
                        <h2>${saint.name}</h2>
                        <p class="saint-meta">${saint.title} \u2014 Feast day: ${saint.feastDay}</p>
                        <p class="saint-location">${location.label}</p>
                        <p>${saint.bio}</p>
                    </div>
                `);
                infoWindow.open(map, marker);
            });
        });
    });
}

async function loadGoogleMapsAPI() {
    const config_response = await fetch('/api/v1/config');
    if (!config_response.ok) {
        console.error('Failed to load config.');
        return null;
    }
    const config = await config_response.json();
    const apiKey = config.apiKey;
    if (!apiKey) {
        console.error('API key is not available.');
        return null;
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
