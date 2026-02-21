import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Linkedin, Github, Twitter, MapPin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Founder = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.founder-anim', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power2.out',
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="founder" ref={sectionRef} className="py-24 md:py-32 px-6 md:px-16 bg-background relative z-10 border-t border-surfaceHover">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16 bg-surface border border-surfaceHover rounded-[3rem] p-8 md:p-16 relative overflow-hidden group hover:border-accent/30 transition-colors duration-500">

                {/* Background Glow */}
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

                {/* Photo Side */}
                <div className="founder-anim w-full md:w-1/3 flex justify-center md:justify-end relative z-10">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-background shadow-[0_20px_40px_rgba(0,0,0,0.5)] ring-2 ring-surfaceHover relative group">
                        <img
                            src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1000"
                            alt="Ansar Kazbekov"
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105"
                        />
                    </div>
                </div>

                {/* Bio Side */}
                <div className="founder-anim w-full md:w-2/3 flex flex-col items-center md:items-start text-center md:text-left relative z-10">
                    <div className="inline-flex items-center gap-2 bg-background border border-surfaceHover px-4 py-1.5 rounded-full mb-4">
                        <span className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">Founder & Lead Developer</span>
                    </div>

                    <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-primary tracking-tighter mb-4">
                        Ansar Kazbekov
                    </h2>

                    <div className="flex items-center gap-2 text-secondary mb-6 font-mono text-sm">
                        <MapPin size={16} className="text-accent" />
                        <span>Lithuania / EU (Erasmus+ Program)</span>
                    </div>

                    <p className="font-sans text-secondary text-base md:text-lg max-w-lg leading-relaxed mb-8">
                        "I am a Web3 enthusiast, full-stack developer, and the recent winner of the Binance Crypto Ideathon. My mission is to make high-quality education financially accessible and transparent through the power of blockchain and decentralized mechanics."
                    </p>

                    <div className="flex items-center gap-4">
                        <a href="#" className="w-12 h-12 rounded-full bg-background border border-surfaceHover flex items-center justify-center text-secondary hover:text-accent hover:border-accent transition-colors duration-300">
                            <Linkedin size={20} />
                        </a>
                        <a href="#" className="w-12 h-12 rounded-full bg-background border border-surfaceHover flex items-center justify-center text-secondary hover:text-accent hover:border-accent transition-colors duration-300">
                            <Github size={20} />
                        </a>
                        <a href="#" className="w-12 h-12 rounded-full bg-background border border-surfaceHover flex items-center justify-center text-secondary hover:text-accent hover:border-accent transition-colors duration-300">
                            <Twitter size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Founder;
