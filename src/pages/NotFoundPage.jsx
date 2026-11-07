import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLocale } from '../state/locale';

export default function NotFoundPage() {
  const { t } = useLocale();
  useEffect(() => { document.title = t('Page not found | EdFi'); }, [t]);
  return (
    <div className="min-h-screen bg-page">
      <Header />
      <main id="main-content" tabIndex={-1} className="page-x flex min-h-[60vh] items-center py-16 scroll-mt-16 focus:outline-none">
        <div className="max-w-xl">
          <p className="num text-sm font-medium text-yellow-text">{t('Error {code}', { code: '404' })}</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink md:text-4xl">{t('This page could not be found')}</h1>
          <p className="mt-4 text-base leading-7 text-ink-3">{t('The address may be incomplete or the page may have moved. Choose a destination to continue exploring EdFi.')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="btn btn-primary btn-lg"><ArrowLeft size={18} aria-hidden="true" />{t('Back to home')}</Link>
            <Link to="/markets" className="btn btn-secondary btn-lg"><Search size={18} aria-hidden="true" />{t('Markets')}</Link>
            <Link to="/demo" className="btn btn-secondary btn-lg">{t('Open web demo')}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
