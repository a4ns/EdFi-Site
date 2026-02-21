import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-background text-primary pt-24 pb-12 px-6 md:px-16 border-t border-surfaceHover relative z-0 flex flex-col items-center justify-between">
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">

                {/* Brand & Tagline */}
                <div className="md:col-span-5 flex flex-col items-start space-y-6">
                    <div className="font-heading font-extrabold text-3xl tracking-tighter text-primary flex items-center gap-2">
                        <div className="w-6 h-6 bg-accent rounded-sm flex items-center justify-center transform rotate-45">
                            <div className="w-3 h-3 bg-background transform rotate-0 rounded-sm"></div>
                        </div>
                        EdFi
                    </div>
                    <p className="font-sans font-medium text-sm text-secondary max-w-xs leading-relaxed">
                        The first Learn-to-Earn university ecosystem powering academic motivation through Web3 architecture.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface border border-surfaceHover mt-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green"></span>
                        </span>
                        <span className="font-mono text-[10px] text-primary tracking-widest uppercase font-bold">
                            Binance Smart Chain Operational
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="md:col-span-3">
                    <h4 className="font-sans font-bold text-xs tracking-widest uppercase text-primary mb-6">Platform</h4>
                    <ul className="space-y-4">
                        {['Diagnostic Shuffler', 'Telemetry Log', 'Protocol Scheduler', 'Binance Integration'].map((item) => (
                            <li key={item}>
                                <a href="#" className="font-sans text-secondary font-medium hover:text-accent transition-colors duration-300 text-sm">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Legal */}
                <div className="md:col-span-4 flex flex-col md:items-end">
                    <h4 className="font-sans font-bold text-xs tracking-widest uppercase text-primary mb-6 w-full md:text-right">Project Details</h4>
                    <ul className="space-y-4 w-full md:text-right">
                        <li className="font-sans font-medium text-secondary text-sm">Binance Crypto Ideathon</li>
                        <li className="font-sans font-medium text-secondary text-sm flex md:justify-end items-center gap-2">Participant: <span className="text-primary">Kazbekov Ansar</span></li>
                        <li className="font-sans font-medium text-secondary text-sm flex md:justify-end items-center gap-2">Mentor: <span className="text-primary">Shaikhin D. N.</span></li>
                    </ul>
                </div>
            </div>

            <div className="w-full max-w-7xl border-t border-surfaceHover pt-8 flex flex-col md:flex-row items-center justify-between">
                <span className="font-sans font-medium text-xs text-secondary">
                    © {new Date().getFullYear()} EdFi. Built for the BNB Chain Ecosystem. All rights reserved.
                </span>
                <div className="flex space-x-6 mt-4 md:mt-0 font-sans font-medium text-xs text-secondary">
                    <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-primary transition-colors">Cookie Preferences</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
