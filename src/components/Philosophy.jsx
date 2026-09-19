import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Philosophy = () => {
    const sectionRef = useRef(null);
    const textRef = useRef(null);
    const bgRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Parallax effect for tech background
            gsap.to(bgRef.current, {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
                y: '15%',
                ease: 'none',
            });

            gsap.from('.manifesto-line', {
                scrollTrigger: {
                    trigger: textRef.current,
                    start: 'top 75%',
                },
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power2.out',
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative w-full py-32 md:py-48 overflow-hidden bg-[#07090b] text-primary border-t border-surfaceHover z-20">
            {/* Background Texture & Parallax */}
            <div
                ref={bgRef}
                className="absolute inset-0 z-0 bg-cover bg-center opacity-10 transform -translate-y-[5%]"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1639762681485-074b7f4ec651?q=80&w=2000')` // Abstract crypto graphic
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#07090b]/80 via-transparent to-[#07090b] z-0" />

            {/* Grid overlay */}
            <div className="absolute inset-0 z-0 opacity-5" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            {/* Content */}
            <div ref={textRef} className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 flex flex-col justify-center min-h-[50vh]">
                <div className="manifesto-line flex items-center gap-4 mb-8">
                    <div className="h-[1px] w-12 bg-accent"></div>
                    <span className="font-mono text-sm tracking-widest uppercase text-accent font-bold">Consensus Mechanism</span>
                </div>

                <div className="manifesto-line font-heading font-medium text-lg md:text-2xl text-secondary mb-12 tracking-wide">
                    Legacy academic systems focus on: <span className="text-red/90 line-through decoration-red">isolated grades & formal attendance.</span>
                </div>

                <h2 className="flex flex-col gap-2">
                    <span className="manifesto-line font-drama font-bold text-4xl md:text-6xl lg:text-7xl tracking-tighter text-primary">
                        We operate on:
                    </span>
                    <span className="manifesto-line font-drama font-bold text-5xl md:text-7xl lg:text-[100px] leading-[0.9] mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#F0B90B]">
                        Actionable Assets.
                    </span>
                </h2>

                <div className="manifesto-line mt-16 max-w-xl text-secondary font-sans text-base leading-relaxed border-l-2 border-accent pl-6 py-1 bg-gradient-to-r from-accent/5 to-transparent">
                    Intelligence should not be trapped in a transcript. The Learn-to-Earn model emancipates academic effort, transforming every high GPA and completed protocol into tangible, fluid value inside a secure web3 sandbox.
                </div>
            </div>
        </section>
    );
};

export default Philosophy;
