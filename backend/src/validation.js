import { fail } from './errors.js';

// A technical storage/CPU bound, not a token denomination or economic policy.
export const MAX_QUANTITY_DIGITS = 128;
const identifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function object(value, keys, label) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).some((key) => !keys.includes(key))) {
    fail('INVALID_INPUT', `${label} must be a plain object with only supported fields`);
  }
  return value;
}

export function id(value, label) {
  if (typeof value !== 'string' || !identifier.test(value)) {
    fail('INVALID_INPUT', `${label} must be 1–128 ASCII identifier characters`);
  }
  return value;
}

export function quantity(value, { zero = false } = {}) {
  if (typeof value !== 'string' || value.length > MAX_QUANTITY_DIGITS ||
      !(zero ? /^(0|[1-9][0-9]*)$/ : /^[1-9][0-9]*$/).test(value)) {
    fail('INVALID_INPUT', `quantity must be a canonical ${zero ? 'nonnegative' : 'positive'} integer string of at most ${MAX_QUANTITY_DIGITS} digits`);
  }
  return value;
}

export function version(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 3) {
    fail('INVALID_INPUT', 'expectedVersion must be an integer from 1 to 3');
  }
  return value;
}

export function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    fail('INVALID_CLOCK', 'clock must synchronously return an ISO UTC timestamp');
  }
  return value;
}

export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

export function immutable(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value;
}
