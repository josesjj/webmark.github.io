/* Simple i18n loader for vanilla JS
   - looks for elements with `data-i18n="key"`
   - loads `./en.json` or `./es.json`
   - saves chosen language in localStorage 'lang'
*/
(function () {
  'use strict';

  const DEFAULT_LANG = 'en';
  const LOCALES = { en: './en.json', es: './es.json' };

  function getSavedLang() {
    const saved = localStorage.getItem('lang');
    if (saved && LOCALES[saved]) return saved;
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('es')) return 'es';
    return DEFAULT_LANG;
  }

  async function loadLocale(lang) {
    try {
      const url = LOCALES[lang] || LOCALES[DEFAULT_LANG];
      console.debug('i18n: fetching locale', lang, url);
      const res = await fetch(url);
      if (!res.ok) throw new Error('no locale');
      return await res.json();
    } catch (err) {
      console.warn('i18n: failed to load', lang, err);
      return {};
    }
  }

  function applyDictToPage(dict, fallbackDict) {
    // translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      let value = dict[key];
      // fallback to default locale if key missing in selected locale
      if (!value && fallbackDict) value = fallbackDict[key];
      if (!value) {
        // keep existing content but mark missing keys in console for debugging
        console.warn('i18n: missing key', key);
        return;
      }
      // use innerHTML so translations can include <br>
      if (el.tagName.toLowerCase() === 'title') {
        // title should not contain HTML tags
        document.title = value.replace(/<[^>]+>/g, '');
      }
      el.innerHTML = value;
    });
  }

  async function applyLang(lang) {
    const dict = await loadLocale(lang);
    // also load default locale to use as fallback when a key is missing
    const fallback = (lang === DEFAULT_LANG) ? null : await loadLocale(DEFAULT_LANG);
    document.documentElement.lang = lang;
    console.debug('i18n: applying language', lang, Object.keys(dict || {}).length, 'keys');
    applyDictToPage(dict, fallback);
    localStorage.setItem('lang', lang);
  }

  // expose helper for debugging / manual forcing from console
  window.i18nApplyLang = applyLang;

  // attach buttons
  function attachButtons() {
    const btnEn = document.getElementById('btn-en');
    const btnEs = document.getElementById('btn-es');
    if (btnEn) btnEn.addEventListener('click', () => applyLang('en'));
    if (btnEs) btnEs.addEventListener('click', () => applyLang('es'));
  }

  // initial
  document.addEventListener('DOMContentLoaded', async function () {
    attachButtons();
    const initial = getSavedLang();
    await applyLang(initial);
  });

})();
