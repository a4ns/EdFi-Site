import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, EyeOff, ShieldAlert } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Problem = () => {
    const sectionRef = useRef(null);
    const textRef = useRef(null);
    const cardsRef = useRef([]);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.problem-title', {
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
                    start: 'top 80%',
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power2.out',
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    const problems = [
        {
            icon: <Clock size={32} className="text-red mb-6" />,
            title: "Motivation Crisis",
            desc: "Students lose interest in their studies because the ultimate reward—a diploma—is delayed for years. Action and reward are fundamentally disconnected."
        },
        {
            icon: <EyeOff size={32} className="text-accent mb-6" />,
            title: "Opaque Grants",
            desc: "Corporate sponsors and alumni lack transparency. It is incredibly difficult to track whether scholarship funds actually reach the most deserving talent."
        },
        {
            icon: <ShieldAlert size={32} className="text-secondary mb-6" />,
            title: "Fake Credentials",
            desc: "Employers waste significant capital and time background-checking candidates and verifying the authenticity of paper diplomas and certificates."
        }
    ];

    return (
        <section ref={sectionRef} id="problem" className="relative w-full py-24 md:py-32 overflow-hidden bg-background text-primary border-t border-surfaceHover z-20">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-red/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 flex flex-col">
                <div ref={textRef} className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
                    <div className="problem-title inline-flex items-center gap-2 bg-surfaceHover/50 border border-surfaceHover px-4 py-1.5 rounded-full mb-6">
                        <span className="w-2 h-2 rounded-full bg-red animate-pulse"></span>
                        <span className="font-mono text-xs md:text-sm font-semibold tracking-widest text-secondary uppercase">The Current Reality</span>
                    </div>
                    <h2 className="problem-title font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tighter text-primary mb-6">
                        Why the current education system is <span className="text-transparent bg-clip-text bg-gradient-to-r from-red to-orange-500">broken.</span>
                    </h2>
                    <p className="problem-title font-sans text-base md:text-xl text-secondary leading-relaxed">
                        Legacy academic infrastructure is failing to align the incentives of students, universities, and the future job market.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {problems.map((prob, idx) => (
                        <div
                            key={idx}
                            ref={el => cardsRef.current[idx] = el}
                            className="bg-surface border border-surfaceHover rounded-[2rem] p-8 md:p-10 flex flex-col hover:border-surfaceHover/80 hover:bg-surfaceHover/30 transition-colors duration-300 group"
                        >
                            <div className="transform group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 ease-out">
                                {prob.icon}
                            </div>
                            <h3 className="font-heading font-bold text-2xl mb-4 text-primary">{prob.title}</h3>
                            <p className="font-sans text-secondary text-sm md:text-base leading-relaxed">{prob.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Problem;
