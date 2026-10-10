// Lightweight i18n for the static site (no build step / framework).
// Static markup is translated through `data-i18n` (text content) and
// `data-i18n-attr` ("attr:key;attr2:key2") attributes; dynamic strings in
// script.js go through `t()`. Saint data translations live separately in
// `/data/saints.<lang>.json` (see script.js `loadSaints()`).

const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'el'];
const LANGUAGE_STORAGE_KEY = 'hagioi.lang';

const LOCALE_DATA = {
    en: {
        htmlLang: 'en',
        ogLocale: 'en_US',
        monthNames: ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"],
        weekdayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        weekdayAbbr: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        formatMonthDay: (month, day) => `${LOCALE_DATA.en.monthNames[month]} ${day}`,
    },
    el: {
        htmlLang: 'el',
        ogLocale: 'el_GR',
        monthNames: ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
            "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"],
        // Genitive forms, used in dates such as "22 Οκτωβρίου".
        monthNamesGenitive: ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαΐου", "Ιουνίου",
            "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου"],
        weekdayNames: ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"],
        weekdayAbbr: ["Κυρ", "Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ"],
        formatMonthDay: (month, day) => `${day} ${LOCALE_DATA.el.monthNamesGenitive[month]}`,
    },
};

const STRINGS = {
    en: {
        'meta.title': 'Hagioi — Interactive Map of Orthodox Christian Saints',
        'meta.description': 'Explore an interactive map of Orthodox Christian saints. Browse saints by feast day, search them by name, and discover where each saint was born, lived, or was martyred.',
        'language.label': 'Language',
        'header.logoAlt': 'hagioi logo',
        'menu.open': 'Open Feast Days panel',
        'menu.close': 'Close Feast Days panel',
        'panel.title': 'Feast Days',
        'search.open': 'Search saints by name…',
        'search.title': 'Search saints by name',
        'search.close': 'Close search',
        'search.placeholder': 'Type a name…',
        'search.inputLabel': 'Search a saint by name',
        'search.empty': 'No saints found.',
        'calendar.open': 'Browse monthly calendar…',
        'calendar.title': 'Monthly calendar',
        'calendar.close': 'Close monthly calendar',
        'calendar.nav': 'Calendar month navigation',
        'calendar.prev': 'Show previous month',
        'calendar.next': 'Show next month',
        'calendar.note': 'Select a highlighted day to see saints for that feast and open their associated map location(s).',
        'calendar.selectedDay': 'Selected day',
        'calendar.chooseDay': 'Choose a highlighted day to list saints and their associated map location(s).',
        'calendar.noEntriesOn': 'No fixed-date feast entries are listed for {date}.',
        'calendar.saintsOn': ({ count, date }) => `${count} saint${count === 1 ? '' : 's'} on ${date}. Select a saint to open associated map location details.`,
        'calendar.locations': ({ count, labels }) => count === 1
            ? `Associated map location: ${labels}`
            : `Associated map locations: ${labels}`,
        'calendar.resultLabel': ({ name, title, feastDay, count }) =>
            `${name}, ${title}, feast day ${feastDay}. Show ${count} associated map location${count === 1 ? '' : 's'}.`,
        'calendar.dayLabel': ({ date, weekday, count }) => `${date}, ${weekday}, ${count} saint${count === 1 ? '' : 's'}`,
        'calendar.dayCount': ({ count }) => `${count} saint${count === 1 ? '' : 's'}`,
        'calendar.noEntriesInMonth': 'No fixed-date feast entries are listed in {month}.',
        'calendar.monthSummary': ({ month, days, saints }) =>
            `${month} has ${days} feast day${days === 1 ? '' : 's'} covering ${saints} saint${saints === 1 ? '' : 's'}.`,
        'filter.open': 'Filter by date range…',
        'filter.title': 'Filter by date range',
        'filter.close': 'Close date range filter',
        'filter.from': 'From',
        'filter.to': 'To',
        'filter.fromMonth': 'From month',
        'filter.fromDay': 'From day',
        'filter.toMonth': 'To month',
        'filter.toDay': 'To day',
        'filter.listLabel': 'Saints in the selected date range',
        'filter.empty': 'No saints found in this date range.',
        'nearby.heading': 'Near me',
        'nearby.find': 'Find saint-associated locations near me (within {km} km)',
        'nearby.finding': 'Finding saint-associated locations near you...',
        'nearby.intro': 'Choose “Find saint-associated locations near me” to run an on-device lookup.',
        'nearby.note': 'Privacy & accuracy: your location is used only in your browser for this lookup. Results show historical saint-associated places, not verified present-day pilgrimage destinations.',
        'nearby.resultsLabel': 'Saint-associated locations near you',
        'nearby.unsupported': 'Your browser does not support location lookup. You can still browse saints by map, date, or name.',
        'nearby.requesting': 'Requesting your location for an in-browser nearby lookup...',
        'nearby.none': 'No saint-associated locations were found within {km} km of your location.',
        'nearby.found': ({ count, km }) =>
            `Found ${count} saint-associated location${count === 1 ? '' : 's'} within ${km} km of your location.`,
        'nearby.away': 'Approx. {distance} away',
        'nearby.yourLocation': 'Your location',
        'nearby.errorGeneric': 'We could not read your location. Please try again.',
        'nearby.errorDenied': 'Location access was denied. Allow location in your browser and try again.',
        'nearby.errorUnavailable': 'Your location is currently unavailable. Check device location settings and try again.',
        'nearby.errorTimeout': 'Location lookup timed out. Please try again in a clearer-signal area.',
        'distance.underOne': 'under 1 km',
        'distance.km': '{km} km',
        'saint.iconAlt': 'Icon of {name}',
        'saint.backToList': '\u2190 Back to list',
        'saint.meta': '{title} — Feast day: {feastDay}',
        'about.open': 'About Hagioi…',
        'about.title': 'About Hagioi',
        'about.close': 'Close about',
        'about.p1': 'Hagioi is an interactive map of Orthodox Christian saints, showing where each saint was born, lived, or was martyred.',
        'about.p2': 'Use the Feast Days panel to open the monthly feast calendar, filter saints by date range, search by name, or optionally find historical saint-associated locations near you.',
        'about.p3': 'The near-me lookup is opt-in and runs only in your browser; it does not verify present-day shrines, churches, or pilgrimage facilities.',
        'about.builtBy': 'Built with ❤️ by ',
        'footer.rights': '© 2025 hagioi — All rights reserved.',
        'footer.builtBy': 'Built with ❤️ by ',
        'footer.me': 'Me',
        'footer.support': 'Support this project',
        'footer.version': 'Version ',
        'footer.commit': 'Commit {commit}',
    },
    el: {
        'meta.title': 'Hagioi — Διαδραστικός χάρτης των Ορθοδόξων Αγίων',
        'meta.description': 'Εξερευνήστε έναν διαδραστικό χάρτη των Αγίων της Ορθοδόξου Εκκλησίας. Περιηγηθείτε στους αγίους ανά ημέρα εορτής, αναζητήστε τους κατά όνομα και ανακαλύψτε πού γεννήθηκε, έζησε ή μαρτύρησε ο καθένας.',
        'language.label': 'Γλώσσα',
        'header.logoAlt': 'λογότυπο hagioi',
        'menu.open': 'Άνοιγμα πίνακα εορτολογίου',
        'menu.close': 'Κλείσιμο πίνακα εορτολογίου',
        'panel.title': 'Εορτολόγιο',
        'search.open': 'Αναζήτηση αγίων κατά όνομα…',
        'search.title': 'Αναζήτηση αγίων κατά όνομα',
        'search.close': 'Κλείσιμο αναζήτησης',
        'search.placeholder': 'Πληκτρολογήστε ένα όνομα…',
        'search.inputLabel': 'Αναζήτηση αγίου κατά όνομα',
        'search.empty': 'Δεν βρέθηκαν άγιοι.',
        'calendar.open': 'Μηνιαίο εορτολόγιο…',
        'calendar.title': 'Μηνιαίο εορτολόγιο',
        'calendar.close': 'Κλείσιμο μηνιαίου εορτολογίου',
        'calendar.nav': 'Πλοήγηση στους μήνες του ημερολογίου',
        'calendar.prev': 'Προηγούμενος μήνας',
        'calendar.next': 'Επόμενος μήνας',
        'calendar.note': 'Επιλέξτε μια επισημασμένη ημέρα για να δείτε τους αγίους που εορτάζουν και να ανοίξετε τις σχετικές τοποθεσίες τους στον χάρτη.',
        'calendar.selectedDay': 'Επιλεγμένη ημέρα',
        'calendar.chooseDay': 'Επιλέξτε μια επισημασμένη ημέρα για να εμφανιστούν οι άγιοι και οι σχετικές τοποθεσίες τους στον χάρτη.',
        'calendar.noEntriesOn': 'Δεν υπάρχουν εορτές σταθερής ημερομηνίας για τις {date}.',
        'calendar.saintsOn': ({ count, date }) => `${count} ${count === 1 ? 'άγιος' : 'άγιοι'} στις ${date}. Επιλέξτε έναν άγιο για να ανοίξετε τις σχετικές τοποθεσίες στον χάρτη.`,
        'calendar.locations': ({ count, labels }) => count === 1
            ? `Σχετική τοποθεσία στον χάρτη: ${labels}`
            : `Σχετικές τοποθεσίες στον χάρτη: ${labels}`,
        'calendar.resultLabel': ({ name, title, feastDay, count }) =>
            `${name}, ${title}, εορτή ${feastDay}. Εμφάνιση ${count} ${count === 1 ? 'σχετικής τοποθεσίας' : 'σχετικών τοποθεσιών'} στον χάρτη.`,
        'calendar.dayLabel': ({ date, weekday, count }) => `${weekday}, ${date}, ${count} ${count === 1 ? 'άγιος' : 'άγιοι'}`,
        'calendar.dayCount': ({ count }) => `${count} ${count === 1 ? 'άγιος' : 'άγιοι'}`,
        'calendar.noEntriesInMonth': '{month}: δεν υπάρχουν εορτές σταθερής ημερομηνίας.',
        'calendar.monthSummary': ({ month, days, saints }) =>
            `${month}: ${days} ${days === 1 ? 'ημέρα εορτής' : 'ημέρες εορτών'} με ${saints} ${saints === 1 ? 'άγιο' : 'αγίους'}.`,
        'filter.open': 'Φιλτράρισμα κατά εύρος ημερομηνιών…',
        'filter.title': 'Φιλτράρισμα κατά εύρος ημερομηνιών',
        'filter.close': 'Κλείσιμο φίλτρου ημερομηνιών',
        'filter.from': 'Από',
        'filter.to': 'Έως',
        'filter.fromMonth': 'Από μήνα',
        'filter.fromDay': 'Από ημέρα',
        'filter.toMonth': 'Έως μήνα',
        'filter.toDay': 'Έως ημέρα',
        'filter.listLabel': 'Άγιοι στο επιλεγμένο εύρος ημερομηνιών',
        'filter.empty': 'Δεν βρέθηκαν άγιοι σε αυτό το εύρος ημερομηνιών.',
        'nearby.heading': 'Κοντά μου',
        'nearby.find': 'Εύρεση τόπων σχετικών με αγίους κοντά μου (σε ακτίνα {km} χλμ.)',
        'nearby.finding': 'Αναζήτηση τόπων σχετικών με αγίους κοντά σας...',
        'nearby.intro': 'Επιλέξτε «Εύρεση τόπων σχετικών με αγίους κοντά μου» για αναζήτηση που εκτελείται στη συσκευή σας.',
        'nearby.note': 'Απόρρητο και ακρίβεια: η τοποθεσία σας χρησιμοποιείται μόνο στον περιηγητή σας για αυτή την αναζήτηση. Τα αποτελέσματα δείχνουν ιστορικούς τόπους που σχετίζονται με αγίους, όχι επιβεβαιωμένους σημερινούς προσκυνηματικούς προορισμούς.',
        'nearby.resultsLabel': 'Τόποι σχετικοί με αγίους κοντά σας',
        'nearby.unsupported': 'Ο περιηγητής σας δεν υποστηρίζει εντοπισμό τοποθεσίας. Μπορείτε πάντα να περιηγηθείτε στους αγίους μέσω χάρτη, ημερομηνίας ή ονόματος.',
        'nearby.requesting': 'Γίνεται αίτημα για την τοποθεσία σας, για αναζήτηση μέσα στον περιηγητή...',
        'nearby.none': 'Δεν βρέθηκαν τόποι σχετικοί με αγίους σε ακτίνα {km} χλμ. από την τοποθεσία σας.',
        'nearby.found': ({ count, km }) =>
            `${count === 1 ? 'Βρέθηκε 1 τόπος σχετικός' : `Βρέθηκαν ${count} τόποι σχετικοί`} με αγίους σε ακτίνα ${km} χλμ. από την τοποθεσία σας.`,
        'nearby.away': 'Περίπου {distance} μακριά',
        'nearby.yourLocation': 'Η τοποθεσία σας',
        'nearby.errorGeneric': 'Δεν ήταν δυνατή η ανάγνωση της τοποθεσίας σας. Δοκιμάστε ξανά.',
        'nearby.errorDenied': 'Η πρόσβαση στην τοποθεσία απορρίφθηκε. Επιτρέψτε την τοποθεσία στον περιηγητή σας και δοκιμάστε ξανά.',
        'nearby.errorUnavailable': 'Η τοποθεσία σας δεν είναι διαθέσιμη αυτή τη στιγμή. Ελέγξτε τις ρυθμίσεις τοποθεσίας της συσκευής και δοκιμάστε ξανά.',
        'nearby.errorTimeout': 'Ο εντοπισμός της τοποθεσίας έληξε. Δοκιμάστε ξανά σε περιοχή με καλύτερο σήμα.',
        'distance.underOne': 'λιγότερο από 1 χλμ.',
        'distance.km': '{km} χλμ.',
        'saint.iconAlt': 'Εικόνα: {name}',
        'saint.backToList': '\u2190 Πίσω στη λίστα',
        'saint.meta': '{title} — Εορτή: {feastDay}',
        'about.open': 'Σχετικά με το Hagioi…',
        'about.title': 'Σχετικά με το Hagioi',
        'about.close': 'Κλείσιμο',
        'about.p1': 'Το Hagioi είναι ένας διαδραστικός χάρτης των Ορθοδόξων Αγίων, που δείχνει πού γεννήθηκε, έζησε ή μαρτύρησε κάθε άγιος.',
        'about.p2': 'Χρησιμοποιήστε τον πίνακα «Εορτολόγιο» για να ανοίξετε το μηνιαίο εορτολόγιο, να φιλτράρετε τους αγίους κατά εύρος ημερομηνιών, να τους αναζητήσετε κατά όνομα ή, προαιρετικά, να βρείτε ιστορικούς τόπους σχετικούς με αγίους κοντά σας.',
        'about.p3': 'Η αναζήτηση «κοντά μου» ενεργοποιείται μόνο αν το επιλέξετε και εκτελείται αποκλειστικά στον περιηγητή σας· δεν επιβεβαιώνει σημερινά προσκυνήματα, ναούς ή εγκαταστάσεις προσκυνητών.',
        'about.builtBy': 'Φτιαγμένο με ❤️ από τον ',
        'footer.rights': '© 2025 hagioi — Με την επιφύλαξη παντός δικαιώματος.',
        'footer.builtBy': 'Φτιαγμένο με ❤️ από ',
        'footer.me': 'εμένα',
        'footer.support': 'Υποστηρίξτε το έργο',
        'footer.version': 'Έκδοση ',
        'footer.commit': 'Commit {commit}',
    },
};

