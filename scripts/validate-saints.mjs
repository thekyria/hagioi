import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SAINTS_PATH = path.join(REPO_ROOT, 'public', 'data', 'saints.json');
const ICONS_DIR = path.join(REPO_ROOT, 'public', 'assets', 'icons');

const REQUIRED_FIELDS = ['id', 'name', 'feastDay', 'title', 'icon', 'bio', 'locations'];
const FEAST_DAY_REGEX = /^(?:(?:January|February|March|April|May|June|July|August|September|October|November|December) (?:[1-9]|[12]\d|3[01])|Third Sunday of Pascha)$/;

// Derived from the current saints.json values. Keep this list explicit so new
// titles are intentional and reviewed.
const ALLOWED_TITLES = new Set([
  'Abbess',
  'Abbess of Aegina',
  'Abbess of Kildare',
  'Abbess, Enlightener of Belarus',
  'Abbot',
  'Abbot and Martyr',
  'Abbot and Missionary',
  'Abbot and Theologian',
  'Abbot of Glendalough',
  'Abbot, Father of Western Monasticism',
  'Abbot, Founder of Communal Monasticism',
  'Abbot, Wonderworker',
  'Ancestors of God',
  'Apostle',
  'Apostle and Evangelist',
  'Apostle of the Seventy',
  'Apostle of the Seventy, Bishop of Corinth',
  'Apostle of the Seventy, Bishop of Ephesus',
  'Apostle to the English, first Archbishop of Canterbury',
  'Apostle to the Picts, Abbot of Iona',
  'Apostle, Evangelist and Theologian',
  'Apostles',
  'Archbishop',
  'Archbishop and Martyr',
  'Archbishop of Alexandria',
  'Archbishop of Braga',
  'Archbishop of Caesarea, one of the Three Holy Hierarchs',
  'Archbishop of Constantinople',
  'Archbishop of Constantinople, one of the Three Holy Hierarchs',
  'Archbishop of Jerusalem',
  'Archbishop of Mainz, Apostle of Germany',
  'Archbishop of Myra, Wonderworker',
  'Archbishop of Seville',
  'Archbishop of Seville, Theologian',
  'Archbishop of Thessalonica',
  'Archbishop of Utrecht, Apostle of the Frisians',
  'Archbishop, Venerable',
  'Archdeacon and Martyr',
  'Archdeacon and Protomartyr',
  'Archimandrite, Apostle to the Americas',
  'Ascetic',
  'Ascetic of Scetis',
  'Ascetic of the Egyptian Desert',
  'Ascetics',
  'Ascetics of Syria',
  'Bishop',
  'Bishop and Confessor',
  'Bishop and Martyr',
  'Bishop and Monk of Palestine',
  'Bishop and Ruler',
  'Bishop of Agrigento',
  'Bishop of America and Canada',
  'Bishop of Arles',
  'Bishop of Auxerre',
  'Bishop of Corinth',
  'Bishop of Hippo',
  'Bishop of Iconium',
  'Bishop of Lichfield',
  'Bishop of Lindisfarne',
  'Bishop of Maiuma',
  'Bishop of Milan',
  'Bishop of Neocaesarea, Wonderworker',
  'Bishop of Poitiers',
  'Bishop of Poitiers, Hymnographer',
  'Bishop of Râmnic',
  'Bishop of Tyre, Hieromartyr',
  'Bishop of Winchester',
  'Bishop of the Caucasus and Black Sea',
  'Bishop, Enlightener of Northumbria',
  'Bishop, Enlightener of the Picts',
  'Bishop, Equal-to-the-Apostles',
  'Bishop, Missionary',
  'Bishop, Preacher',
  'Bishop, Recluse of Vysha',
  'Bishop, Wonderworker',
  'Chief Apostle',
  'Confessor',
  'Confessor and Hymnographer',
  'Deacon and Martyr',
  'Deaconess',
  'Deaconess and Martyr',
  'Elder',
  'Elder of Essex',
  'Enlightener of the Aleuts and Apostle to America',
  'Enlightener of the Peoples of Alaska',
  'Equal-to-the-Apostles',
  'Equal-to-the-Apostles, Enlightener of Japan',
  'First Patriarch of Moscow',
  'Fool-for-Christ',
  'Fool-for-Christ of Georgia',
  'Grand Prince, Righteous',
  'Great Martyr',
  'Great Martyr, Deliverer from Potions',
  'Great Martyr, Myrrh-streamer',
  'Great Martyr, Queen of Kakheti',
  'Great Martyr, Unmercenary Healer',
  'Guardian of the Theotokos',
  'Hagiographer of Constantinople',
  'Hermit',
  'Hermit of Bithynia',
  'Hermit of the Judean Desert',
  'Hesychast',
  'Hesychast Elder',
  'Hierarch',
  'Hieromartyr',
  'Hieromartyr, Bishop',
  'Hieromartyr, Equal-to-the-Apostles',
  'Hieromartyr, Pope of Rome',
  'Hieromartyrs',
  'Hymnographer',
  'King',
  'King and Martyr',
  'King, Equal-to-the-Apostles',
  'Martyr',
  'Martyr Prince',
  'Martyr, Queen of Kartli',
  'Martyrs',
  'Merchant and Martyr',
  'Metropolitan',
  'Metropolitan and Confessor',
  'Metropolitan and Martyr',
  'Metropolitan of Montenegro',
  'Metropolitan of Moscow, Hieromartyr',
  'Metropolitan of Pentapolis, Wonderworker',
  'Metropolitan of Rostov',
  'Metropolitan of Wallachia, Hieromartyr',
  'Missionary Bishop',
  'Missionary Monk',
  'Monastic Founder',
  'Monastic Founder and Iconographer',
  'Monastic Founder and Martyr',
  'Monk',
  'Monk and Ascetic',
  'Monk of the Jordan',
  'Monk, Scholar, Translator',
  'Mother of God',
  'Myrrhbearer and Equal-to-the-Apostles',
  'Myrrhbearers',
  'New Chrysostom of Serbia',
  'New Martyr',
  'New Martyr of Paris',
  'New Martyr, Grand Duchess',
  'New Martyrs',
  'Nun',
  'Nun and Martyr',
  'Nun of Thessaloniki',
  'Passion-Bearers, Princes',
  'Patriarch',
  'Patriarch and Confessor',
  'Patriarch and Ethnomartyr',
  'Patriarch of Alexandria',
  'Patriarch of Constantinople',
  'Patriarch of Jerusalem',
  'Patriarch of Moscow, Hieromartyr',
  'Patriarch, Confessor',
  'Patron of Wales, Archbishop of Menevia',
  'Patroness of Paris',
  'Pope of Rome',
  'Priest',
  'Priest and Confessor',
  'Priest and Martyr',
  'Priest and Missionary',
  'Priest, Translator of Scripture',
  'Priest-Confessor, Wonderworker',
  'Priest-Martyr',
  'Priest-Martyrs',
  'Prince',
  'Prince and Martyr',
  'Prophet',
  'Prophet, Forerunner, Baptist',
  'Prophet, God-seer',
  'Protomartyr Equal-to-the-Apostles',
  'Protomartyr of America',
  'Protomartyr of Britain',
  'Queen',
  'Right-believing Prince and Princess',
  'Right-believing Voivode of Moldavia',
  'Righteous',
  'Righteous Family of Constantinople',
  'Righteous Martyr',
  'Righteous, Parents of the Forerunner',
  'Righteous, Prophetess',
  'Ruler',
  'Ruler and Martyr',
  'Unmercenary Healers',
  'Venerable',
  'Venerable Confessor',
  'Venerable Martyr',
  'Venerable Monastic Cook',
  'Venerable and Doctor',
  'Venerable, Desert Father',
  'Venerable, Elder',
  'Venerable, Elder of Mount Athos',
  'Venerable, Elder of Optina',
  'Venerable, Father of Monasticism',
  'Venerable, Fool-for-Christ',
  'Venerable, Wonderworker',
  'Virgin Martyr',
  'Wonderworker of Shanghai and San Francisco',
]);

