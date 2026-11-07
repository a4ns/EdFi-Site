import { expect, it } from 'vitest';
import { LANGUAGE_OPTIONS, LOCALES } from './locale';

it('lists every supported language in Kazakh, English, Russian display order', () => {
  expect(LANGUAGE_OPTIONS).toEqual([
    { value: 'kk', label: 'Қазақша' },
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
  ]);
  expect(LANGUAGE_OPTIONS.map(({ value }) => value).sort()).toEqual([...LOCALES].sort());
});
