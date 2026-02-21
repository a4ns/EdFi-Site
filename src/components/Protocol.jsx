import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Protocol = () => {
    const containerRef = useRef(null);
    const cardsRef = useRef([]);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            ScrollTrigger.matchMedia({
                // Desktop only for pinning
                "(min-width: 768px)": function () {
                    const cards = cardsRef.current;

                    cards.forEach((card, index) => {
                        if (index === cards.length - 1) return; // Skip last card

                        gsap.to(card, {
                            scale: 0.95,
                            opacity: 0.4,
                            filter: 'blur(10px)',
                            y: -50,
                            ease: 'power1.inOut',
                            scrollTrigger: {
                                trigger: card,
                                start: 'top top',
                                end: `bottom top`,
                                scrub: 1,
                                pin: true,
                                pinSpacing: false,
                            }
                        });
                    });
                }
            });

            // EKG Animation for Card 3
            gsap.to('.ekg-path', {
                strokeDashoffset: 0,
                duration: 1.5,
                repeat: -1,
                ease: 'linear',
            });
            // Rotation for Card 1
            gsap.to('.geo-rotation', {
                rotation: 360,
                repeat: -1,
                duration: 25,
                ease: 'linear',
                transformOrigin: "center center"
            });
            // Laser scan for Card 2
            gsap.to('.laser-scan', {
                y: 200,
                repeat: -1,
                yoyo: true,
                duration: 2,
                ease: 'power2.inOut'
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const steps = [
        {
            id: 'EARN',
            title: 'Academic Mining',
            description: 'Your academic trajectory is evaluated continuously. High GPA (Performance), 100% attendance, and published articles are validated on-chain via custom oracles to mint EDC tokens.',
            Visual: () => (
                <svg viewBox="0 0 200 200" className="w-full h-full text-accent geo-rotation drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
                    <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M100 20 L100 180 M20 100 L180 100" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
                    <rect x="70" y="70" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="4" transform="rotate(45 100 100)" />
                    {/* Inner core */}
                    <circle cx="100" cy="100" r="20" fill="currentColor" opacity="0.2" />
                </svg>
            )
        },
        {
            id: 'SPEND',
            title: 'Campus Economy',
            description: 'Zero friction daily utility. Spend your earned EDC directly on campus infrastructure: pay for the canteen, dormitory fees, or exclusive university merchandise.',
            Visual: () => (
                <div className="relative w-full h-full bg-surfaceHover/40 rounded-xl overflow-hidden p-6 border border-surfaceHover">
                    <div className="grid grid-cols-8 gap-2 h-full opacity-40">
                        {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className="w-full h-full bg-surfaceHover rounded-sm border border-secondary/10"></div>
                        ))}
                    </div>
                    <div className="laser-scan absolute top-0 left-0 w-full h-[1px] bg-accent shadow-[0_0_20px_rgba(252,213,53,0.9)] filter blur-[0.5px]"></div>

                    <div className="absolute bottom-4 left-4 font-mono text-xs text-secondary bg-surface px-2 py-1 rounded border border-surfaceHover">
                        Block Height: <span className="text-accent animate-pulse">24,193,002</span>
                    </div>
                </div>
            )
        },
        {
            id: 'LIQUIDITY',
            title: 'Real World Bridge',
            description: 'Your earned assets are truly liquid. Withdraw EDC out of the campus sandbox via seamless integration with Binance Pay, P2P exchange, or stake for future yields.',
            Visual: () => (
                <svg viewBox="0 0 400 200" className="w-full h-full text-green p-4 drop-shadow-[0_0_10px_rgba(14,203,129,0.4)]">
                    {/* Background Grid */}
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2B3139" strokeWidth="1" />
                    </pattern>
                    <rect width="400" height="200" fill="url(#grid)" />

                    <path
                        className="ekg-path"
                        d="M 0 100 L 80 100 L 100 40 L 120 160 L 140 100 L 220 100 L 240 60 L 260 140 L 280 100 L 400 100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="600"
                        strokeDashoffset="600"
                    />
                </svg>
            )
        }
    ];

    return (
        <section id="process" ref={containerRef} className="relative w-full bg-background rounded-t-3xl md:rounded-t-[3rem] py-10 z-30">
            <div className="w-full h-full relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-surfaceHover via-accent/20 to-transparent hidden md:block z-0"></div>

                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        ref={(el) => (cardsRef.current[index] = el)}
                        className="w-full min-h-[100dvh] flex items-center justify-center p-6 md:p-16 sticky top-0"
                        style={{ zIndex: index + 1 }}
                    >
                        <div className="w-full max-w-6xl h-auto md:h-[65vh] bg-surface border border-surfaceHover rounded-2xl md:rounded-[2rem] p-8 md:p-14 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row shadow-xl overflow-hidden will-change-transform relative">

                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-surfaceHover m-4 rounded-tr-xl opacity-50 hidden md:block"></div>

                            <div className="w-full md:w-1/2 flex flex-col justify-center pr-0 md:pr-16 mb-10 md:mb-0 relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-2 bg-accent rounded-sm"></div>
                                    <span className="font-mono text-sm tracking-widest text-accent uppercase font-bold">{step.id}</span>
                                </div>
                                <div>
                                    <h3 className="font-heading font-extrabold text-3xl md:text-5xl text-primary tracking-tight mb-6">{step.title}</h3>
                                    <p className="font-sans text-sm md:text-base text-secondary font-medium leading-relaxed max-w-sm">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full md:w-1/2 h-[300px] md:h-full bg-background rounded-xl border border-surfaceHover overflow-hidden relative shadow-inner flex items-center justify-center p-6 md:p-10 relative z-10">
                                <step.Visual />
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Protocol;
