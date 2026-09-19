import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
    const navRef = useRef(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                start: 'top -50',
                onUpdate: (self) => {
                    setIsScrolled(self.scroll() > 50);
                },
            });
        }, navRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 px-4 pointer-events-none">
            <nav
                ref={navRef}
                className={`pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] flex items-center justify-between px-6 py-3 rounded-2xl ${isScrolled
                        ? 'bg-surface/90 backdrop-blur-xl border border-surfaceHover w-[90%] max-w-5xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                        : 'bg-transparent border-transparent w-[95%] max-w-7xl'
                    }`}
            >
                {/* Logo */}
                <div className="font-heading font-bold text-2xl tracking-tighter transition-colors duration-500 text-accent flex items-center gap-2">
                    {/* Binance-style subtle logo icon */}
                    <div className="w-6 h-6 bg-accent rounded-sm flex items-center justify-center transform rotate-45">
                        <div className="w-3 h-3 bg-background transform rotate-0 rounded-sm"></div>
                    </div>
                    EdFi
                </div>

                {/* Links */}
                <ul className="hidden md:flex items-center space-x-8">
                    {['Ecosystem', 'Process', 'Access'].map((item) => (
                        <li key={item}>
                            <a
                                href={`#${item.toLowerCase()}`}
                                className={`text-sm font-semibold tracking-wide transition-all duration-300 hover:-translate-y-[1px] ${isScrolled ? 'text-primary hover:text-accent' : 'text-primary/90 hover:text-accent'
                                    }`}
                            >
                                {item}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                <button
                    className="relative overflow-hidden bg-surfaceHover text-primary border border-surfaceHover px-6 py-2 rounded-xl text-sm font-bold tracking-wide transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-105 group"
                >
                    <span className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                    <span className="relative z-10 flex items-center gap-2 group-hover:text-black transition-colors duration-400">
                        Connect
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </span>
                </button>
            </nav>
        </div>
    );
};

export default Navbar;
