import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(cwd(), 'src/index.css'), 'utf8');
const tokens = (theme) => Object.fromEntries([...css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([^}]+)\\}`))[1]
  .matchAll(/--c-([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)]
  .map(([, name, r, g, b]) => [name, [Number(r), Number(g), Number(b)]]));
const luminance = (rgb) => rgb.map((value) => value / 255)
  .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

describe.each(['dark', 'light'])('%s theme contrast', (theme) => {
  const colors = tokens(theme);
  it('keeps normal-sized readable text above 4.5:1 on every content surface', () => {
    for (const surface of ['page', 'deep', 'card', 'raised']) {
      for (const foreground of ['ink', 'ink-2', 'ink-3', 'yellow-text', 'up', 'down']) {
        expect(contrast(colors[foreground], colors[surface]), `${foreground} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('keeps tinted status labels and solid price-pill text readable', () => {
    for (const key of ['up', 'down']) {
      expect(contrast(colors[`${key}-on`], colors[key]), `${key} pill`).toBeGreaterThanOrEqual(4.5);
      for (const surface of ['page', 'card', 'raised']) {
        const tint = colors[key].map((value, index) => value * 0.1 + colors[surface][index] * 0.9);
        expect(contrast(colors[key], tint), `${key} tinted chip on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('keeps the accent yellow for large text and graphics above 3:1', () => {
    for (const surface of ['page', 'deep', 'card']) {
      expect(contrast(colors['yellow-accent'], colors[surface]), `yellow-accent on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });
  it('has a visible focus indicator against the surrounding surfaces', () => {
    for (const surface of ['page', 'deep', 'card', 'raised']) {
      expect(contrast(colors.focus, colors[surface]), `focus on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });
});
