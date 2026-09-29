import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './auth';
import AuthModal from '../components/AuthModal';

export default function AuthProvider({ children }) {
  const [state, setState] = useState(null);
  const navigate = useNavigate();
  const openAuth = useCallback((mode = 'signup', prefill = '') => setState({ mode, prefill, key: Date.now() }), []);
  const value = useMemo(() => ({ openAuth }), [openAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {state && (
        <AuthModal
          key={state.key}
          mode={state.mode}
          prefill={state.prefill}
          onClose={() => setState(null)}
          onDone={() => {
            setState(null);
            navigate('/demo');
          }}
        />
      )}
    </AuthContext.Provider>
  );
}
