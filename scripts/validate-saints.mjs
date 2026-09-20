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

if (!existsSync(ICONS_DIR)) {
  addWarning(warnings, 'Icon directory is missing: public/assets/icons');
} else {
  const iconFiles = readdirSync(ICONS_DIR)
    .filter((name) => !name.startsWith('.'));

  for (const iconFile of iconFiles) {
    if (!referencedIcons.has(iconFile)) {
      addWarning(warnings, `Unreferenced icon file: public/assets/icons/${iconFile}`);
    }
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
