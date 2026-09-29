import { useAuth } from '../../state/auth';

export default function StartEarning() {
  const { openAuth } = useAuth();
  return (
    <section className="page-x pb-12 pt-4 text-center lg:pb-16">
      <h2 className="section-title">Start earning today</h2>
      <button type="button" onClick={() => openAuth('signup')} className="btn btn-primary btn-lg mt-8 w-full sm:w-auto sm:px-10">
        Sign Up Now
      </button>
    </section>
  );
}
