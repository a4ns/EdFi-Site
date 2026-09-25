import { Link } from 'react-router-dom';

export default function StartEarning() {
  return (
    <section className="page-x py-16 text-center lg:py-24">
      <h2 className="section-title">Start earning today</h2>
      <Link to="/demo" className="btn btn-primary btn-lg mt-8 w-full sm:w-auto sm:px-10">Sign Up Now</Link>
    </section>
  );
}
