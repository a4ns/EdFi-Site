import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { User, Building2, GraduationCap, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks = () => {
    const sectionRef = useRef(null);
    const contentRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        {
            id: 'student',
            icon: <User size={20} />,
            label: 'For Students',
            color: 'accent',
            steps: [
                { title: 'Study', desc: 'Attend lectures and excel in exams.' },
                { title: 'Verify', desc: 'University Oracle confirms your grades.' },
                { title: 'Earn & Mint', desc: 'Receive EDC tokens and SBT credentials.' }
            ]
        },
        {
            id: 'sponsor',
            icon: <Building2 size={20} />,
            label: 'For Sponsors',
            color: 'green',
            steps: [
                { title: 'Invest', desc: 'Create scholarship liquidity pools.' },
                { title: 'Configure', desc: 'Set GPA and major requirements in smart contracts.' },
                { title: 'Hire', desc: 'Recruit graduates with 100% verified on-chain CVs.' }
            ]
        },
        {
            id: 'university',
            icon: <GraduationCap size={20} />,
            label: 'For Universities',
            color: 'blue-500',
            steps: [
                { title: 'Integrate Web3', desc: 'Connect internal LMS to EdFi Oracle.' },
                { title: 'Engage', desc: 'Boost student attendance and academic drive.' },
                { title: 'Attract', desc: 'Draw more transparent funding and grants.' }
            ]
        }
    ];

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hw-title', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                },
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out',
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    // Animate tab content change
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.tab-card',
                { opacity: 0, y: 20, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.5)', stagger: 0.1 }
            );
        }, contentRef);
        return () => ctx.revert();
    }, [activeTab]);

    return (
        <section id="how-it-works" ref={sectionRef} className="py-24 md:py-32 px-6 md:px-16 bg-background relative z-10 border-t border-surfaceHover">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="hw-title font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-primary tracking-tighter mb-6 relative inline-block">
                        How it Works
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></span>
                    </h2>
                    <p className="hw-title font-sans text-base md:text-xl text-secondary mt-8 max-w-2xl mx-auto leading-relaxed">
                        A triple-win ecosystem aligning incentives across the entire educational pipeline.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-wrap justify-center gap-4 mb-12 hw-title">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(idx)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === idx
                                    ? `bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]`
                                    : `bg-surface border border-surfaceHover text-secondary hover:text-primary hover:border-surfaceHover/80`
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div ref={contentRef} className="bg-surface border border-surfaceHover rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {tabs[activeTab].steps.map((step, idx) => (
                            <div key={idx} className="tab-card flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-2xl bg-background border border-surfaceHover flex items-center justify-center mb-6 text-2xl font-black font-mono text-surfaceHover group-hover:border-accent/50 group-hover:text-accent transition-colors duration-300 shadow-inner relative">
                                    <span className="relative z-10">0{idx + 1}</span>
                                    {idx < 2 && (
                                        <div className="hidden md:flex absolute top-1/2 left-[calc(100%+16px)] -translate-y-1/2 w-8 items-center text-surfaceHover/50">
                                            <ArrowRight size={24} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-heading font-bold text-xl text-primary mb-3">{step.title}</h3>
                                <p className="font-sans text-secondary text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HowItWorks;
