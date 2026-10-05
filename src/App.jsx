import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MarketsProvider from './state/MarketsProvider';
import AuthProvider from './state/AuthProvider';
import LocaleProvider from './state/LocaleProvider';
import LandingPage from './pages/LandingPage';
import DashboardApp from './pages/DashboardApp';
import MarketsPage from './pages/MarketsPage';
import CoinDetailPage from './pages/CoinDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import RouteAccessibility from './components/RouteAccessibility';

function App() {
  return (
    <LocaleProvider>
      <MarketsProvider>
        <BrowserRouter>
          <AuthProvider>
            <RouteAccessibility />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/markets/:symbol" element={<CoinDetailPage />} />
              <Route path="/demo" element={<DashboardApp />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </MarketsProvider>
    </LocaleProvider>
  );
}

export default App;
