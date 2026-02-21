import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Problem from '../components/Problem';
import Solution from '../components/Solution';
import HowItWorks from '../components/HowItWorks';
import Traction from '../components/Traction';
import Roadmap from '../components/Roadmap';
import Founder from '../components/Founder';
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
            <Problem />
            <Solution />
            {/* Mechanism & Roles Sections */}
            <HowItWorks />
            <Traction />
            <Roadmap />
            <Founder />
            <Footer />
        </div>
    );
};

export default LandingPage;
