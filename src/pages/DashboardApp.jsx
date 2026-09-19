import React from 'react';
import { ArrowLeft, Wallet, QrCode, ArrowUpRight, ArrowDownRight, Award, GraduationCap, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardApp = () => {
    return (
        <div className="min-h-screen bg-background text-primary font-sans p-4 md:p-8 flex items-center justify-center">
            {/* Back Button */}
            <Link to="/" className="fixed top-8 left-8 text-secondary hover:text-accent transition-colors flex items-center gap-2 text-sm font-medium z-50">
                <ArrowLeft size={16} />
                Exit Demo
            </Link>

            <div className="w-full max-w-md bg-surface border border-surfaceHover rounded-[2rem] overflow-hidden shadow-2xl relative">
                {/* App Header */}
                <div className="bg-surface/50 border-b border-surfaceHover p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surfaceHover flex items-center justify-center border border-surfaceHover/50 relative">
                            <span className="font-heading font-bold text-accent">AK</span>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green rounded-full border-2 border-surface"></div>
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-primary">Ansar Kazbekov</h1>
                            <p className="font-mono text-[10px] text-secondary tracking-wider uppercase">ID: 210404</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surfaceHover flex items-center justify-center text-primary">
                        <Wallet size={16} />
                    </div>
                </div>

                {/* Balance Card */}
                <div className="p-6 pb-2">
                    <div className="bg-gradient-to-br from-surfaceHover via-surfaceHover/50 to-surface border border-surfaceHover rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors"></div>

                        <p className="font-sans text-sm text-secondary mb-1">Available Capital</p>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-heading font-extrabold text-4xl text-primary tracking-tighter">450.00</span>
                            <span className="font-heading font-bold text-accent">EDC</span>
                        </div>
                        <p className="font-mono text-xs text-secondary opacity-80">≈ 6,250 KZT</p>

                        <div className="flex gap-3 mt-6">
                            <button className="flex-1 bg-accent hover:bg-[#F0B90B] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <QrCode size={18} />
                                Scan Pay
                            </button>
                            <button className="flex-1 bg-surface border border-surfaceHover hover:border-accent/50 text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <ArrowUpRight size={18} className="text-secondary" />
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 p-6 pt-4">
                    <div className="bg-surface hover:bg-surfaceHover/50 border border-surfaceHover rounded-2xl p-4 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-secondary">
                            <Award size={14} className="text-accent" />
                            <span className="text-xs font-medium">Earn Rate</span>
                        </div>
                        <div className="font-heading font-bold text-lg">+1.4x</div>
                    </div>
                    <div className="bg-surface hover:bg-surfaceHover/50 border border-surfaceHover rounded-2xl p-4 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-secondary">
                            <GraduationCap size={14} className="text-green" />
                            <span className="text-xs font-medium">Attendance</span>
                        </div>
                        <div className="font-heading font-bold text-lg">98%</div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="p-6 pt-2 pb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-bold flex items-center gap-2 text-primary">
                            <History size={16} className="text-secondary" />
                            Recent Activity
                        </h3>
                        <button className="text-xs font-medium text-accent hover:underline">View All</button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surfaceHover border border-transparent hover:border-surfaceHover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center text-green">
                                    <ArrowDownRight size={18} />
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-sm text-primary">Macroeconomics Exam</p>
                                    <p className="font-mono text-[10px] text-secondary">Academic Reward • Grade: A</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-green text-sm">+50.00 EDC</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surfaceHover border border-transparent hover:border-surfaceHover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-surfaceHover flex items-center justify-center text-secondary">
                                    <ArrowUpRight size={18} />
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-sm text-primary">Campus Canteen</p>
                                    <p className="font-mono text-[10px] text-secondary">Scan Payment • Tx #9A24</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-primary text-sm">-15.00 EDC</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surfaceHover border border-transparent hover:border-surfaceHover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center text-green">
                                    <ArrowDownRight size={18} />
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-sm text-primary">Attendance Bonus</p>
                                    <p className="font-mono text-[10px] text-secondary">Weekly Milestone • 100%</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-green text-sm">+25.00 EDC</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardApp;
