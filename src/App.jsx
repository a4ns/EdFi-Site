import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import Protocol from './components/Protocol';
import Membership from './components/Membership';
import Footer from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const appRef = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Global GSAP setup could go here if needed
    }, appRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={appRef} className="relative w-full overflow-hidden bg-background text-dark font-sans selection:bg-accent selection:text-white">
      <Navbar />
      <Hero />
      <Features />
      <Philosophy />
      <Protocol />
      <Membership />
      <Footer />
    </div>
  );
}

export default App;
