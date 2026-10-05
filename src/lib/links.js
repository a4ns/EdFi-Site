export const appUrl = () => (typeof window === 'undefined' ? 'https://ed-fi.vercel.app/demo' : `${window.location.origin}/demo`);