function describeSaint(saint, index) {
  if (saint && typeof saint === 'object') {
    const key = typeof saint.id === 'string' && saint.id.trim() !== ''
      ? saint.id
      : (typeof saint.name === 'string' && saint.name.trim() !== '' ? saint.name : '<missing-id-and-name>');
    return `${key} (index ${index})`;
  }

  return `<invalid-entry> (index ${index})`;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function addError(errors, saint, index, message) {
  errors.push(`${describeSaint(saint, index)}: ${message}`);
}

function addWarning(warnings, message) {
  warnings.push(message);
}

let saints;
try {
  saints = JSON.parse(readFileSync(SAINTS_PATH, 'utf8'));
} catch (error) {
  console.error(`Failed to read or parse ${SAINTS_PATH}: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(saints)) {
  console.error(`Expected ${SAINTS_PATH} to contain a top-level JSON array.`);
  process.exit(1);
}

const errors = [];
const warnings = [];
const seenIdToFirstIndex = new Map();
const referencedIcons = new Set();

saints.forEach((saint, index) => {
  if (!saint || typeof saint !== 'object' || Array.isArray(saint)) {
    addError(errors, saint, index, 'entry must be an object');
    return;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in saint)) {
      addError(errors, saint, index, `missing required field "${field}"`);
      continue;
    }

    if (field === 'locations') {
      if (!Array.isArray(saint.locations) || saint.locations.length === 0) {
        addError(errors, saint, index, 'locations must be a non-empty array');
      }
      continue;
    }

    if (!isNonEmptyString(saint[field])) {
      addError(errors, saint, index, `field "${field}" must be a non-empty string`);
    }
  }

  if (isNonEmptyString(saint.id)) {
    const firstIndex = seenIdToFirstIndex.get(saint.id);
    if (typeof firstIndex === 'number') {
      addError(errors, saint, index, `duplicate id "${saint.id}" (first seen at index ${firstIndex})`);
    } else {
      seenIdToFirstIndex.set(saint.id, index);
    }
  }

  if (isNonEmptyString(saint.title) && !ALLOWED_TITLES.has(saint.title)) {
    addError(errors, saint, index, `title "${saint.title}" is not in ALLOWED_TITLES`);
  }

  if (isNonEmptyString(saint.feastDay) && !FEAST_DAY_REGEX.test(saint.feastDay)) {
    addError(errors, saint, index, `feastDay "${saint.feastDay}" does not match expected format`);
  }

  if (isNonEmptyString(saint.icon)) {
    referencedIcons.add(saint.icon);
    if (!existsSync(path.join(ICONS_DIR, saint.icon))) {
      // TODO: Revisit severity once icon assets are curated and committed.
      addWarning(warnings, `${describeSaint(saint, index)}: icon file missing at public/assets/icons/${saint.icon}`);
    }
  }

  if (Array.isArray(saint.locations)) {
    saint.locations.forEach((location, locationIndex) => {
      if (!location || typeof location !== 'object' || Array.isArray(location)) {
        addError(errors, saint, index, `locations[${locationIndex}] must be an object`);
        return;
      }

      if (!isNonEmptyString(location.label)) {
        addError(errors, saint, index, `locations[${locationIndex}].label must be a non-empty string`);
      }

      if (typeof location.lat !== 'number' || Number.isNaN(location.lat)) {
        addError(errors, saint, index, `locations[${locationIndex}].lat must be a number`);
      } else if (location.lat < -90 || location.lat > 90) {
        addError(errors, saint, index, `locations[${locationIndex}].lat must be between -90 and 90`);
      }

      if (typeof location.lng !== 'number' || Number.isNaN(location.lng)) {
        addError(errors, saint, index, `locations[${locationIndex}].lng must be a number`);
      } else if (location.lng < -180 || location.lng > 180) {
        addError(errors, saint, index, `locations[${locationIndex}].lng must be between -180 and 180`);
      }
    });
  }
});

const iconFiles = readdirSync(ICONS_DIR)
  .filter((name) => !name.startsWith('.'));

for (const iconFile of iconFiles) {
  if (!referencedIcons.has(iconFile)) {
    addWarning(warnings, `Unreferenced icon file: public/assets/icons/${iconFile}`);
  }
}

for (const warning of warnings) {
  console.warn(`WARNING: ${warning}`);
}

for (const error of errors) {
  console.error(`ERROR: ${error}`);
}

console.log(`Checked ${saints.length} saint entries; found ${errors.length} error(s) and ${warnings.length} warning(s).`);

process.exit(errors.length > 0 ? 1 : 0);