function isSupportedLanguage(language) {
    return SUPPORTED_LANGUAGES.includes(language);
}

function readStoredLanguage() {
    try {
        return localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
        return null;
    }
}

function storeLanguage(language) {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
        // Storage can be unavailable (e.g. privacy mode); the ?lang= link still works.
    }
}

// Priority: explicit ?lang= in the URL, then the saved choice, then the
// browser's preferred languages, then English.
function detectLanguage() {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isSupportedLanguage(fromUrl)) {
        storeLanguage(fromUrl);
        return fromUrl;
    }

    const stored = readStoredLanguage();
    if (isSupportedLanguage(stored)) {
        return stored;
    }

    const preferred = (navigator.languages && navigator.languages.length > 0)
        ? navigator.languages
        : [navigator.language];
    for (const tag of preferred) {
        const base = typeof tag === 'string' ? tag.toLowerCase().split('-')[0] : '';
        if (isSupportedLanguage(base)) {
            return base;
        }
    }

    return DEFAULT_LANGUAGE;
}

const CURRENT_LANGUAGE = detectLanguage();
const CURRENT_LOCALE = LOCALE_DATA[CURRENT_LANGUAGE];

// Looks up `key` in the current language (falling back to English) and
// fills `{name}` placeholders from `params`; plural-aware entries are functions.
function t(key, params = {}) {
    const value = STRINGS[CURRENT_LANGUAGE][key] ?? STRINGS[DEFAULT_LANGUAGE][key];
    if (typeof value === 'function') {
        return value(params);
    }
    if (typeof value !== 'string') {
        return key;
    }
    return value.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

function formatLocalizedMonthDay(month, day) {
    return CURRENT_LOCALE.formatMonthDay(month, day);
}

// Case- and accent-insensitive form used for searching (so "αγιος" matches "Άγιος").
function normalizeForSearch(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(CURRENT_LANGUAGE);
}

function setMetaContent(selector, content) {
    const element = document.querySelector(selector);
    if (element) {
        element.setAttribute('content', content);
    }
}

function applyStaticTranslations() {
    document.documentElement.lang = CURRENT_LOCALE.htmlLang;
    document.title = t('meta.title');
    setMetaContent('meta[name="description"]', t('meta.description'));
    setMetaContent('meta[property="og:title"]', t('meta.title'));
    setMetaContent('meta[property="og:description"]', t('meta.description'));
    setMetaContent('meta[property="og:locale"]', CURRENT_LOCALE.ogLocale);
    setMetaContent('meta[name="twitter:title"]', t('meta.title'));
    setMetaContent('meta[name="twitter:description"]', t('meta.description'));

    if (CURRENT_LANGUAGE !== DEFAULT_LANGUAGE) {
        const canonical = document.querySelector('link[rel="canonical"]');
        const alternate = document.querySelector(`link[rel="alternate"][hreflang="${CURRENT_LANGUAGE}"]`);
        if (canonical && alternate) {
            canonical.setAttribute('href', alternate.getAttribute('href'));
        }
    }

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
        element.dataset.i18nAttr.split(';').forEach((pair) => {
            const [attribute, key] = pair.split(':').map((part) => part.trim());
            if (attribute && key) {
                element.setAttribute(attribute, t(key));
            }
        });
    });

    // Calendar weekday headers are positional (Sunday first).
    document.querySelectorAll('.feast-calendar-table thead abbr').forEach((abbr, index) => {
        abbr.textContent = CURRENT_LOCALE.weekdayAbbr[index];
        abbr.title = CURRENT_LOCALE.weekdayNames[index];
    });
}

// Each option is a plain link (`?lang=xx`) so switching works as a normal
// navigation that reloads the map, data and Google Maps labels in the new
// language; the click handler only remembers the choice for later visits.
function initLanguageSelector() {
    document.querySelectorAll('.language-option').forEach((link) => {
        const language = link.getAttribute('hreflang');
        if (language === CURRENT_LANGUAGE) {
            link.setAttribute('aria-current', 'true');
        } else {
            link.removeAttribute('aria-current');
        }
        link.addEventListener('click', () => {
            if (isSupportedLanguage(language)) {
                storeLanguage(language);
            }
        });
    });
}

applyStaticTranslations();
initLanguageSelector();
