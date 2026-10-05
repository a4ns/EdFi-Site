import Header from '../components/Header';
import Hero from '../components/home/Hero';
import TrustStats from '../components/home/TrustStats';
import EarnMarkets from '../components/home/EarnMarkets';
import Products from '../components/home/Products';
import AppDownload from '../components/home/AppDownload';
import Roadmap from '../components/home/Roadmap';
import FAQ from '../components/home/FAQ';
import StartEarning from '../components/home/StartEarning';
import Footer from '../components/Footer';
import { useEffect } from 'react';
import { useLocale } from '../state/locale';

export default function LandingPage() {
  const { t } = useLocale();
  useEffect(() => {
    document.title = t('EdFi | Learn-to-Earn on BNB Chain');
  }, [t]);
  return (
    <div className="min-h-screen bg-page">
      <Header variant="home" />
      <main>
        <Hero />
        <TrustStats />
        <EarnMarkets />
        <Products />
        <AppDownload />
        <Roadmap />
        <FAQ />
        <StartEarning />
      </main>
      <Footer />
    </div>
  );
}
