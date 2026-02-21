import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const Hero = () => {
    const container = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-text-part', {
                y: 60,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out',
                stagger: 0.15,
                delay: 0.2
            });
            gsap.from('.hero-cta', {
                y: 40,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                delay: 0.8
            });
            gsap.from('.hero-stats', {
                y: 20,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: 'power2.out',
                delay: 1.2
            });
        }, container);
        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={container}
            className="relative w-full h-[100dvh] overflow-hidden flex flex-col justify-center pb-20 px-6 md:px-16 bg-background"
        >
            {/* Background Image & Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center will-change-transform scale-105 opacity-30"
                style={{
                    // Crypto data center aesthetic
                    backgroundImage: `url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000')`
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 z-0 bg-radial-gradient from-accent/5 to-transparent circle at center top" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start space-y-6 mt-16">
                <h1 className="flex flex-col text-primary space-y-2">
                    <span className="hero-text-part font-mono text-accent font-bold text-sm tracking-widest uppercase mb-2">
                        EdFi Web3 Protocol
                    </span>
                    <span className="hero-text-part font-heading font-bold text-5xl md:text-7xl lg:text-8xl tracking-tighter">
                        Academic Status
                    </span>
                    <span className="hero-text-part font-heading font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#F0B90B]">
                        Now Liquid.
                    </span>
                </h1>
                <p className="hero-text-part font-sans text-base md:text-lg text-secondary max-w-xl mt-6 leading-relaxed font-medium">
                    The first university ecosystem powered by the Learn-to-Earn model. Convert GPA, attendance, and campus engagement into liquid tokens on the BNB Chain.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-10">
                    <button className="hero-cta relative overflow-hidden bg-accent text-black px-8 py-4 rounded-xl font-bold tracking-wide transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-105 group text-sm">
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                        <span className="relative z-10 flex items-center gap-2">
                            Start the Protocol
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>
                    <button className="hero-cta relative overflow-hidden bg-surfaceHover text-primary px-8 py-4 rounded-xl font-bold tracking-wide transition-colors duration-300 hover:bg-surfaceHover/80 text-sm">
                        Read Whitepaper
                    </button>
                </div>

                {/* Fake Crypto Stats Row */}
                <div className="flex items-center gap-8 mt-16 pt-8 border-t border-surfaceHover w-full max-w-2xl">
                    <div className="hero-stats flex flex-col">
                        <span className="text-secondary text-xs font-mono mb-1">24H Volume</span>
                        <span className="text-primary font-bold text-xl">1.2M <span className="text-sm font-normal text-secondary">EDFI</span></span>
                    </div>
                    <div className="hero-stats flex flex-col">
                        <span className="text-secondary text-xs font-mono mb-1">Avg APY</span>
                        <span className="text-green font-bold text-xl">+14.5%</span>
                    </div>
                    <div className="hero-stats flex flex-col">
                        <span className="text-secondary text-xs font-mono mb-1">Active Scholars</span>
                        <span className="text-primary font-bold text-xl">4,208</span>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Hero;
