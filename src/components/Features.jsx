import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, LayoutDashboard, UserCheck, MousePointer2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Sub-components for each Feature Card
const DiagnosticShuffler = () => {
    const [cards, setCards] = useState([
        { id: 1, label: 'Zero friction onboarding', val: '+0.4%' },
        { id: 2, label: 'Pure academic utility', val: '+1.2%' },
        { id: 3, label: 'Essential data only', val: '+0.8%' }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCards((prev) => {
                const newCards = [...prev];
                const last = newCards.pop();
                newCards.unshift(last);
                return newCards;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-48 flex items-center justify-center pt-8">
            {cards.map((card, index) => {
                const isTop = index === 0;
                const isMiddle = index === 1;

                return (
                    <div
                        key={card.id}
                        className="absolute w-3/4 bg-surfaceHover/80 border border-surfaceHover backdrop-blur-md rounded-xl p-4 flex items-center justify-between shadow-lg transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{
                            transform: `translateY(${isTop ? '0px' : isMiddle ? '12px' : '24px'}) scale(${isTop ? 1 : isMiddle ? 0.95 : 0.9})`,
                            opacity: isTop ? 1 : isMiddle ? 0.7 : 0.3,
                            zIndex: 3 - index
                        }}
                    >
                        <div className="flex flex-col">
                            <span className="font-sans font-medium text-xs text-primary">{card.label}</span>
                            <span className="font-mono text-[10px] text-secondary mt-1 tracking-widest uppercase">Process {String(card.id).padStart(2, '0')}</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-green">{card.val}</span>
                    </div>
                );
            })}

            {/* Background Grid Accent */}
            <div className="absolute inset-0 z-[-1] opacity-20" style={{ backgroundImage: 'linear-gradient(to right, #2B3139 1px, transparent 1px), linear-gradient(to bottom, #2B3139 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
        </div>
    );
};

const TelemetryTypewriter = () => {
    const messages = [
        "Evaluating component hierarchy...",
        "Rendering visual feedback... [OK]",
        "Executing smart contract bridge...",
        "Synchronizing UI states... [OK]"
    ];
    const [text, setText] = useState("");
    const [msgIndex, setMsgIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        if (charIndex < messages[msgIndex].length) {
            const timeout = setTimeout(() => {
                setText((prev) => prev + messages[msgIndex].charAt(charIndex));
                setCharIndex(charIndex + 1);
            }, 30 + Math.random() * 40);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setText("");
                setCharIndex(0);
                setMsgIndex((prev) => (prev + 1) % messages.length);
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [charIndex, msgIndex]);

    return (
        <div className="w-full bg-background border border-surfaceHover text-primary font-mono text-[11px] lg:text-xs p-4 rounded-xl h-48 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surfaceHover/50">
                <span className="text-secondary tracking-widest uppercase">System Log</span>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-green/10 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
                    <span className="text-green text-[10px] uppercase font-bold tracking-widest">Active</span>
                </div>
            </div>
            <div className="flex-1 flex items-start flex-col space-y-2 text-secondary">
                <div className="flex items-center text-secondary/30">
                    <span className="text-accent/50 mr-2">{'>'}</span> Root Initialization Complete.
                </div>
                <div className="flex items-start">
                    <span className="text-accent mr-2">{'>'}</span>
                    <span className="text-primary">{text}</span>
                    <span className="w-2 h-4 bg-accent ml-1 animate-pulse"></span>
                </div>
            </div>
        </div>
    );
};

const SchedulerProtocol = () => {
    const containerRef = useRef(null);
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const [activeDay, setActiveDay] = useState(3);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

            tl.set('.cursor-svg', { x: 0, y: 0, scale: 1, opacity: 0 })
                .to('.cursor-svg', { opacity: 1, duration: 0.3 })
                .to('.cursor-svg', { x: 130, y: 35, duration: 1, ease: 'power2.inOut' })
                .to('.cursor-svg', { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => setActiveDay(4) })
                .to('.cursor-svg', { x: 200, y: 125, duration: 1, ease: 'power2.inOut', delay: 0.4 })
                .to('.cursor-svg', { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
                .to('.cursor-svg', { opacity: 0, duration: 0.3, delay: 0.3 })
                .call(() => setActiveDay(3));
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-48 relative flex flex-col items-center justify-center p-4 bg-background border border-surfaceHover rounded-xl">
            <div className="grid grid-cols-7 gap-1.5 w-full mb-6 relative z-0">
                {days.map((d, i) => (
                    <div
                        key={i}
                        className={`flex items-center justify-center aspect-square rounded-sm text-[10px] font-bold transition-all duration-300 ${activeDay === i ? 'bg-accent text-black scale-105 shadow-[0_0_10px_rgba(252,213,53,0.3)]' : 'bg-surfaceHover text-secondary hover:bg-surfaceHover/80'}`}
                    >
                        {d}
                    </div>
                ))}
            </div>

            <div className="px-4 py-2 bg-surfaceHover border border-surfaceHover text-primary text-xs rounded-lg font-mono tracking-wide relative z-0 flex items-center justify-center gap-2 hover:bg-surfaceHover/80 transition-colors w-1/2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                Commit Schedule
            </div>

            {/* Animated Cursor */}
            <div className="cursor-svg absolute top-0 left-0 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] z-10 pointer-events-none" style={{ opacity: 0 }}>
                <MousePointer2 size={24} fill="white" stroke="black" strokeWidth={1} />
            </div>
        </div>
    );
};

// Main Features Component
const Features = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.feature-card', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 75%',
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="ecosystem" ref={sectionRef} className="py-24 px-6 md:px-16 bg-surface relative z-10 border-t border-surfaceHover rounded-t-3xl md:rounded-t-[3rem] -mt-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-surfaceHover">
                    <div>
                        <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-primary tracking-tighter mb-2">
                            Core Modules
                        </h2>
                        <p className="font-mono text-sm tracking-widest text-secondary uppercase pt-2 font-medium">
                            Interactive Functional Arrays
                        </p>
                    </div>
                    <button className="text-accent font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                        View Documentation
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Minimalism */}
                    <div className="feature-card bg-surfaceHover/30 border border-surfaceHover rounded-2xl p-6 md:p-8 transition-colors duration-300 hover:bg-surfaceHover/50 flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-surfaceHover/50">
                                <LayoutDashboard className="text-accent" size={20} />
                            </div>
                            <span className="font-mono text-xs text-secondary px-2 py-1 bg-surface rounded-sm border border-surfaceHover">v1.2.0</span>
                        </div>
                        <h3 className="font-heading font-bold text-xl text-primary mb-3">Onboarding Mechanics</h3>
                        <p className="text-secondary text-sm leading-relaxed font-medium mb-8">
                            Zero friction architecture. A refined interface that transforms analog academic performance into digital utility efficiently.
                        </p>
                        <div className="mt-auto bg-surface/50 rounded-xl overflow-hidden p-2 border border-surfaceHover relative">
                            <DiagnosticShuffler />
                        </div>
                    </div>

                    {/* Card 2: Design */}
                    <div className="feature-card bg-surfaceHover/30 border border-surfaceHover rounded-2xl p-6 md:p-8 transition-colors duration-300 hover:bg-surfaceHover/50 flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-surfaceHover/50">
                                <Activity className="text-red" size={20} />
                            </div>
                            <span className="font-mono text-xs text-secondary px-2 py-1 bg-surface rounded-sm border border-surfaceHover mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red"></span>Live
                            </span>
                        </div>
                        <h3 className="font-heading font-bold text-xl text-primary mb-3">Live Telemetry</h3>
                        <p className="text-secondary text-sm leading-relaxed font-medium mb-8">
                            Aggressive feedback loops. Every state change is engineered for pixel-perfect academic execution and data transparency.
                        </p>
                        <div className="mt-auto overflow-hidden rounded-xl">
                            <TelemetryTypewriter />
                        </div>
                    </div>

                    {/* Card 3: Client-orientation */}
                    <div className="feature-card bg-surfaceHover/30 border border-surfaceHover rounded-2xl p-6 md:p-8 transition-colors duration-300 hover:bg-surfaceHover/50 flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-surfaceHover/50">
                                <UserCheck className="text-green" size={20} />
                            </div>
                        </div>
                        <h3 className="font-heading font-bold text-xl text-primary mb-3">Client Protocol</h3>
                        <p className="text-secondary text-sm leading-relaxed font-medium mb-8">
                            Decentralized student interactions. Your academic schedule and earning trajectory, executed autonomously via smart contracts.
                        </p>
                        <div className="mt-auto rounded-xl overflow-hidden relative">
                            <SchedulerProtocol />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
