
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
    const toggleButton = document.getElementById('menu-toggle');
    const panel = document.getElementById('saints-panel');
    if (!toggleButton || !panel) {
        return;
    }

    const setPanelState = (isOpen) => {
        panel.classList.toggle('is-open', isOpen);
        panel.setAttribute('aria-hidden', String(!isOpen));
        if (isOpen) {
            panel.removeAttribute('inert');
        } else {
            panel.setAttribute('inert', '');
        }
        toggleButton.setAttribute('aria-expanded', String(isOpen));
        toggleButton.setAttribute('aria-label', isOpen ? 'Close Feast Days panel' : 'Open Feast Days panel');
    };

    setPanelState(panel.classList.contains('is-open'));

    toggleButton.addEventListener('click', () => {
        const isOpen = !panel.classList.contains('is-open');
        setPanelState(isOpen);
    });
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

    // Maps each AdvancedMarkerElement to its marker group, so the pin shown
    // on the map can be swapped between its default (grey) and active (navy,
    // enlarged) appearance without recreating markers.
    const groupByMarker = new Map();

    let activeMarkers = [];
    let activeInfoWindows = [];

    function clearSelection() {
        activeMarkers.forEach((marker) => {
            const group = groupByMarker.get(marker);
            if (group) {
                marker.content = group.defaultPinElement;
            }
        });
        activeMarkers = [];
        activeInfoWindows.forEach((infoWin) => infoWin.close());
        activeInfoWindows = [];
        infoWindow.close();
    }

    function setActiveMarkers(markers) {
        activeMarkers.forEach((marker) => {
            const group = groupByMarker.get(marker);
            if (group) {
                marker.content = group.defaultPinElement;
            }
        });
        activeMarkers = markers;
        activeMarkers.forEach((marker) => {
            const group = groupByMarker.get(marker);
            if (group) {
                marker.content = group.activePinElement;
            }
        });
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

    // Selects a saint: highlights all of their markers, pops up a single info
    // window on the marker that was actually clicked (or the first one, if
    // none was specified), and zooms/pans the map to fit all of them.
    // `sourceMarker`/`sourcePlacements` let the info window keep a "back to
    // list" link when the clicked marker is shared with other saints.
    function selectSaint(saint, markers, sourceMarker = null, sourcePlacements = null) {
        clearSelection();
        setActiveMarkers(markers.map(({ marker }) => marker));

        const targetEntry = markers.find(({ marker }) => marker === sourceMarker) || markers[0];
        const infoWin = new InfoWindow();
        const placementsForBackLink = (targetEntry.marker === sourceMarker) ? sourcePlacements : null;
        infoWin.setContent(buildSaintInfoContent(saint, targetEntry.location, targetEntry.marker, placementsForBackLink, infoWin));
        infoWin.addListener('closeclick', () => clearSelection());
        infoWin.open(map, targetEntry.marker);
        activeInfoWindows = [infoWin];

        if (markers.length > 1) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(({ location }) => bounds.extend({ lat: location.lat, lng: location.lng }));
            // Generous padding so the fitted markers aren't crammed against
            // the edges of the map (or hidden behind the saints panel).
            map.fitBounds(bounds, 120);
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
        const glyph = group.placements.length > 1 ? String(group.placements.length) : undefined;

        // Unselected markers use a muted, faint grey so they recede into the
        // map; the saint's icon/name (shown in the info window) still carries
        // the color. Selected markers use the site's navy accent and a
        // larger scale, applied by swapping `marker.content` on selection.
        const defaultPin = new PinElement({
            glyph,
            background: '#aab2bd',
            borderColor: '#8a929c',
            glyphColor: '#5b6470',
        });
        const activePin = new PinElement({
            glyph,
            background: '#0a2342',
            borderColor: '#10375c',
            glyphColor: '#e6c669',
            scale: 1.3,
        });
        activePin.element.classList.add('marker-active');

        const marker = new AdvancedMarkerElement({
            map: map,
            title: group.placements.length === 1
                ? `${group.placements[0].saint.name} \u2014 ${group.placements[0].location.label}`
                : group.placements.map((placement) => placement.saint.name).join(', '),
            position: group.position,
            content: defaultPin.element,
        });

        group.marker = marker;
        group.defaultPinElement = defaultPin.element;
        group.activePinElement = activePin.element;
        groupByMarker.set(marker, group);
    });

    // one entry per saint, with all of its markers and its parsed feast day
    const entries = saints.map((saint) => {
        const markers = saint.locations.map((location) => {
            const group = markerGroupsByKey.get(`${location.lat},${location.lng}`);
            return {
                location,
                marker: group.marker,
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
                selectSaint(placement.saint, saintMarkersById.get(placement.saint.id), marker);
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
        const visibleMarkers = new Set();

        entries.forEach(({ saint, feast, markers }) => {
            const matches = isInRange(fromCode, toCode, dayCode(feast.month, feast.day));

            if (!matches) {
                return;
            }

            markers.forEach(({ marker }) => visibleMarkers.add(marker));

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

        markerGroups.forEach(({ marker, defaultPinElement, activePinElement }) => {
            const dimmed = !visibleMarkers.has(marker);
            defaultPinElement.classList.toggle('marker-dimmed', dimmed);
            activePinElement.classList.toggle('marker-dimmed', dimmed);
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
