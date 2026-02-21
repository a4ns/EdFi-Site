import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';

const Footer = () => {
    return (
        <footer id="contact" className="w-full bg-[#05050A] text-primary pt-24 pb-12 px-6 md:px-16 border-t border-surfaceHover relative z-0 flex flex-col items-center justify-between">
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

                {/* Brand & Subscribe Form */}
                <div className="md:col-span-6 flex flex-col items-start space-y-6">
                    <div className="font-heading font-extrabold text-3xl tracking-tighter text-primary flex items-center gap-2">
                        <div className="w-6 h-6 bg-accent rounded-sm flex items-center justify-center transform rotate-45 border border-accent/50 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                            <div className="w-3 h-3 bg-background transform rotate-0 rounded-sm"></div>
                        </div>
                        EdFi
                    </div>
                    <p className="font-sans font-medium text-base text-secondary max-w-sm leading-relaxed">
                        The decentralized academic ecosystem. Rewarding knowledge and empowering the next generation of students.
                    </p>

                    <div className="w-full max-w-md mt-4">
                        <label className="block text-xs font-bold font-mono tracking-widest text-secondary uppercase mb-3">
                            Subscribe for project updates
                        </label>
                        <div className="flex items-center bg-surface border border-surfaceHover rounded-xl p-1 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-transparent border-none outline-none text-sm text-primary px-4 placeholder:text-surfaceHover focus:ring-0"
                            />
                            <button className="bg-accent hover:bg-accent/80 transition-colors text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold">
                                Join
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="md:col-span-3 pt-2">
                    <h4 className="font-sans font-bold text-xs tracking-widest uppercase text-primary mb-6">Ecosystem</h4>
                    <ul className="space-y-4">
                        {['L2E Protocol', 'Smart Scholarships', 'Soulbound Degrees', 'Whitepaper'].map((item) => (
                            <li key={item}>
                                <a href="#" className="font-sans text-secondary font-medium hover:text-accent transition-colors duration-300 text-sm">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact */}
                <div className="md:col-span-3 pt-2 flex flex-col md:items-end text-left md:text-right">
                    <h4 className="font-sans font-bold text-xs tracking-widest uppercase text-primary mb-6">Contact</h4>
                    <ul className="space-y-4">
                        <li>
                            <a href="mailto:4kansar@gmail.com" className="font-sans text-secondary hover:text-accent text-sm flex items-center md:justify-end gap-2 transition-colors">
                                <Mail size={16} />
                                4kansar@gmail.com
                            </a>
                        </li>
                        <li className="font-sans text-secondary text-sm">Petropavlovsk, Kazakhstan</li>
                        <li className="font-sans text-secondary text-sm">EU Network / Lithuania</li>
                    </ul>
                </div>
            </div>

            <div className="w-full max-w-7xl border-t border-surfaceHover pt-8 flex flex-col md:flex-row items-center justify-between">
                <span className="font-sans font-medium text-xs text-secondary mb-4 md:mb-0">
                    © 2026 EdFi. All rights reserved.
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface border border-surfaceHover">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green"></span>
                    </span>
                    <span className="font-mono text-[10px] text-primary tracking-widest uppercase font-bold">
                        Binance Smart Chain Operational
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
