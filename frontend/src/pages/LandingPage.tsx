import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageOutlined,
    ThunderboltOutlined,
    SafetyOutlined,
    TeamOutlined,
    FileImageOutlined,
    SearchOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import { Home, Sparkles, CreditCard } from 'lucide-react';
import AuroraHero from '@/components/ui/digital-aurora';

import { GlowingEffect } from '@/components/ui/glowing-effect';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { FloatingNav } from '@/components/ui/floating-navbar';
import { cn } from '@/lib/utils';


// ─── Glowing Grid Item ──────────────────────────────────────────────────────
interface GridItemProps {
    area: string;
    icon: React.ReactNode;
    title: string;
    description: React.ReactNode;
}

const GridItem: React.FC<GridItemProps> = ({ area, icon, title, description }) => {
    return (
        <li className={cn("min-h-[14rem] list-none", area)}>
            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-white/10 bg-neutral-900 p-6 shadow-sm md:p-6">
                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-neutral-800 p-2">
                            {icon}
                        </div>
                        <div className="space-y-3">
                            <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-white">
                                {title}
                            </h3>
                            <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-neutral-400">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const go = () => navigate('/login');

    const navItems = [
        {
            name: "Home",
            link: "/",
            icon: <Home className="h-4 w-4 text-neutral-400" />,
        },
        {
            name: "Features",
            link: "#features",
            icon: <Sparkles className="h-4 w-4 text-neutral-400" />,
        },
        {
            name: "Pricing",
            link: "#pricing",
            icon: <CreditCard className="h-4 w-4 text-neutral-400" />,
        },
    ];

    return (
        <div className="dark bg-neutral-950 text-white min-h-screen">

            {/* ── Floating Navbar — appears on scroll ── */}
            <FloatingNav navItems={navItems} onLoginClick={go} />

            {/* ── Aurora Shader Hero — full-screen WebGL background ── */}
            <AuroraHero
                title="Connect, Collaborate & Communicate Instantly"
                description="Real-time messaging with enterprise-grade security, file sharing, and smart search — all in one beautiful interface powered by WebSocket technology."
                badgeText="Real-Time Chat"
                badgeLabel="ChatConnect"
                ctaButtons={[
                    { text: "Start for Free", href: "#", primary: true },
                    { text: "See Features", href: "#features" }
                ]}
                microDetails={["Sub-100ms delivery", "End-to-end security", "10,000+ teams worldwide"]}
            />

            {/* ── Features with Glowing Cards ── */}
            <section id="features" className="py-24 bg-neutral-950">
                <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
                    <span className="inline-block bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                        Features
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Everything you need to communicate better
                    </h2>
                    <p className="text-neutral-400 text-lg max-w-xl mx-auto mb-14">
                        From instant messaging to file sharing — designed for teams who move fast.
                    </p>
                    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
                        <GridItem
                            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
                            icon={<ThunderboltOutlined style={{ fontSize: '18px', color: '#818cf8' }} />}
                            title="Real-Time Messaging"
                            description="Sub-100ms delivery with WebSocket technology. Messages appear the instant they're sent."
                        />
                        <GridItem
                            area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
                            icon={<SafetyOutlined style={{ fontSize: '18px', color: '#a78bfa' }} />}
                            title="Secure & Private"
                            description="Google OAuth 2.0 authentication and JWT-secured sessions keep your data protected."
                        />
                        <GridItem
                            area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
                            icon={<FileImageOutlined style={{ fontSize: '18px', color: '#34d399' }} />}
                            title="File Sharing"
                            description="Upload images, videos, and documents. Drag-and-drop or paste from clipboard with media gallery support."
                        />
                        <GridItem
                            area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
                            icon={<TeamOutlined style={{ fontSize: '18px', color: '#60a5fa' }} />}
                            title="Group Conversations"
                            description="Create group chats with multiple participants. See who's online in real-time."
                        />
                        <GridItem
                            area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
                            icon={<SearchOutlined style={{ fontSize: '18px', color: '#f472b6' }} />}
                            title="Smart Search"
                            description="Full-text search across all your messages. Find anything instantly with advanced filters."
                        />
                    </ul>
                </div>
            </section>



            {/* ── Pricing ── */}
            <section id="pricing" className="py-24 bg-neutral-950">
                <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
                    <span className="inline-block bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                        Pricing
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-neutral-400 text-lg max-w-xl mx-auto mb-14">
                        Start free and upgrade as your team grows. No hidden fees.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {/* Free */}
                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-8 flex flex-col">
                            <p className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-2">Free</p>
                            <div className="mb-4">
                                <span className="text-5xl font-bold text-white">$0</span>
                                <span className="text-neutral-400 ml-1">/ forever</span>
                            </div>
                            <p className="text-neutral-400 text-sm mb-6">Perfect for personal use and small teams getting started.</p>
                            <ul className="space-y-3 mb-8 flex-1">
                                {['Up to 5 conversations', '100 MB file storage', 'Real-time messaging', 'Google Sign-in', 'Message history (30 days)'].map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                                        <CheckOutlined style={{ color: '#818cf8', fontSize: 14 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={go} className="w-full py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors">
                                Get Started
                            </button>
                        </div>
                        {/* Pro */}
                        <div className="rounded-2xl border-2 border-indigo-500 bg-neutral-900 p-8 flex flex-col relative">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                                Most Popular
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-2">Pro</p>
                            <div className="mb-4">
                                <span className="text-5xl font-bold text-white">$9</span>
                                <span className="text-neutral-400 ml-1">/ month</span>
                            </div>
                            <p className="text-neutral-400 text-sm mb-6">Ideal for growing teams who need more power and storage.</p>
                            <ul className="space-y-3 mb-8 flex-1">
                                {['Unlimited conversations', '10 GB file storage', 'File & media gallery', 'Message search', 'Unlimited history', 'Priority support'].map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                                        <CheckOutlined style={{ color: '#818cf8', fontSize: 14 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={go} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity">
                                Get Started
                            </button>
                        </div>
                        {/* Enterprise */}
                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-8 flex flex-col">
                            <p className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-2">Enterprise</p>
                            <div className="mb-4">
                                <span className="text-5xl font-bold text-white">$29</span>
                                <span className="text-neutral-400 ml-1">/ month</span>
                            </div>
                            <p className="text-neutral-400 text-sm mb-6">Advanced features for large organizations with custom needs.</p>
                            <ul className="space-y-3 mb-8 flex-1">
                                {['Everything in Pro', '100 GB file storage', 'Custom integrations', 'Admin dashboard', 'SSO & advanced auth', 'Dedicated support'].map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                                        <CheckOutlined style={{ color: '#818cf8', fontSize: 14 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={go} className="w-full py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA — Background Paths ── */}
            <BackgroundPaths
                title="Ready to connect?"
                buttonText="Get Started Free"
                onButtonClick={go}
            />

            {/* ── Footer ── */}
            <footer className="border-t border-white/10 bg-neutral-950 py-8">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center gap-4 md:flex-row md:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs">
                            <MessageOutlined />
                        </div>
                        <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ChatConnect</span>
                    </div>
                    <p className="text-neutral-500 text-sm">© 2026 ChatConnect.</p>
                    <div className="flex gap-6 text-sm text-neutral-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <span onClick={go} className="cursor-pointer hover:text-white transition-colors">Sign In</span>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
