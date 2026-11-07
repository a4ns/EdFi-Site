import { numberFormatter } from './numberFormat';

// The prototype supports two decimal places. These units are not BEP-20 base units.
export const DEMO_UNITS_PER_EDC = 100;

export function parseDemoAmount(input) {
  if (typeof input !== 'string') return null;
  const text = input.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) return null;
  const [whole = '', fraction = ''] = text.split('.');
  const units = Number(whole) * DEMO_UNITS_PER_EDC + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(units) ? units : null;
}

export function demoAmountInput(units) {
  if (!Number.isSafeInteger(units) || units < 0) throw new RangeError('Invalid demo amount');
  return `${Math.floor(units / DEMO_UNITS_PER_EDC)}.${String(units % DEMO_UNITS_PER_EDC).padStart(2, '0')}`;
}

export function demoAmountPortion(units, percent) {
  return Number((BigInt(units) * BigInt(percent)) / 100n);
}

export function formatDemoAmount(units, locale = 'en') {
  const [whole, fraction] = demoAmountInput(Math.abs(units)).split('.');
  const formatter = numberFormatter(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Never convert integer hundredths to a floating-point amount: even the
  // largest safe balance must retain its exact last two digits in every locale.
  const parts = formatter.formatToParts(units < 0 ? -BigInt(whole) : BigInt(whole));
  if (units < 0 && whole === '0') parts.unshift({ type: 'minusSign', value: '-' });
  return parts.map((part) => part.type === 'fraction' ? fraction : part.value).join('');
}

export const isDemoAddress = (address) => typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address.trim());
