// ============================================================
// i18n.js — Internationalisation for Crimson Lane
// ============================================================

let _locale = 'en';
let _strings = {};

export async function initI18n() {
  // Detect language from navigator.language (e.g. 'vi' → use vi, else en)
  const saved = localStorage.getItem('cl_lang');
  _locale = saved || (navigator.language.startsWith('vi') ? 'vi' : 'en');
  await loadLocale(_locale);
}

export async function loadLocale(lang) {
  const res = await fetch(`locales/${lang}.json`).catch(() => null);
  if (!res?.ok) { if (lang !== 'en') { await loadLocale('en'); return; } }
  _strings = await res.json();
  _locale = lang;
  localStorage.setItem('cl_lang', lang);
  applyDOM();
}

// t('key', {vars}) — translate with optional variable interpolation
export function t(key, vars = {}) {
  let str = _strings[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

export function applyDOM() {
  // Walk data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}

export function getCurrentLocale() { return _locale; }
