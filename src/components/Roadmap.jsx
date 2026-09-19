import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Roadmap = () => {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.roadmap-item', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 80%',
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power2.out'
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const timeline = [
        {
            date: 'Nov 2025',
            title: 'Smart Contract MVP',
            desc: 'Initial Kozybayev University (6000 students) sandbox deployment on BNB Testnet to validate the Learn-to-Earn hypothesis.'
        },
        {
            date: 'Q2 2026',
            title: 'Full Campus Economy',
            desc: 'Mainnet migration. Spending integration with campus canteens, dormitories, and local merchandise stores.'
        },
        {
            date: '2027',
            title: 'National eGov Integration',
            desc: 'Creation of a national standard. Direct integration with state educational databases scaling mechanics across Kazakhstan.'
        }
    ];

    return (
        <section ref={containerRef} className="py-24 px-6 md:px-16 bg-surface border-t border-surfaceHover relative z-20 overflow-hidden">
            <div className="max-w-4xl mx-auto">
                <div className="mb-16">
                    <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-primary tracking-tighter mb-4">
                        Deployment Roadmap
                    </h2>
                    <p className="font-sans text-secondary text-sm md:text-base max-w-xl leading-relaxed">
                        From an isolated academic sandbox in Petropavlovsk to a nationwide decentralized educational standard.
                    </p>
                </div>

                <div className="relative border-l-2 border-surfaceHover ml-4 md:ml-6 space-y-12 pb-8">
                    {timeline.map((item, index) => (
                        <div key={index} className="roadmap-item relative pl-8 md:pl-12">
                            <div className="absolute top-0 left-0 -translate-x-[5px] md:-translate-x-[6px] w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-full bg-accent border-[3px] border-surface"></div>

                            <div className="flex flex-col">
                                <span className="font-mono text-xs font-bold text-accent tracking-widest uppercase mb-2">{item.date}</span>
                                <h3 className="font-heading font-bold text-xl text-primary mb-2">{item.title}</h3>
                                <p className="font-sans text-secondary text-sm leading-relaxed max-w-lg">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Roadmap;
