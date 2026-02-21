import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Membership = () => {
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
        <section id="access" className="py-24 px-6 md:px-16 bg-background relative z-10 border-t border-surfaceHover">
            <div
                ref={ctaRef}
                className="max-w-4xl mx-auto bg-surface rounded-2xl md:rounded-[2rem] p-10 md:p-20 text-center flex flex-col items-center justify-center border border-surfaceHover relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Zap size={150} className="text-accent" />
                </div>

                {/* Abstract Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-accent/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

                <h2 className="cta-element font-heading font-bold text-3xl md:text-5xl lg:text-6xl text-primary tracking-tighter mb-6 relative z-10">
                    Ready to scale <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#F0B90B] pt-2 block font-extrabold">academic performance?</span>
                </h2>

                <p className="cta-element font-sans text-secondary font-medium text-sm md:text-base mb-10 max-w-lg relative z-10 leading-relaxed">
                    Join the Binance Crypto Ideathon winning ecosystem. Integrate BNB Chain directly into your educational process with zero friction.
                </p>

                <Link to="/demo" className="cta-element relative overflow-hidden bg-accent text-black px-10 py-4 rounded-xl font-bold text-base tracking-wide transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-105 group shadow-[0_10px_30px_rgba(252,213,53,0.2)] z-10 mx-auto block w-max">
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        Initialize Access Demo
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
            </div>
        </section>
    );
};

export default Membership;
