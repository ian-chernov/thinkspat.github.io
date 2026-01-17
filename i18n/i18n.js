// ============================================================================
// i18n/i18n.js
// Internationalization support for multiple languages
// ============================================================================

/* ===================== TRANSLATIONS ===================== */

const DICT = {
  en: {
    distance: 'Distance',
    area: 'Area',
    elevation: 'Elevation',
    sector: 'Sector',
    explore: 'Explore',
    points: 'Points',
    line: 'Line',
    polygon: 'Polygon',
    text: 'Text',
    move: 'Move',
    delete: 'Delete',
    settings: 'Settings',
    language: 'Language',
    meters: 'meters',
    kilometers: 'kilometers',
    upload: 'Upload',
    download: 'Download'
  },

  uk: {
    distance: 'Відстань',
    area: 'Площа',
    elevation: 'Висота',
    sector: 'Сектор',
    explore: 'Огляд',
    points: 'Точки',
    line: 'Лінія',
    text: 'Текст',
    move: 'Перемістити',
    delete: 'Видалити',
    polygon: 'Полігон',
    settings: 'Налаштування',
    language: 'Мова',
    meters: 'метри',
    kilometers: 'кілометри',
    upload: 'Завантажити',
    download: 'Скачати'
  }
};

/* ===================== STATE ===================== */

let lang = localStorage.getItem('lang');

/* ===================== INITIALIZATION ===================== */

/**
 * Detect browser language
 * @returns {string} Language code (en, uk, etc.)
 */
function detectBrowserLang() {
  const browserLang = navigator.language.slice(0, 2);
  return DICT[browserLang] ? browserLang : 'en';
}

// Initialize language from localStorage or browser
if (!lang || !DICT[lang]) {
  lang = detectBrowserLang();
  localStorage.setItem('lang', lang);
}

/* ===================== CORE API ===================== */

/**
 * Translate a key to current language
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
export function t(key) {
  return DICT[lang]?.[key] ?? key;
}

/**
 * Get current language code
 * @returns {string}
 */
export function getLang() {
  return lang;
}

/**
 * Set current language
 * @param {string} newLang - Language code
 */
export function setLang(newLang) {
  if (!DICT[newLang]) {
    console.warn(`i18n: Unknown language "${newLang}"`);
    return;
  }

  lang = newLang;
  localStorage.setItem('lang', lang);
  renderI18n();
}

/**
 * Get list of available languages
 * @returns {string[]} Array of language codes
 */
export function getAvailableLanguages() {
  return Object.keys(DICT);
}

/**
 * Get language name
 * @param {string} code - Language code
 * @returns {string} Language name
 */
export function getLanguageName(code) {
  const names = {
    en: 'English',
    uk: 'Українська'
  };
  return names[code] || code;
}

/* ===================== AUTO RENDER ===================== */

/**
 * Render all elements with data-i18n attribute
 * @param {HTMLElement} root - Root element (default: document)
 */
export function renderI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

/* ===================== LANGUAGE SELECTOR ===================== */

/**
 * Initialize language selector dropdown
 * @param {HTMLSelectElement} selectEl - Select element
 */
export function initLangSelector(selectEl) {
  if (!selectEl) return;

  // Set current value
  selectEl.value = lang;

  // Listen for changes
  selectEl.addEventListener('change', e => {
    setLang(e.target.value);
  });
}

/* ===================== EXTENDED API ===================== */

/**
 * Translate with placeholder substitution
 * @param {string} key - Translation key
 * @param {Object} params - Placeholder values
 * @returns {string}
 *
 * @example
 * // DICT: { greeting: "Hello {name}!" }
 * tf('greeting', { name: 'World' }) // "Hello World!"
 */
export function tf(key, params = {}) {
  let text = t(key);

  for (const [placeholder, value] of Object.entries(params)) {
    text = text.replace(`{${placeholder}}`, value);
  }

  return text;
}

/**
 * Pluralize based on count
 * @param {string} key - Translation key
 * @param {number} count - Count for pluralization
 * @returns {string}
 *
 * @example
 * // DICT: { items: "item|items" }
 * tp('items', 1) // "item"
 * tp('items', 5) // "items"
 */
export function tp(key, count) {
  const text = t(key);
  const [singular, plural] = text.split('|');

  return count === 1 ? singular : (plural || singular);
}

/**
 * Add a new translation
 * @param {string} langCode - Language code
 * @param {string} key - Translation key
 * @param {string} value - Translation value
 */
export function addTranslation(langCode, key, value) {
  if (!DICT[langCode]) {
    DICT[langCode] = {};
  }

  DICT[langCode][key] = value;
}

/**
 * Add multiple translations
 * @param {string} langCode - Language code
 * @param {Object} translations - Key-value pairs
 */
export function addTranslations(langCode, translations) {
  if (!DICT[langCode]) {
    DICT[langCode] = {};
  }

  Object.assign(DICT[langCode], translations);
}

/**
 * Get all translations for current language
 * @returns {Object}
 */
export function getAllTranslations() {
  return { ...DICT[lang] };
}

/**
 * Check if a translation exists
 * @param {string} key - Translation key
 * @returns {boolean}
 */
export function hasTranslation(key) {
  return DICT[lang]?.[key] !== undefined;
}