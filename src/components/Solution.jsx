import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Coins, ShieldCheck, Fingerprint, Award, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Sub-components for each Solution Card
const L2EAnimation = () => {
    const [events, setEvents] = useState([
        { id: 1, action: 'Macroeconomics A+', reward: '+50 EDC' },
        { id: 2, action: '100% Attendance', reward: '+10 EDC' },
        { id: 3, action: 'Hackathon Win', reward: '+200 EDC' }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setEvents((prev) => {
                const newEvents = [...prev];
                const last = newEvents.pop();
                newEvents.unshift(last);
                return newEvents;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-48 flex items-center justify-center pt-8">
            {events.map((ev, index) => {
                const isTop = index === 0;
                const isMiddle = index === 1;

                return (
                    <div
                        key={ev.id}
                        className="absolute w-3/4 bg-surfaceHover/90 border border-accent/20 backdrop-blur-md rounded-xl p-4 flex items-center justify-between shadow-lg transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{
                            transform: `translateY(${isTop ? '0px' : isMiddle ? '12px' : '24px'}) scale(${isTop ? 1 : isMiddle ? 0.95 : 0.9})`,
                            opacity: isTop ? 1 : isMiddle ? 0.7 : 0.3,
                            zIndex: 3 - index
                        }}
                    >
                        <div className="flex flex-col">
                            <span className="font-sans font-medium text-xs text-primary">{ev.action}</span>
                            <span className="font-mono text-[10px] text-secondary mt-1 tracking-widest uppercase">Verified Oracle</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-accent">{ev.reward}</span>
                    </div>
                );
            })}
        </div>
    );
};

const SmartContractAnimation = () => {
    const messages = [
        "Listening for University Oracle...",
        "Validating GPA data: [GPA: 3.9]",
        "Condition met: GPA > 3.5 [OK]",
        "Routing Alumni Liquidity Pool...",
        "Executing Transfer: 500 USDC",
        "Transaction Confirmed."
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
        <div className="w-full bg-background border border-surfaceHover text-primary font-mono text-[11px] p-4 rounded-xl h-48 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surfaceHover/50">
                <span className="text-secondary tracking-widest uppercase text-[10px]">Smart Scholarship Engine</span>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-green/10 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
                    <span className="text-green text-[10px] uppercase font-bold tracking-widest">Active</span>
                </div>
            </div>
            <div className="flex-1 flex items-start flex-col space-y-2 text-secondary">
                <div className="flex items-start text-secondary/50">
                    <span className="text-accent/50 mr-2">{'>'}</span> Scholarship Contract Deployed.
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

const SBTAnimation = () => {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1 });

            tl.fromTo('.sbt-diploma',
                { y: 50, opacity: 0, scale: 0.9, rotationX: 45 },
                { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 1, ease: 'back.out(1.7)' }
            )
                .to('.sbt-stamp', { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, "+=0.2")
                .to('.sbt-glow', { opacity: 0.5, duration: 0.5 })
                .to('.sbt-diploma', { y: -50, opacity: 0, scale: 0.9, duration: 0.8, delay: 1.5, ease: 'power2.in' })
                .set('.sbt-stamp', { opacity: 0, scale: 3 })
                .set('.sbt-glow', { opacity: 0 });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-48 relative flex flex-col items-center justify-center p-4 bg-background border border-surfaceHover rounded-xl perspective-1000">
            {/* Background elements */}
            <div className="sbt-glow absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-150 opacity-0 pointer-events-none"></div>

            <div className="sbt-diploma w-32 h-40 bg-surface border border-accent/30 rounded-lg flex flex-col items-center p-3 shadow-[0_10px_30px_rgba(99,102,241,0.2)] transform-style-3d">
                <div className="w-8 h-8 rounded-full bg-surfaceHover border border-accent/50 flex items-center justify-center mb-3">
                    <Award size={16} className="text-accent" />
                </div>
                <div className="w-full h-1 bg-surfaceHover rounded-full mb-1.5"></div>
                <div className="w-3/4 h-1 bg-surfaceHover rounded-full mb-4"></div>

                <div className="w-full h-1 bg-surfaceHover/50 rounded-full mb-1.5"></div>
                <div className="w-full h-1 bg-surfaceHover/50 rounded-full mb-1.5"></div>
                <div className="w-1/2 h-1 bg-surfaceHover/50 rounded-full"></div>

                <div className="sbt-stamp absolute bottom-3 right-3 text-green opacity-0 transform scale-300">
                    <CheckCircle2 size={24} className="bg-background rounded-full" />
                </div>
            </div>
            <div className="absolute bottom-2 font-mono text-[10px] text-accent font-bold tracking-widest uppercase">Minting Soulbound Token...</div>
        </div>
    );
};

const Solution = () => {
    const sectionRef = useRef(null);
    const cardsRef = useRef([]);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.solution-header', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 75%',
                },
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out',
            });

            gsap.from(cardsRef.current, {
                scrollTrigger: {
                    trigger: cardsRef.current[0],
                    start: 'top 75%',
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power2.out',
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="solution" ref={sectionRef} className="py-24 md:py-32 px-6 md:px-16 bg-surface relative z-10 border-t border-surfaceHover">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-surfaceHover">
                    <div className="max-w-3xl">
                        <div className="solution-header inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full mb-6">
                            <span className="font-mono text-xs md:text-sm font-semibold tracking-widest text-accent uppercase">The Paradigm Shift</span>
                        </div>
                        <h2 className="solution-header font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-primary tracking-tighter mb-6">
                            The EdFi Solution
                        </h2>
                        <p className="solution-header font-sans text-base md:text-xl text-secondary leading-relaxed">
                            A decentralized architecture converting educational effort into transparent, verifiable on-chain assets.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {/* Pillar 1: L2E Protocol */}
                    <div ref={el => cardsRef.current[0] = el} className="bg-background border border-surfaceHover rounded-[2rem] p-6 md:p-8 flex flex-col group hover:border-accent/40 transition-colors duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500"></div>
                        <div className="mb-6 flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center border border-surfaceHover group-hover:border-accent/30 transition-colors duration-500">
                                <Coins className="text-accent" size={24} />
                            </div>
                        </div>
                        <h3 className="font-heading font-bold text-xl md:text-2xl text-primary mb-4 relative z-10">Learn-to-Earn (L2E) Protocol</h3>
                        <p className="text-secondary text-sm md:text-base leading-relaxed mb-8 relative z-10 flex-grow">
                            Students receive micro-rewards (tokens/stablecoins) for excelling in exams, completing courses, or winning olympiads. Studying becomes immediately profitable.
                        </p>
                        <div className="w-full relative z-10">
                            <L2EAnimation />
                        </div>
                    </div>

                    {/* Pillar 2: Smart Scholarships */}
                    <div ref={el => cardsRef.current[1] = el} className="bg-background border border-surfaceHover rounded-[2rem] p-6 md:p-8 flex flex-col group hover:border-accent/40 transition-colors duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500"></div>
                        <div className="mb-6 flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center border border-surfaceHover group-hover:border-accent/30 transition-colors duration-500">
                                <ShieldCheck className="text-accent" size={24} />
                            </div>
                        </div>
                        <h3 className="font-heading font-bold text-xl md:text-2xl text-primary mb-4 relative z-10">Smart Scholarships</h3>
                        <p className="text-secondary text-sm md:text-base leading-relaxed mb-8 relative z-10 flex-grow">
                            Corporate sponsors and alumni create transparent liquidity pools. Smart contracts trigger automatic payouts the moment verified university data hits the blockchain.
                        </p>
                        <div className="w-full relative z-10">
                            <SmartContractAnimation />
                        </div>
                    </div>

                    {/* Pillar 3: Soulbound Degrees */}
                    <div ref={el => cardsRef.current[2] = el} className="bg-background border border-surfaceHover rounded-[2rem] p-6 md:p-8 flex flex-col group hover:border-accent/40 transition-colors duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500"></div>
                        <div className="mb-6 flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center border border-surfaceHover group-hover:border-accent/30 transition-colors duration-500">
                                <Fingerprint className="text-accent" size={24} />
                            </div>
                        </div>
                        <h3 className="font-heading font-bold text-xl md:text-2xl text-primary mb-4 relative z-10">Soulbound Degrees (SBTs)</h3>
                        <p className="text-secondary text-sm md:text-base leading-relaxed mb-8 relative z-10 flex-grow">
                            Academic achievements are permanently minted as Non-Transferable NFTs, forging an indisputable 'On-chain CV' that employers trust implicitly.
                        </p>
                        <div className="w-full relative z-10">
                            <SBTAnimation />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Solution;
