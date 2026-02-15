const SUPPORTED_LANGUAGES = new Set(['en', 'no']);

export function normalizeLanguage(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'en';
}

export function localeForLanguage(language) {
  return normalizeLanguage(language) === 'no' ? 'nb-NO' : 'en-US';
}

export function translate(dict, language, key, vars = {}) {
  const lang = normalizeLanguage(language);
  const template = dict?.[lang]?.[key] ?? dict?.en?.[key] ?? key;

  return String(template).replace(/\{(\w+)\}/g, (_, name) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return String(vars[name]);
    }
    return `{${name}}`;
  });
}

export function setDocumentLanguage(language) {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = normalizeLanguage(language);
}
