export const appUrl = () => (typeof window === 'undefined' ? 'https://edfi.app/demo' : `${window.location.origin}/demo`);
