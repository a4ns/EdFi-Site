import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Philosophy from '../components/Philosophy';
import Protocol from '../components/Protocol';
import Roadmap from '../components/Roadmap';
import Membership from '../components/Membership';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
    const appRef = useRef();

    useLayoutEffect(() => {
        const ctx = gsap.context(() => { }, appRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={appRef} className="relative w-full overflow-hidden bg-background text-primary font-sans selection:bg-accent selection:text-black">
            <Navbar />
            <Hero />
            <Features />
            <Philosophy />
            {/* Roadmap & Tokenomics Section */}
            <Protocol />
            <Roadmap />
            <Membership />
            <Footer />
        </div>
    );
};

export default LandingPage;
