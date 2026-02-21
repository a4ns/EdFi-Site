import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const Hero = () => {
    const container = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-text-part', {
                y: 40,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out',
                stagger: 0.1,
                delay: 0.1
            });

            // Node Animation
            gsap.to('.graph-node', {
                y: "random(-10, 10)",
                x: "random(-10, 10)",
                duration: "random(2, 4)",
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.2
            });

            gsap.fromTo('.graph-line',
                { strokeDasharray: 200, strokeDashoffset: 200 },
                { strokeDashoffset: 0, duration: 2, ease: 'power2.out', delay: 0.5 }
            );

            gsap.to('.data-packet', {
                motionPath: {
                    path: "#edge-1",
                    align: "#edge-1",
                    alignOrigin: [0.5, 0.5],
                },
                duration: 2,
                repeat: -1,
                ease: 'linear'
            });

        }, container);
        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={container}
            className="relative w-full min-h-[100dvh] overflow-hidden flex flex-col justify-center py-24 px-6 md:px-16 bg-background"
        >
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0 bg-background" />
            <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-accent/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-12">

                {/* Text Side */}
                <div className="flex flex-col items-start space-y-6">
                    <div className="hero-text-part inline-flex items-center gap-2 bg-surface border border-surfaceHover px-4 py-2 rounded-full mb-2">
                        <span className="text-xl">🏆</span>
                        <span className="font-sans text-xs md:text-sm font-semibold text-primary">1st Place Winner at Binance Crypto Ideathon 2025</span>
                    </div>

                    <h1 className="flex flex-col text-primary space-y-2">
                        <span className="hero-text-part font-heading font-extrabold text-5xl md:text-6xl lg:text-7xl tracking-tighter">
                            Rewarding Knowledge.
                        </span>
                        <span className="hero-text-part font-heading font-extrabold text-5xl md:text-6xl lg:text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                            Empowering Students.
                        </span>
                    </h1>

                    <p className="hero-text-part font-sans text-base md:text-lg text-secondary max-w-xl mt-6 leading-relaxed font-medium">
                        EdFi is a decentralized ecosystem that combines Learn-to-Earn mechanics, transparent scholarships, and verifiable blockchain-based Soulbound Tokens (SBTs) for academic degrees.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-10 hero-text-part">
                        <a href="#pitchdeck" className="relative overflow-hidden bg-accent text-white px-8 py-4 rounded-xl font-bold tracking-wide transition-transform duration-300 ease-out hover:scale-105 group text-sm flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]">
                            <span className="relative z-10 flex items-center gap-2">
                                Read the Pitch Deck
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        </a>
                        <button className="relative flex items-center justify-center overflow-hidden bg-surface text-primary border border-surfaceHover px-8 py-4 rounded-xl font-bold tracking-wide transition-colors duration-300 hover:bg-surfaceHover text-sm">
                            Join the Waitlist
                        </button>
                    </div>
                </div>

                {/* Abstract Graph UI Side */}
                <div className="hero-text-part w-full h-[400px] md:h-[500px] relative flex items-center justify-center overflow-hidden rounded-[2rem] border border-surfaceHover bg-surface/30 backdrop-blur-xl group">
                    <svg viewBox="0 0 400 400" className="w-full h-full p-8 overflow-visible">
                        <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#6366F1" stopOpacity="1" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Edges */}
                        <path id="edge-1" d="M 120 120 L 280 120" stroke="url(#lineGrad)" strokeWidth="2" fill="none" className="graph-line" />
                        <path id="edge-2" d="M 280 120 L 200 280" stroke="url(#lineGrad)" strokeWidth="2" fill="none" className="graph-line" />
                        <path id="edge-3" d="M 200 280 L 120 120" stroke="url(#lineGrad)" strokeWidth="2" fill="none" className="graph-line" />

                        {/* Animated Packets */}
                        <circle r="3" fill="#6366F1" filter="url(#glow)" className="data-packet opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Nodes */}
                        <g className="graph-node" transform="translate(120, 120)">
                            <circle r="30" fill="#0A0A14" stroke="#2B3139" strokeWidth="2" />
                            <circle r="4" fill="#6366F1" filter="url(#glow)" />
                            <text y="50" textAnchor="middle" fill="#A1A1AA" fontSize="12" fontFamily="monospace">University</text>
                        </g>

                        <g className="graph-node" transform="translate(280, 120)">
                            <circle r="35" fill="#0A0A14" stroke="#6366F1" strokeWidth="2" filter="url(#glow)" />
                            <text y="5" textAnchor="middle" fill="#ffffff" fontSize="24">🎓</text>
                            <text y="55" textAnchor="middle" fill="#ffffff" fontSize="14" fontFamily="monospace" fontWeight="bold">Student</text>
                        </g>

                        <g className="graph-node" transform="translate(200, 280)">
                            <circle r="30" fill="#0A0A14" stroke="#2B3139" strokeWidth="2" />
                            <rect x="-6" y="-6" width="12" height="12" fill="#10B981" filter="url(#glow)" />
                            <text y="50" textAnchor="middle" fill="#A1A1AA" fontSize="12" fontFamily="monospace">Employer</text>
                        </g>

                        {/* Central Hub */}
                        <g className="graph-node" transform="translate(200, 175)">
                            <circle r="15" fill="#13131F" stroke="#6366F1" strokeWidth="1" strokeDasharray="4 2" />
                            <text y="4" textAnchor="middle" fill="#6366F1" fontSize="10" fontFamily="monospace">EdFi</text>
                        </g>
                    </svg>
                </div>

            </div>
        </section>
    );
};

export default Hero;
