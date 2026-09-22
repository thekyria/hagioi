
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
// Fixed feast parsing/date filters intentionally use non-leap month lengths,
// since the data model stores recurring month/day feasts without a leap-day variant.
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const NEARBY_RADIUS_KM = 100;
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function haversineDistanceKm(from, to) {
    const latDelta = toRadians(to.lat - from.lat);
    const lngDelta = toRadians(to.lng - from.lng);
    const fromLat = toRadians(from.lat);
    const toLat = toRadians(to.lat);
    const a = Math.sin(latDelta / 2) ** 2
        + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

function formatApproxDistance(distanceKm) {
    if (distanceKm < 1) {
        return 'under 1 km';
    }
    if (distanceKm < 10) {
        return `${Math.round(distanceKm)} km`;
    }
    return `${Math.round(distanceKm / 5) * 5} km`;
}

function parseFeastDay(feastDay) {
    const [monthName, dayStr] = feastDay.split(' ');
    const month = MONTH_NAMES.indexOf(monthName);
    const day = parseInt(dayStr, 10);

    if (month < 0 || !Number.isInteger(day) || day < 1 || day > DAYS_IN_MONTH[month]) {
        return null;
    }

    return { month, day };
}

function dayCode(month, day) {
    return month * 100 + day;
}

function isLeapYear(year) {
    return new Date(year, 1, 29).getMonth() === 1;
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

function initSlidePanelToggle(toggleButtonId, panelId, { openLabel, closeLabel }) {
    const toggleButton = document.getElementById(toggleButtonId);
    const panel = document.getElementById(panelId);
    if (!toggleButton || !panel) {
        return null;
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
        toggleButton.setAttribute('aria-label', isOpen ? closeLabel : openLabel);
    };

    setPanelState(panel.classList.contains('is-open'));

    toggleButton.addEventListener('click', () => {
        const isOpen = !panel.classList.contains('is-open');
        setPanelState(isOpen);
    });

    return setPanelState;
}

function initPanelToggles() {
    initSlidePanelToggle('menu-toggle', 'saints-panel', {
        openLabel: 'Open Feast Days panel',
        closeLabel: 'Close Feast Days panel',
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
            // Generous padding with extra bottom padding so fitted markers
            // aren't crammed against map edges, panel, or bottom controls/footer.
            map.fitBounds(bounds, { top: 100, right: 100, bottom: 240, left: 100 });
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
        // the color. Selected markers use a vibrant, intense crimson red and a
        // larger scale, applied by swapping `marker.content` on selection.
        const defaultPin = new PinElement({
            glyph,
            background: '#aab2bd',
            borderColor: '#8a929c',
            glyphColor: '#5b6470',
        });
        const activePin = new PinElement({
            glyph,
            background: '#e63946',
            borderColor: '#9b111e',
            glyphColor: '#ffffff',
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
    const calendarPrevMonthButton = document.getElementById('calendar-prev-month');
    const calendarNextMonthButton = document.getElementById('calendar-next-month');
    const calendarMonthLabel = document.getElementById('calendar-month-label');
    const calendarStatus = document.getElementById('calendar-status');
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarResultsSummary = document.getElementById('calendar-results-summary');
    const calendarResultsList = document.getElementById('calendar-results-list');
    const nearbyDiscoverySection = document.getElementById('nearby-discovery');
    const nearbyFindButton = document.getElementById('nearby-find-button');
    const nearbyStatus = document.getElementById('nearby-status');
    const nearbyResults = document.getElementById('nearby-results');

    let isLocatingNearby = false;
    let userLocationMarker = null;

    function applyFilter() {
        saintsList.innerHTML = '';
        const visibleMarkers = new Set();

        const fromCode = dayCode(Number(fromMonthSelect.value), Number(fromDaySelect.value));
        const toCode = dayCode(Number(toMonthSelect.value), Number(toDaySelect.value));
        const matchingEntries = entries.filter(({ feast }) => feast && isInRange(fromCode, toCode, dayCode(feast.month, feast.day)));

        matchingEntries.forEach(({ saint, markers }) => {
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

    const nearbyLocationCandidates = Array.from(
        saints
            .flatMap((saint) => saint.locations.map((location) => ({ saint, location })))
            .reduce((uniqueCandidates, candidate) => {
                const key = `${candidate.saint.id}|${candidate.location.label}|${candidate.location.lat}|${candidate.location.lng}`;
                if (!uniqueCandidates.has(key)) {
                    uniqueCandidates.set(key, candidate);
                }
                return uniqueCandidates;
            }, new Map())
            .values()
    );

    function setNearbyBusy(isBusy) {
        isLocatingNearby = isBusy;
        if (nearbyFindButton) {
            nearbyFindButton.disabled = isBusy;
            nearbyFindButton.textContent = isBusy
                ? 'Finding saint-associated locations near you...'
                : `Find saint-associated locations near me (within ${NEARBY_RADIUS_KM} km)`;
        }
        if (nearbyDiscoverySection) {
            nearbyDiscoverySection.setAttribute('aria-busy', String(isBusy));
        }
    }

    function setNearbyStatus(message) {
        if (nearbyStatus) {
            nearbyStatus.textContent = message;
        }
    }

    function findMarkerEntryForLocation(saintId, location) {
        const markers = saintMarkersById.get(saintId) || [];
        return markers.find(({ location: markerLocation }) => {
            return markerLocation === location
                || (
                    markerLocation.label === location.label
                    && markerLocation.lat === location.lat
                    && markerLocation.lng === location.lng
                );
        });
    }

    function renderNearbyResults(results) {
        if (!nearbyResults) {
            return;
        }
        nearbyResults.innerHTML = '';

        results.forEach(({ saint, location, distanceKm }) => {
            const item = document.createElement('li');
            item.className = 'nearby-result';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'saint-list-name';
            nameSpan.textContent = saint.name;

            const labelSpan = document.createElement('span');
            labelSpan.className = 'saint-list-meta';
            labelSpan.textContent = location.label;

            const distanceSpan = document.createElement('span');
            distanceSpan.className = 'nearby-result-distance';
            distanceSpan.textContent = `Approx. ${formatApproxDistance(distanceKm)} away`;

            item.append(nameSpan, labelSpan, distanceSpan);

            const activate = () => {
                const markers = saintMarkersById.get(saint.id) || [];
                const markerEntry = findMarkerEntryForLocation(saint.id, location);
                if (markerEntry) {
                    const sharedPlacements = markerEntry.placements.length > 1 ? markerEntry.placements : null;
                    selectSaint(saint, markers, markerEntry.marker, sharedPlacements);
                } else if (markers.length > 0) {
                    selectSaint(saint, markers);
                }
            };

            item.addEventListener('click', activate);
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activate();
                }
            });

            nearbyResults.appendChild(item);
        });
    }

    function updateUserLocationMarker(userPosition) {
        if (!userLocationMarker) {
            const markerElement = document.createElement('div');
            markerElement.className = 'user-location-marker';
            userLocationMarker = new AdvancedMarkerElement({
                map,
                position: userPosition,
                title: 'Your location',
                content: markerElement,
            });
            return;
        }

        userLocationMarker.position = userPosition;
        userLocationMarker.map = map;
    }

    function fitMapToNearbyResults(userPosition, results) {
        if (results.length === 0) {
            map.panTo(userPosition);
            map.setZoom(9);
            return;
        }

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userPosition);
        results.forEach(({ location }) => bounds.extend({ lat: location.lat, lng: location.lng }));
        map.fitBounds(bounds, { top: 100, right: 100, bottom: 220, left: 100 });
    }

    function getNearbyResults(userPosition) {
        return nearbyLocationCandidates
            .map((candidate) => ({
                ...candidate,
                distanceKm: haversineDistanceKm(userPosition, {
                    lat: candidate.location.lat,
                    lng: candidate.location.lng,
                }),
            }))
            .filter(({ distanceKm }) => distanceKm <= NEARBY_RADIUS_KM)
            .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    function getGeolocationErrorMessage(error) {
        if (!error) {
            return 'We could not read your location. Please try again.';
        }

        if (error.code === error.PERMISSION_DENIED) {
            return 'Location access was denied. Allow location in your browser and try again.';
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
            return 'Your location is currently unavailable. Check device location settings and try again.';
        }
        if (error.code === error.TIMEOUT) {
            return 'Location lookup timed out. Please try again in a clearer-signal area.';
        }
        return 'We could not read your location. Please try again.';
    }

    function initNearbyDiscovery() {
        if (!nearbyFindButton) {
            return;
        }

        nearbyFindButton.textContent = `Find saint-associated locations near me (within ${NEARBY_RADIUS_KM} km)`;

        nearbyFindButton.addEventListener('click', () => {
            if (isLocatingNearby) {
                return;
            }

            if (!navigator.geolocation) {
                setNearbyStatus('Your browser does not support location lookup. You can still browse saints by map, date, or name.');
                return;
            }

            setNearbyBusy(true);
            setNearbyStatus('Requesting your location for an in-browser nearby lookup...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    const nearbyMatches = getNearbyResults(userPosition);
                    updateUserLocationMarker(userPosition);
                    fitMapToNearbyResults(userPosition, nearbyMatches);
                    renderNearbyResults(nearbyMatches);

                    if (nearbyMatches.length === 0) {
                        setNearbyStatus(`No saint-associated locations were found within ${NEARBY_RADIUS_KM} km of your location.`);
                    } else {
                        setNearbyStatus(
                            `Found ${nearbyMatches.length} saint-associated location${nearbyMatches.length === 1 ? '' : 's'} within ${NEARBY_RADIUS_KM} km of your location.`
                        );
                    }

                    setNearbyBusy(false);
                },
                (error) => {
                    setNearbyStatus(getGeolocationErrorMessage(error));
                    setNearbyBusy(false);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000,
                }
            );
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

    // Movable feasts such as "Third Sunday of Pascha" cannot be placed in this
    // fixed month/day calendar, so only entries with concrete annual dates are shown.
    const fixedFeastEntries = entries
        .filter(({ feast }) => feast)
        .sort((a, b) => {
            if (a.feast.month !== b.feast.month) {
                return a.feast.month - b.feast.month;
            }
            if (a.feast.day !== b.feast.day) {
                return a.feast.day - b.feast.day;
            }
            return a.saint.name.localeCompare(b.saint.name);
        });

    const feastEntriesByDay = fixedFeastEntries.reduce((daysMap, entry) => {
        const key = dayCode(entry.feast.month, entry.feast.day);
        const dayEntries = daysMap.get(key) || [];
        dayEntries.push(entry);
        daysMap.set(key, dayEntries);
        return daysMap;
    }, new Map());

    const today = new Date();
    let currentCalendarMonth = today.getMonth();
    let currentCalendarYear = today.getFullYear();
    let selectedCalendarDay = null;

    function formatMonthDay(month, day) {
        return `${MONTH_NAMES[month]} ${day}`;
    }

    function getCalendarDayEntries(month, day) {
        return feastEntriesByDay.get(dayCode(month, day)) || [];
    }

    function getUniqueLocationLabels(markers) {
        return Array.from(new Set(markers.map(({ location }) => location.label)));
    }

    function renderCalendarResults() {
        if (!calendarResultsSummary || !calendarResultsList) {
            return;
        }

        calendarResultsList.innerHTML = '';

        if (selectedCalendarDay === null) {
            calendarResultsSummary.textContent = 'Choose a highlighted day to list saints and their associated map location(s).';
            return;
        }

        const selectedEntries = getCalendarDayEntries(currentCalendarMonth, selectedCalendarDay);
        const selectedLabel = formatMonthDay(currentCalendarMonth, selectedCalendarDay);

        if (selectedEntries.length === 0) {
            calendarResultsSummary.textContent = `No fixed-date feast entries are listed for ${selectedLabel}.`;
            return;
        }

        calendarResultsSummary.textContent = `${selectedEntries.length} saint${selectedEntries.length === 1 ? '' : 's'} on ${selectedLabel}. Select a saint to open associated map location details.`;

        selectedEntries.forEach(({ saint, markers }) => {
            const item = document.createElement('li');
            item.className = 'calendar-result';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'calendar-result-button';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'saint-list-name';
            nameSpan.textContent = saint.name;

            const metaSpan = document.createElement('span');
            metaSpan.className = 'saint-list-meta';
            metaSpan.textContent = `${saint.title} — ${saint.feastDay}`;

            const locationSpan = document.createElement('span');
            locationSpan.className = 'calendar-result-location';
            const locationLabels = getUniqueLocationLabels(markers);
            locationSpan.textContent = locationLabels.length === 1
                ? `Associated map location: ${locationLabels[0]}`
                : `Associated map locations: ${locationLabels.join(' • ')}`;

            button.setAttribute(
                'aria-label',
                `${saint.name}, ${saint.title}, feast day ${saint.feastDay}. Show ${locationLabels.length} associated map location${locationLabels.length === 1 ? '' : 's'}.`
            );
            button.append(nameSpan, metaSpan, locationSpan);
            button.addEventListener('click', () => selectSaint(saint, markers));

            item.appendChild(button);
            calendarResultsList.appendChild(item);
        });
    }

    function selectCalendarDay(day) {
        selectedCalendarDay = day;
        renderCalendar(false);
        renderCalendarResults();
    }

    function changeCalendarMonth(delta) {
        currentCalendarMonth += delta;
        if (currentCalendarMonth < 0) {
            currentCalendarMonth = MONTH_NAMES.length - 1;
            currentCalendarYear -= 1;
        } else if (currentCalendarMonth >= MONTH_NAMES.length) {
            currentCalendarMonth = 0;
            currentCalendarYear += 1;
        }

        selectedCalendarDay = null;
        renderCalendar();
        renderCalendarResults();
    }

    function renderCalendar(updateStatus = true) {
        if (!calendarGrid || !calendarMonthLabel || !calendarStatus) {
            return;
        }

        calendarGrid.innerHTML = '';
        calendarMonthLabel.textContent = MONTH_NAMES[currentCalendarMonth];

        const firstWeekday = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
        const daysInMonth = currentCalendarMonth === 1 && isLeapYear(currentCalendarYear)
            ? 29
            : DAYS_IN_MONTH[currentCalendarMonth];
        const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
        let feastDayCount = 0;
        let feastSaintCount = 0;

        for (let startIndex = 0; startIndex < totalCells; startIndex += 7) {
            const row = document.createElement('tr');

            for (let weekdayIndex = 0; weekdayIndex < 7; weekdayIndex += 1) {
                const cell = document.createElement('td');
                const day = startIndex + weekdayIndex - firstWeekday + 1;

                if (day < 1 || day > daysInMonth) {
                    cell.className = 'feast-calendar-empty';
                    cell.setAttribute('aria-hidden', 'true');
                    row.appendChild(cell);
                    continue;
                }

                // February 29 is shown only to preserve leap-year weekday layout;
                // the fixed annual feast dataset does not assign entries to it.
                const isLeapDay = currentCalendarMonth === 1 && day === 29;
                const dayEntries = isLeapDay ? [] : getCalendarDayEntries(currentCalendarMonth, day);
                if (dayEntries.length > 0) {
                    feastDayCount += 1;
                    feastSaintCount += dayEntries.length;

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'feast-calendar-day';
                    button.setAttribute('aria-pressed', String(selectedCalendarDay === day));
                    button.setAttribute(
                        'aria-label',
                        `${formatMonthDay(currentCalendarMonth, day)}, ${WEEKDAY_NAMES[(startIndex + weekdayIndex) % 7]}, ${dayEntries.length} saint${dayEntries.length === 1 ? '' : 's'}`
                    );
                    if (selectedCalendarDay === day) {
                        button.classList.add('is-selected');
                    }

                    const numberSpan = document.createElement('span');
                    numberSpan.className = 'feast-calendar-day-number';
                    numberSpan.textContent = day;

                    const countSpan = document.createElement('span');
                    countSpan.className = 'feast-calendar-day-count';
                    countSpan.textContent = `${dayEntries.length} saint${dayEntries.length === 1 ? '' : 's'}`;

                    button.append(numberSpan, countSpan);
                    button.addEventListener('click', () => selectCalendarDay(day));
                    cell.appendChild(button);
                } else {
                    const dayLabel = document.createElement('span');
                    dayLabel.className = 'feast-calendar-day-label';
                    dayLabel.textContent = day;
                    if (isLeapDay) {
                        dayLabel.classList.add('feast-calendar-day-label-muted');
                    }
                    cell.appendChild(dayLabel);
                }

                row.appendChild(cell);
            }

            calendarGrid.appendChild(row);
        }

        if (updateStatus) {
            calendarStatus.textContent = feastDayCount === 0
                ? `No fixed-date feast entries are listed in ${MONTH_NAMES[currentCalendarMonth]}.`
                : `${MONTH_NAMES[currentCalendarMonth]} has ${feastDayCount} feast day${feastDayCount === 1 ? '' : 's'} covering ${feastSaintCount} saint${feastSaintCount === 1 ? '' : 's'}.`;
        }
    }

    function initFeastCalendar() {
        if (!calendarPrevMonthButton || !calendarNextMonthButton || !calendarGrid) {
            return;
        }

        calendarPrevMonthButton.addEventListener('click', () => changeCalendarMonth(-1));
        calendarNextMonthButton.addEventListener('click', () => changeCalendarMonth(1));
        renderCalendar();
        renderCalendarResults();
    }

    // Alphabetical "search by name" popup: a separate, always-complete
    // A-Z list of every saint (independent of the feast-day range filter
    // above), which can be scrolled or narrowed by typing.
    function initSaintSearchModal() {
        const openButton = document.getElementById('saint-search-open');
        const modal = document.getElementById('saint-search-modal');
        const searchInput = document.getElementById('saint-search-input');
        const resultsList = document.getElementById('saint-search-results');
        if (!openButton || !modal || !searchInput || !resultsList) {
            return;
        }

        // Sorted once up-front so the popup always lists saints alphabetically.
        const alphabeticalEntries = [...entries].sort((a, b) => a.saint.name.localeCompare(b.saint.name));

        let lastFocusedElement = null;

        function renderResults() {
            const term = searchInput.value.trim().toLowerCase();
            const filtered = term.length > 0
                ? alphabeticalEntries.filter(({ saint }) => saint.name.toLowerCase().includes(term))
                : alphabeticalEntries;

            resultsList.innerHTML = '';

            if (filtered.length === 0) {
                const empty = document.createElement('li');
                empty.className = 'saint-search-empty';
                empty.textContent = 'No saints found.';
                resultsList.appendChild(empty);
                return;
            }

            let currentLetter = null;
            filtered.forEach(({ saint, markers }) => {
                const letter = saint.name.charAt(0).toUpperCase();
                if (letter !== currentLetter) {
                    currentLetter = letter;
                    const heading = document.createElement('li');
                    heading.className = 'saint-search-letter';
                    heading.setAttribute('aria-hidden', 'true');
                    heading.textContent = letter;
                    resultsList.appendChild(heading);
                }

                const item = document.createElement('li');
                item.className = 'saint-search-result';
                item.tabIndex = 0;
                item.setAttribute('role', 'button');

                const nameSpan = document.createElement('span');
                nameSpan.className = 'saint-list-name';
                nameSpan.textContent = saint.name;

                const metaSpan = document.createElement('span');
                metaSpan.className = 'saint-list-meta';
                metaSpan.textContent = `${saint.title} — ${saint.feastDay}`;

                item.append(nameSpan, metaSpan);

                const activate = () => {
                    selectSaint(saint, markers);
                    closeModal();
                };

                item.addEventListener('click', activate);
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        activate();
                    }
                });

                resultsList.appendChild(item);
            });
        }

        function openModal() {
            lastFocusedElement = document.activeElement;
            searchInput.value = '';
            renderResults();
            modal.hidden = false;
            openButton.setAttribute('aria-expanded', 'true');
            searchInput.focus();
            document.addEventListener('keydown', handleKeydown);
        }

        function closeModal() {
            modal.hidden = true;
            openButton.setAttribute('aria-expanded', 'false');
            document.removeEventListener('keydown', handleKeydown);
            if (lastFocusedElement instanceof HTMLElement) {
                lastFocusedElement.focus();
            }
        }

        function handleKeydown(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeModal();
            }
        }

        openButton.addEventListener('click', openModal);
        modal.querySelectorAll('[data-saint-search-close]').forEach((el) => {
            el.addEventListener('click', closeModal);
        });
        searchInput.addEventListener('input', renderResults);
    }

    initDateFilterControls();
    applyFilter();
    initFeastCalendar();
    initSaintSearchModal();
    initNearbyDiscovery();
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
    initPanelToggles();
    loadGoogleMapsAPI();
});
