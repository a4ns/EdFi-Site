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

export function formatDemoAmount(units) {
  const [whole, fraction] = demoAmountInput(Math.abs(units)).split('.');
  return `${units < 0 ? '-' : ''}${Number(whole).toLocaleString('en-US')}.${fraction}`;
}

export const isDemoAddress = (address) => typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address.trim());
