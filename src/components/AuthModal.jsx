import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Modal from './dashboard/Modal';

const TABS = [
  ['email', 'Email', 'University email', 'name@kazatu.edu.kz'],
  ['id', 'Student ID', 'Student ID', 'e.g. 210404'],
  ['phone', 'Phone', 'Phone number', '+7 700 000 00 00'],
];

// Demo-only credentials flow: nothing is sent or stored, but it behaves like a real two-step form.
export default function AuthModal({ mode: initialMode, prefill = '', onClose, onDone }) {
  const [mode, setMode] = useState(initialMode);
  const [tab, setTab] = useState(prefill && !prefill.includes('@') && /^\d+$/.test(prefill) ? 'id' : 'email');
  const [identifier, setIdentifier] = useState(prefill);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const signup = mode === 'signup';
  const [, , label, placeholder] = TABS.find(([id]) => id === tab);
  const passOk = password.length >= 8;

  return (
    <Modal title={signup ? 'Create your EdFi account' : 'Log In'} onClose={onClose}>
      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (identifier.trim()) setStep(2);
          }}
        >
          <div role="tablist" aria-label="Sign in method" className="flex gap-6 border-b border-line">
            {TABS.map(([id, name]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className="tab !text-sm" onClick={() => setTab(id)}>
                {name}
              </button>
            ))}
          </div>
          <label htmlFor="auth-id" className="mt-6 block text-sm text-ink-3">
            {label}
          </label>
          <input
            id="auth-id"
            className="input mt-2"
            placeholder={placeholder}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete={tab === 'email' ? 'email' : 'off'}
          />
          <button type="submit" className="btn btn-primary btn-lg mt-6 w-full" disabled={!identifier.trim()}>
            Next
          </button>
          <p className="mt-4 text-center text-sm text-ink-3">
            {signup ? 'Already registered?' : 'New to EdFi?'}{' '}
            <button type="button" className="font-medium text-yellow-text hover:underline" onClick={() => setMode(signup ? 'login' : 'signup')}>
              {signup ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (passOk) onDone();
          }}
        >
          <p className="text-sm text-ink-3">
            {signup ? 'Set a password for' : 'Enter the password for'} <span className="font-medium text-ink">{identifier}</span>
          </p>
          <label htmlFor="auth-pass" className="mt-5 block text-sm text-ink-3">
            Password
          </label>
          <div className="mt-2 flex h-12 items-center rounded-lg border border-line-strong px-4 focus-within:border-yellow hover:border-yellow">
            <input
              id="auth-pass"
              type={show ? 'text' : 'password'}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
              placeholder={signup ? 'At least 8 characters' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signup ? 'new-password' : 'current-password'}
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="text-ink-3 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {signup && (
            <p className={`mt-2 text-xs ${passOk ? 'text-up' : 'text-ink-3'}`}>{passOk ? 'Looks good' : 'Use at least 8 characters'}</p>
          )}
          <button type="submit" className="btn btn-primary btn-lg mt-6 w-full" disabled={!passOk}>
            {signup ? 'Create Account' : 'Log In'}
          </button>
          <button type="button" className="mt-3 w-full text-center text-sm font-medium text-ink-3 hover:text-ink" onClick={() => setStep(1)}>
            Back
          </button>
        </form>
      )}
      <p className="mt-5 border-t border-line pt-4 text-center text-xs text-ink-3">
        Demo only: any details work and nothing is stored.
      </p>
    </Modal>
  );
}
