// An unavailable or rejected clipboard write must never be reported as copied.
export async function copyText(value) {
  try {
    if (!globalThis.navigator?.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export async function readClipboardText() {
  try {
    if (!globalThis.navigator?.clipboard?.readText) return { ok: false };
    return { ok: true, text: await navigator.clipboard.readText() };
  } catch {
    return { ok: false };
  }
}
