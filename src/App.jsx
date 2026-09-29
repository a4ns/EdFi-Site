import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MarketsProvider from './state/MarketsProvider';
import AuthProvider from './state/AuthProvider';
import LandingPage from './pages/LandingPage';
import DashboardApp from './pages/DashboardApp';
import MarketsPage from './pages/MarketsPage';

function App() {
  return (
    <MarketsProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/demo" element={<DashboardApp />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MarketsProvider>
  );
}

export default App;
