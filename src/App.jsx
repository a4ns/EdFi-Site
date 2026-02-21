import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardApp from './pages/DashboardApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<DashboardApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
