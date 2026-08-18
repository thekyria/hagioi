
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
// non-leap-year day counts, since feast days recur every year with no fixed year
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function parseFeastDay(feastDay) {
    const [monthName, dayStr] = feastDay.split(' ');
    return { month: MONTH_NAMES.indexOf(monthName), day: parseInt(dayStr, 10) };
}

function dayCode(month, day) {
    return month * 100 + day;
}

function isInRange(fromCode, toCode, testCode) {
    if (fromCode <= toCode) {
        return testCode >= fromCode && testCode <= toCode;
    }
    // wraps around the Dec 31 -> Jan 1 boundary
    return testCode >= fromCode || testCode <= toCode;
}

function populateMonthSelect(select) {
    MONTH_NAMES.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        select.appendChild(option);
    });
}

function populateDaySelect(select, month) {
    const daysInMonth = DAYS_IN_MONTH[month];
    const previousValue = Number(select.value) || 1;
    select.innerHTML = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        select.appendChild(option);
    }
    select.value = Math.min(previousValue, daysInMonth);
}

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
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const infoWindow = new InfoWindow();

    function showInfoWindow(saint, location, marker) {
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
    }

    // one entry per saint, with all of its markers and its parsed feast day
    const entries = saints.map(saint => {
        const markers = saint.locations.map(location => {
            const pin = new PinElement();
            const marker = new AdvancedMarkerElement({
                map: map,
                title: `${saint.name} \u2014 ${location.label}`,
                position: { lat: location.lat, lng: location.lng },
                content: pin.element,
            });
            marker.addListener('click', () => showInfoWindow(saint, location, marker));
            return { location, marker, pinElement: pin.element };
        });
        return { saint, feast: parseFeastDay(saint.feastDay), markers };
    });

    const saintsList = document.getElementById('saints-list');
    const fromMonthSelect = document.getElementById('from-month');
    const fromDaySelect = document.getElementById('from-day');
    const toMonthSelect = document.getElementById('to-month');
    const toDaySelect = document.getElementById('to-day');

    function applyFilter() {
        const fromCode = dayCode(Number(fromMonthSelect.value), Number(fromDaySelect.value));
        const toCode = dayCode(Number(toMonthSelect.value), Number(toDaySelect.value));

        saintsList.innerHTML = '';

        entries.forEach(({ saint, feast, markers }) => {
            const matches = isInRange(fromCode, toCode, dayCode(feast.month, feast.day));

            markers.forEach(({ pinElement }) => {
                pinElement.classList.toggle('marker-dimmed', !matches);
            });

            if (!matches) {
                return;
            }

            const item = document.createElement('li');
            item.innerHTML = `
                <span class="saint-list-name">${saint.name}</span>
                <span class="saint-list-meta">${saint.title} \u2014 ${saint.feastDay}</span>
            `;
            item.addEventListener('click', () => {
                const first = markers[0];
                map.panTo(first.location);
                showInfoWindow(saint, first.location, first.marker);
            });
            saintsList.appendChild(item);
        });
    }

    function initDateFilterControls() {
        [fromMonthSelect, toMonthSelect].forEach(populateMonthSelect);

        const today = new Date();
        fromMonthSelect.value = today.getMonth();
        toMonthSelect.value = today.getMonth();
        populateDaySelect(fromDaySelect, today.getMonth());
        populateDaySelect(toDaySelect, today.getMonth());
        fromDaySelect.value = today.getDate();
        toDaySelect.value = today.getDate();

        fromMonthSelect.addEventListener('change', () => {
            populateDaySelect(fromDaySelect, Number(fromMonthSelect.value));
            applyFilter();
        });
        toMonthSelect.addEventListener('change', () => {
            populateDaySelect(toDaySelect, Number(toMonthSelect.value));
            applyFilter();
        });
        fromDaySelect.addEventListener('change', applyFilter);
        toDaySelect.addEventListener('change', applyFilter);
    }

    initDateFilterControls();
    applyFilter();
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
