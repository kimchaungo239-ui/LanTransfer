import assert from 'node:assert/strict';
import test from 'node:test';
import { LANGUAGES, THEMES, translate } from '../src/public/preferences-core.js';

test('preferences expose Chinese and English language options', () => {
  assert.deepEqual(LANGUAGES.map((item) => item.value), ['zh', 'en']);
  assert.equal(translate('zh', 'console.heroTitle'), '像递一只 U 盘一样简单。');
  assert.equal(translate('en', 'console.heroTitle'), 'Pass files around the room.');
});

test('preferences expose light, dark, and system theme options', () => {
  assert.deepEqual(THEMES.map((item) => item.value), ['system', 'light', 'dark']);
  assert.equal(translate('zh', 'preferences.themeDark'), '深色');
  assert.equal(translate('en', 'preferences.themeDark'), 'Dark');
});

test('missing translations fall back to English key text', () => {
  assert.equal(translate('zh', 'missing.key'), 'missing.key');
  assert.equal(translate('fr', 'console.copyUrl'), 'Copy URL');
});
