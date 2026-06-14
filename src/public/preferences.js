import { LANGUAGES, THEMES, normalizeLanguage, normalizeTheme, translate } from './preferences-core.js';

const STORAGE_KEYS = {
  language: 'lanTransfer.language',
  theme: 'lanTransfer.theme'
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
let currentLanguage = normalizeLanguage(localStorage.getItem(STORAGE_KEYS.language) || getBrowserLanguage());
let currentTheme = normalizeTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'system');

export function initPreferences({ scope = 'app', onLanguageChange } = {}) {
  document.documentElement.dataset.scope = scope;
  const controls = document.querySelector('#preferences');
  if (controls) {
    renderControls(controls);
  }
  applyPreferences();
  mediaQuery.addEventListener('change', applyTheme);
  document.addEventListener('change', (event) => {
    if (event.target?.id === 'languageSelect') {
      setLanguage(event.target.value);
      onLanguageChange?.(currentLanguage);
    }
    if (event.target?.id === 'themeSelect') {
      setTheme(event.target.value);
    }
  });
  return {
    getLanguage: () => currentLanguage,
    t: (key, values) => translate(currentLanguage, key, values),
    setLanguage
  };
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function t(key, values) {
  return translate(currentLanguage, key, values);
}

function renderControls(container) {
  container.innerHTML = `
    <label>
      <span data-i18n="preferences.languageLabel"></span>
      <select id="languageSelect">
        ${LANGUAGES.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}
      </select>
    </label>
    <label>
      <span data-i18n="preferences.themeLabel"></span>
      <select id="themeSelect">
        ${THEMES.map((item) => `<option value="${item.value}" data-i18n-option="${item.labelKey}"></option>`).join('')}
      </select>
    </label>
  `;
  container.querySelector('#languageSelect').value = currentLanguage;
  container.querySelector('#themeSelect').value = currentTheme;
}

function setLanguage(language) {
  currentLanguage = normalizeLanguage(language);
  localStorage.setItem(STORAGE_KEYS.language, currentLanguage);
  applyLanguage();
}

function setTheme(theme) {
  currentTheme = normalizeTheme(theme);
  localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
  applyTheme();
}

function applyPreferences() {
  applyTheme();
  applyLanguage();
}

function applyTheme() {
  const resolved = currentTheme === 'system'
    ? (mediaQuery.matches ? 'dark' : 'light')
    : currentTheme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = currentTheme;
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = translate(currentLanguage, element.dataset.i18n);
  }
  for (const element of document.querySelectorAll('[data-i18n-html]')) {
    element.innerHTML = translate(currentLanguage, element.dataset.i18nHtml);
  }
  for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
    element.setAttribute('placeholder', translate(currentLanguage, element.dataset.i18nPlaceholder));
  }
  for (const element of document.querySelectorAll('[data-i18n-aria]')) {
    element.setAttribute('aria-label', translate(currentLanguage, element.dataset.i18nAria));
  }
  for (const option of document.querySelectorAll('[data-i18n-option]')) {
    option.textContent = translate(currentLanguage, option.dataset.i18nOption);
  }
}

function getBrowserLanguage() {
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
