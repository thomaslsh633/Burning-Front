// Player-visible text. Strings live in data/i18n/<lang>.json, never in code.
import ko from '../../data/i18n/ko.json' with { type: 'json' };

const tables = { ko };
let table = ko;

export function setLanguage(lang) {
  if (!tables[lang]) throw new Error(`no strings for language '${lang}'`);
  table = tables[lang];
}

// t('lobby.newMatch') -> text; {name} placeholders are filled from params. Unknown keys show the key itself.
export function t(key, params) {
  const s = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : s;
}
