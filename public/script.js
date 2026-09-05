
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

function initSaintsPanelToggle() {
    const toggleButton = document.getElementById('saints-panel-toggle');
    const panel = document.getElementById('saints-panel');
    if (!toggleButton || !panel) {
        return;
    }

    const mq = window.matchMedia('(max-width: 768px)');

    function syncAriaExpanded() {
        toggleButton.setAttribute(
            'aria-expanded',
            String(mq.matches ? panel.classList.contains('is-open') : true),
        );
    }

    toggleButton.addEventListener('click', () => {
        if (!mq.matches) {
            return;
        }
        const isOpen = panel.classList.toggle('is-open');
        toggleButton.setAttribute('aria-expanded', String(isOpen));
    });

    if (mq.addEventListener) {
        mq.addEventListener('change', syncAriaExpanded);
    } else {
        mq.addListener(syncAriaExpanded);
    }

    syncAriaExpanded();
}

async function initMap() {
    const center = { lat: 31.77846303313139, lng: 35.22971821508876 }; // The Holy Sepulchre
    const { Map: GoogleMap, InfoWindow } = await google.maps.importLibrary("maps");
    const map = new GoogleMap(document.getElementById("map"), {
        zoom: 8,
        center: center,
        mapId: "c7635b66539b4115befcbad4",
        // Require two fingers to pan the map on touch devices, so a single-finger
        // swipe that starts over the map still scrolls the page instead of getting
        // trapped by the map.
        gestureHandling: "cooperative",
    });

    // Defensive fix: on some mobile browsers the map can initialize with a
    // stale/incorrect size (e.g. tiles render blank) if its container's size
    // changes shortly after load (viewport settling, orientation change,
    // toggling the collapsible saints panel, etc.). Nudging Google Maps with
    // a 'resize' event recalculates its internal size and repaints the tiles.
    let resizeTimeoutId;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeoutId);
        resizeTimeoutId = setTimeout(() => {
            const currentCenter = map.getCenter();
            google.maps.event.trigger(map, 'resize');
            if (currentCenter) {
                map.setCenter(currentCenter);
            }
        }, 150);
    });

    const response = await fetch('/data/saints.json');
    const saints = await response.json();
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const infoWindow = new InfoWindow();

    let activePinElements = [];
    let activeInfoWindows = [];

    function clearSelection() {
        activePinElements.forEach((pinElement) => pinElement.classList.remove('marker-active'));
        activePinElements = [];
        activeInfoWindows.forEach((infoWin) => infoWin.close());
        activeInfoWindows = [];
        infoWindow.close();
    }

    function setActiveMarkers(pinElements) {
        activePinElements.forEach((pinElement) => pinElement.classList.remove('marker-active'));
        activePinElements = pinElements;
        activePinElements.forEach((pinElement) => pinElement.classList.add('marker-active'));
    }

    infoWindow.addListener('closeclick', () => clearSelection());
    map.addListener('click', () => clearSelection());

    function createIconImage(saint) {
        const image = document.createElement('img');
        image.src = `assets/icons/${saint.icon}`;
        image.alt = `Icon of ${saint.name}`;
        image.addEventListener('error', () => {
            image.src = 'assets/avatar-placeholder.svg';
        }, { once: true });
        return image;
    }

    function buildSaintInfoContent(saint, location, marker, placements, targetWindow) {
        const content = document.createElement('div');
        content.className = 'saint-info';

        if (placements) {
            const backLink = document.createElement('a');
            backLink.href = '#';
            backLink.className = 'location-picker-back';
            backLink.textContent = '\u2190 Back to list';
            content.appendChild(backLink);

            google.maps.event.addListenerOnce(targetWindow, 'domready', () => {
                backLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    clearSelection();
                    openLocationPicker(placements, marker);
                });
            });
        }

        const title = document.createElement('h2');
        title.textContent = saint.name;

        const meta = document.createElement('p');
        meta.className = 'saint-meta';
        meta.textContent = `${saint.title} — Feast day: ${saint.feastDay}`;

        const locationLabel = document.createElement('p');
        locationLabel.className = 'saint-location';
        locationLabel.textContent = location.label;

        const bio = document.createElement('p');
        bio.textContent = saint.bio;

        content.append(
            createIconImage(saint),
            title,
            meta,
            locationLabel,
            bio
        );

        return content;
    }

    // Selects a saint: highlights and pops up an info window on every one of
    // their markers, and zooms/pans the map to fit all of them.
    // `sourceMarker`/`sourcePlacements` let the info window opened on the
    // marker the user actually clicked keep a "back to list" link when that
    // marker is shared with other saints.
    function selectSaint(saint, markers, sourceMarker = null, sourcePlacements = null) {
        clearSelection();
        setActiveMarkers(markers.map(({ pinElement }) => pinElement));

        activeInfoWindows = markers.map(({ location, marker, placements }) => {
            const infoWin = new InfoWindow();
            const placementsForBackLink = (marker === sourceMarker) ? sourcePlacements : null;
            infoWin.setContent(buildSaintInfoContent(saint, location, marker, placementsForBackLink, infoWin));
            infoWin.addListener('closeclick', () => clearSelection());
            infoWin.open(map, marker);
            return infoWin;
        });

        if (markers.length > 1) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(({ location }) => bounds.extend({ lat: location.lat, lng: location.lng }));
            map.fitBounds(bounds, 60);
        } else {
            map.panTo({ lat: markers[0].location.lat, lng: markers[0].location.lng });
        }
    }

    function openLocationPicker(placements, marker) {
        const content = document.createElement('div');
        const list = document.createElement('ul');
        list.className = 'location-picker';

        placements.forEach(({ saint, location }, index) => {
            const item = document.createElement('li');
            item.dataset.index = index;
            item.tabIndex = 0;
            item.setAttribute('role', 'button');

            const image = createIconImage(saint);
            const text = document.createElement('div');

            const name = document.createElement('span');
            name.className = 'saint-list-name';
            name.textContent = saint.name;

            const label = document.createElement('span');
            label.className = 'saint-list-meta';
            label.textContent = location.label;

            text.append(name, label);
            item.append(image, text);
            list.appendChild(item);
        });

        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            list.querySelectorAll('li').forEach((item) => {
                const activate = () => {
                    const placement = placements[Number(item.dataset.index)];
                    selectSaint(placement.saint, saintMarkersById.get(placement.saint.id), marker, placements);
                };

                item.addEventListener('click', activate);
                item.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        activate();
                    }
                });
            });
        });

        content.appendChild(list);
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    }

    const markerGroupsByKey = new Map();
    const markerGroups = [];

    saints
        .flatMap((saint) => saint.locations.map((location) => ({ saint, location })))
        .forEach((placement) => {
            const key = `${placement.location.lat},${placement.location.lng}`;
            let group = markerGroupsByKey.get(key);

            if (!group) {
                group = {
                    position: { lat: placement.location.lat, lng: placement.location.lng },
                    placements: [],
                };
                markerGroupsByKey.set(key, group);
                markerGroups.push(group);
            }

            group.placements.push(placement);
        });

    markerGroups.forEach((group) => {
        const pin = group.placements.length > 1
            ? new PinElement({ glyph: String(group.placements.length), background: '#4CAF50' })
            : new PinElement();
        const marker = new AdvancedMarkerElement({
            map: map,
            title: group.placements.length === 1
                ? `${group.placements[0].saint.name} \u2014 ${group.placements[0].location.label}`
                : group.placements.map((placement) => placement.saint.name).join(', '),
            position: group.position,
            content: pin.element,
        });

        group.marker = marker;
        group.pinElement = pin.element;
    });

    // one entry per saint, with all of its markers and its parsed feast day
    const entries = saints.map((saint) => {
        const markers = saint.locations.map((location) => {
            const group = markerGroupsByKey.get(`${location.lat},${location.lng}`);
            return {
                location,
                marker: group.marker,
                pinElement: group.pinElement,
                placements: group.placements,
            };
        });
        return { saint, feast: parseFeastDay(saint.feastDay), markers };
    });

    const saintMarkersById = new Map(entries.map(({ saint, markers }) => [saint.id, markers]));

    markerGroups.forEach((group) => {
        const { marker } = group;

        marker.addListener('click', () => {
            if (group.placements.length === 1) {
                const [placement] = group.placements;
                selectSaint(placement.saint, saintMarkersById.get(placement.saint.id));
                return;
            }

            clearSelection();
            openLocationPicker(group.placements, marker);
        });
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
        const visiblePins = new Set();

        entries.forEach(({ saint, feast, markers }) => {
            const matches = isInRange(fromCode, toCode, dayCode(feast.month, feast.day));

            if (!matches) {
                return;
            }

            markers.forEach(({ pinElement }) => visiblePins.add(pinElement));

            const item = document.createElement('li');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'saint-list-name';
            nameSpan.textContent = saint.name;

            const metaSpan = document.createElement('span');
            metaSpan.className = 'saint-list-meta';
            metaSpan.textContent = `${saint.title} — ${saint.feastDay}`;

            item.append(nameSpan, metaSpan);
            item.tabIndex = 0;
            item.setAttribute('role', 'button');

            const activate = () => selectSaint(saint, markers);

            item.addEventListener('click', activate);
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate();
                }
            });
            saintsList.appendChild(item);
        });

        markerGroups.forEach(({ pinElement }) => {
            pinElement.classList.toggle('marker-dimmed', !visiblePins.has(pinElement));
        });
    }

    function initDateFilterControls() {
        [fromMonthSelect, toMonthSelect].forEach(populateMonthSelect);

        const today = new Date();
        const month = today.getMonth();
        const day = today.getDate();
        const clampedDay = Math.min(day, DAYS_IN_MONTH[month]);

        fromMonthSelect.value = month;
        toMonthSelect.value = month;
        populateDaySelect(fromDaySelect, month);
        populateDaySelect(toDaySelect, month);
        fromDaySelect.value = clampedDay;
        toDaySelect.value = clampedDay;

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
document.addEventListener('DOMContentLoaded', () => {
    initSaintsPanelToggle();
    loadGoogleMapsAPI();
});
