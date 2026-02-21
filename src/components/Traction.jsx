import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Hexagon, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Traction = () => {
    const ctaRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.cta-element', {
                scrollTrigger: {
                    trigger: ctaRef.current,
                    start: 'top 80%',
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }, ctaRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="traction" className="py-24 md:py-32 px-6 md:px-16 bg-surface relative z-10 border-t border-surfaceHover">
            <div
                ref={ctaRef}
                className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20"
            >
                {/* Content Side */}
                <div className="w-full md:w-1/2 flex flex-col items-start relative overflow-hidden">
                    <div className="cta-element inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full mb-6">
                        <span className="font-mono text-xs md:text-sm font-semibold tracking-widest text-accent uppercase">Traction & Credibility</span>
                    </div>

                    <h2 className="cta-element font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-primary tracking-tighter mb-6">
                        Backed by industry leaders' <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">recognition.</span>
                    </h2>

                    <p className="cta-element font-sans text-secondary font-medium text-base md:text-lg mb-10 max-w-lg leading-relaxed">
                        EdFi was recognized as the premier web3 educational startup globally, securing 1st Place out of hundreds of participants at the Binance Crypto Ideathon (EdFi Track).
                    </p>

                    <div className="cta-element flex items-center gap-4 bg-background p-4 rounded-xl border border-surfaceHover">
                        <div className="w-12 h-12 bg-surfaceHover rounded-full flex items-center justify-center border border-surfaceHover/50">
                            <Hexagon className="text-accent" size={24} />
                        </div>
                        <div>
                            <p className="font-heading font-bold text-primary">Binance Ideathon Winner</p>
                            <p className="font-sans text-sm text-secondary">Global EdFi Track 2025</p>
                        </div>
                        <CheckCircle2 className="text-green ml-auto" size={20} />
                    </div>
                </div>

                {/* Photo/Visual Container */}
                <div className="cta-element w-full md:w-1/2 flex items-center justify-center">
                    <div className="w-full max-w-md aspect-square bg-[#0A0A14] rounded-[2rem] border border-surfaceHover relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] group">

                        {/* Glow effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-accent/20 blur-[80px] rounded-full pointer-events-none z-0 transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

                        {/* Image Placeholder */}
                        <div className="absolute inset-2 rounded-[1.5rem] bg-surfaceHover overflow-hidden z-10 flex items-center justify-center border border-surfaceHover/50">
                            <img
                                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000"
                                alt="Founder Pitching"
                                className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 hover:opacity-100"
                            />
                            {/* Overlay tag */}
                            <div className="absolute bottom-4 left-4 bg-surface/80 backdrop-blur-md border border-surfaceHover px-4 py-2 rounded-lg">
                                <span className="font-mono text-xs text-primary font-bold tracking-widest uppercase">Stage Pitch, 2025</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Traction;
