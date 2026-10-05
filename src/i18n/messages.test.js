import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import { dictionaries, messageGroups, messages, translate } from './messages';
import { LOCALES, localeTag } from '../lib/locale';
import { DEMO_COPY, INITIAL_TASKS, MERCHANTS, NOTIFICATIONS, ANNOUNCEMENTS, initialTransactions } from '../components/dashboard/data';
import { SIDEBAR_ITEMS } from '../components/dashboard/nav';
import { NAV, FOOTER_COLUMNS } from '../data/content';

const placeholders = (text) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();
const variants = (message) => typeof message === 'string' ? [message] : Object.values(message);

function sourceAudit() {
  const root = resolve(cwd(), 'src');
  const literalKeys = new Set();
  const raw = [];
  function addKey(node) {
    if (node.type === 'Literal' && typeof node.value === 'string') literalKeys.add(node.value);
    if (node.type === 'ConditionalExpression') { addKey(node.consequent); addKey(node.alternate); }
  }
  for (const file of readdirSync(root, { recursive: true }).filter((name) => /\.(js|jsx)$/.test(name) && !name.includes('.test.') && !name.startsWith('i18n/'))) {
    const strings = { create: () => ({
      CallExpression(node) { if (node.callee.name === 't' && node.arguments[0]) addKey(node.arguments[0]); },
      JSXText(node) {
        const text = node.value.replace(/\s+/g, ' ').trim();
        if (/[A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(text)) raw.push({ file, text });
      },
      JSXAttribute(node) {
        const htmlElement = /^[a-z]/.test(node.parent.name?.name ?? '');
        if (htmlElement && ['aria-label', 'placeholder', 'title', 'alt'].includes(node.name.name) && node.value?.type === 'Literal' && node.value.value) {
          raw.push({ file, text: node.value.value });
        }
      },
    }) };
    const results = new Linter().verify(readFileSync(`${root}/${file}`, 'utf8'), [{
      files: ['**/*.{js,jsx}'],
      languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { localeAudit: { rules: { strings } } },
      rules: { 'localeAudit/strings': 'error' },
    }], { filename: file });
    expect(results, `Parse ${file}`).toEqual([]);
  }
  return { literalKeys, raw };
}

describe('translation dictionary integrity', () => {
  it('has identical complete keys, no cross-domain duplicates and matching placeholders', () => {
    const keys = Object.keys(messages).sort();
    const allKeys = Object.values(messageGroups).flatMap((group) => Object.keys(group));
    expect(new Set(allKeys).size).toBe(allKeys.length);
    expect(keys.length).toBeGreaterThan(400);
    for (const locale of LOCALES) {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(keys);
      for (const key of keys) {
        const message = dictionaries[locale][key];
        expect(message, `${locale}: ${key}`).toBeDefined();
        for (const variant of variants(message)) {
          expect(typeof variant, `${locale}: ${key}`).toBe('string');
          expect(variant.trim(), `${locale}: ${key}`).not.toBe('');
          expect(placeholders(variant), `${locale}: ${key}`).toEqual(placeholders(key));
        }
        if (typeof message === 'object') {
          expect(Object.keys(message).sort(), `${locale} plural: ${key}`).toEqual(new Intl.PluralRules(localeTag(locale)).resolvedOptions().pluralCategories.sort());
        }
      }
    }
  });

  it('covers literal translation calls and permits only explicit proper names and symbols outside t()', () => {
    const { literalKeys, raw } = sourceAudit();
    expect([...literalKeys].filter((key) => !Object.hasOwn(messages, key))).toEqual([]);
    // Brand/network names, fixed opaque IDs and language autonyms are deliberate.
    const invariantText = new Set(['USD · KZT', '/USDT', 'AK', 'Ansar Kazbekov', 'UID 210404 ·', 'UID 210404',
      'English', 'Русский', 'Қазақша', 'EDFI', 'USD', 'EDC', 'EDC (', 'EdFi Coin', 'BNB Smart Chain', 'BNB Smart Chain (BEP20)']);
    expect(raw.filter(({ text }) => !invariantText.has(text))).toEqual([]);
  });

  it('covers dynamic navigation, demo warnings, sample ledger, merchant and notification fields', () => {
    const keys = [
      ...Object.values(DEMO_COPY), ...ANNOUNCEMENTS,
      ...INITIAL_TASKS.flatMap((item) => [item.title, item.sub, item.cta, item.doneText].filter(Boolean)),
      ...MERCHANTS.flatMap((item) => [item.name, item.sub]),
      ...NOTIFICATIONS.flatMap((item) => [item.title, item.text, item.ago]),
      ...initialTransactions(0).flatMap((item) => [item.title, item.sub]),
      ...SIDEBAR_ITEMS.map((item) => item.label),
      ...NAV.flatMap((item) => [item.label, ...(item.menu ?? []).flatMap((entry) => [entry.title, entry.desc])]),
      ...FOOTER_COLUMNS.flatMap((item) => [item.title, ...item.links.map(([label]) => label)]),
    ];
    for (const key of keys) expect(messages[key], `Dynamic message: ${key}`).toBeDefined();
  });

  it('uses Russian plural categories and retains placeholders safely', () => {
    expect(translate('ru', '{count} ready to claim', { count: 1 })).toBe('1 награда доступна');
    expect(translate('ru', '{count} ready to claim', { count: 2 })).toBe('2 награды доступны');
    expect(translate('ru', '{count} ready to claim', { count: 5 })).toBe('5 наград доступно');
    expect(translate('ru', '{count} ready to claim', { count: 21 })).toBe('21 награда доступна');
    expect(translate('kk', 'Last {count} days', { count: 30 })).toBe('Соңғы 30 күн');
    expect(translate('en', 'Last {count} days', { count: 1 })).toBe('Last 1 day');
    expect(translate('unknown', 'Language')).toBe('Language');
    expect(translate('__proto__', 'Language')).toBe('Language');
    expect(translate('ru', 'toString')).toBe('toString');
    expect(translate('ru', 'unrecognized source key')).toBe('unrecognized source key');
    expect(translate('ru', 'Sample recipient {address}', { address: '<script>never executed</script>' })).toContain('<script>never executed</script>');
  });
});
