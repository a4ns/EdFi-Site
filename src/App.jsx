import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MarketsProvider from './state/MarketsProvider';
import LandingPage from './pages/LandingPage';
import DashboardApp from './pages/DashboardApp';

function App() {
  return (
    <MarketsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DashboardApp />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </MarketsProvider>
  );
}

export default App;
