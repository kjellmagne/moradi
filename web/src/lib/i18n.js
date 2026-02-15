export const LANGS = {
  en: 'English',
  no: 'Norsk'
};

export function normalizeLanguage(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LANGS, normalized) ? normalized : 'en';
}

export function localeForLanguage(language) {
  return normalizeLanguage(language) === 'no' ? 'nb-NO' : 'en-US';
}

export function tr(dict, language, key, vars = {}) {
  const lang = normalizeLanguage(language);
  const template = dict?.[lang]?.[key] ?? dict?.en?.[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return String(vars[name]);
    }
    return `{${name}}`;
  });
}
