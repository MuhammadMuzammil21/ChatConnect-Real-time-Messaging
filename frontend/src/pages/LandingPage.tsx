import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageOutlined,
    ThunderboltOutlined,
    SafetyOutlined,
    TeamOutlined,
    FileImageOutlined,
    SearchOutlined,
    CheckOutlined,
    ArrowRightOutlined,
    StarOutlined,
    GlobalOutlined,
} from '@ant-design/icons';

// ─── Utility: animate on scroll ──────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('revealed');
                    obs.disconnect();
                }
            },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return ref;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    color: string;
    delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color, delay = 0 }) => {
    const ref = useScrollReveal();
    return (
        <div ref={ref} className="lp-reveal" style={{ transitionDelay: `${delay}ms` }}>
            <div className="lp-feature-card">
                <div className="lp-feature-icon" style={{ background: color }}>
                    {icon}
                </div>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="lp-feature-desc">{desc}</p>
            </div>
        </div>
    );
};

interface PricingCardProps {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
    onCta: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
    name, price, period, description, features, highlighted, badge, onCta,
}) => {
    const ref = useScrollReveal();
    return (
        <div ref={ref} className={`lp-reveal lp-pricing-card ${highlighted ? 'highlighted' : ''}`}>
            {badge && <div className="lp-pricing-badge">{badge}</div>}
            <div className="lp-pricing-name">{name}</div>
            <div className="lp-pricing-price">
                <span className="lp-pricing-amount">{price}</span>
                <span className="lp-pricing-period">{period}</span>
            </div>
            <p className="lp-pricing-desc">{description}</p>
            <ul className="lp-pricing-features">
                {features.map((f) => (
                    <li key={f}>
                        <CheckOutlined className="lp-check" />
                        {f}
                    </li>
                ))}
            </ul>
            <button
                className={`lp-btn ${highlighted ? 'lp-btn-primary' : 'lp-btn-outline'}`}
                onClick={onCta}
            >
                Get Started <ArrowRightOutlined />
            </button>
        </div>
    );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const go = () => navigate('/login');

    const heroRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const t = setTimeout(() => heroRef.current?.classList.add('revealed'), 80);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="lp-root">

            {/* ── Navbar ── */}
            <nav className="lp-nav">
                <div className="lp-nav-inner">
                    <div className="lp-brand">
                        <div className="lp-brand-icon">
                            <MessageOutlined />
                        </div>
                        <span className="lp-brand-name">ChatConnect</span>
                    </div>
                    <div className="lp-nav-links">
                        <a href="#features">Features</a>
                        <a href="#pricing">Pricing</a>
                    </div>
                    <button className="lp-btn lp-btn-outline lp-btn-sm" onClick={go}>
                        Sign In
                    </button>
                </div>
            </nav>

            {/* ── Hero — full-bleed wrapper so gradient fills edge-to-edge ── */}
            <div className="lp-hero-wrapper">
                <div className="lp-hero-bg-blob blob1" />
                <div className="lp-hero-bg-blob blob2" />
                <section className="lp-hero">
                    <div ref={heroRef} className="lp-reveal lp-hero-content">
                        <div className="lp-hero-eyebrow">
                            <StarOutlined /> &nbsp; The Modern Messaging Platform
                        </div>
                        <h1 className="lp-hero-heading">
                            Connect, Collaborate &amp;<br />
                            <span className="lp-gradient-text">Communicate</span> Instantly
                        </h1>
                        <p className="lp-hero-sub">
                            Real-time messaging with enterprise-grade security, file sharing, and
                            smart search — all in one beautiful interface.
                        </p>
                        <div className="lp-hero-ctas">
                            <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={go}>
                                Start for Free <ArrowRightOutlined />
                            </button>
                            <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={() => {
                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                See Features
                            </button>
                        </div>
                        <div className="lp-social-proof">
                            <div className="lp-avatars">
                                {['A', 'B', 'C', 'D'].map((l) => (
                                    <div key={l} className="lp-avatar">{l}</div>
                                ))}
                            </div>
                            <span>Trusted by <strong>10,000+</strong> teams worldwide</span>
                        </div>
                    </div>

                    {/* Hero visual — animated floating chat bubbles */}
                    <div className="lp-hero-visual" aria-hidden="true">
                        <div className="lp-chat-demo">
                            <div className="lp-chat-header">
                                <div className="lp-chat-dot green" />
                                <span>General · 4 members</span>
                            </div>
                            <div className="lp-bubble lp-bubble-other">
                                <div className="lp-bubble-avatar">A</div>
                                <div className="lp-bubble-msg">Hey team! Just shipped v2.0 🚀</div>
                            </div>
                            <div className="lp-bubble lp-bubble-me">
                                <div className="lp-bubble-msg">Awesome! Love the new file sharing</div>
                            </div>
                            <div className="lp-bubble lp-bubble-other">
                                <div className="lp-bubble-avatar">B</div>
                                <div className="lp-bubble-msg">Checking in from Tokyo 🗼</div>
                            </div>
                            <div className="lp-bubble lp-bubble-me">
                                <div className="lp-bubble-msg">Real-time sync is so fast ⚡</div>
                            </div>
                            <div className="lp-typing">
                                <span className="lp-typing-dot" />
                                <span className="lp-typing-dot" />
                                <span className="lp-typing-dot" />
                                <span style={{ marginLeft: 6, color: '#94a3b8', fontSize: 12 }}>Aria is typing…</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ── Features ── */}
            <section id="features" className="lp-section lp-features-section">
                <div className="lp-section-inner">
                    <div className="lp-section-label">Features</div>
                    <h2 className="lp-section-heading">Everything you need to communicate better</h2>
                    <p className="lp-section-sub">
                        From instant messaging to file sharing — designed for teams who move fast.
                    </p>
                    <div className="lp-features-grid">
                        <FeatureCard
                            icon={<ThunderboltOutlined />}
                            title="Real-Time Messaging"
                            desc="Sub-100ms delivery with WebSocket technology. Messages appear the instant they're sent."
                            color="linear-gradient(135deg,#6366f1,#8b5cf6)"
                            delay={0}
                        />
                        <FeatureCard
                            icon={<SafetyOutlined />}
                            title="Secure & Private"
                            desc="Google OAuth 2.0 authentication and JWT-secured sessions keep your data protected."
                            color="linear-gradient(135deg,#f59e0b,#ef4444)"
                            delay={80}
                        />
                        <FeatureCard
                            icon={<FileImageOutlined />}
                            title="File Sharing"
                            desc="Upload images, videos, and documents. Drag-and-drop or paste from clipboard."
                            color="linear-gradient(135deg,#10b981,#059669)"
                            delay={160}
                        />
                        <FeatureCard
                            icon={<TeamOutlined />}
                            title="Group Conversations"
                            desc="Create group chats with multiple participants. See who's online in real-time."
                            color="linear-gradient(135deg,#3b82f6,#1d4ed8)"
                            delay={240}
                        />
                        <FeatureCard
                            icon={<SearchOutlined />}
                            title="Smart Search"
                            desc="Full-text search across all your messages. Find anything instantly."
                            color="linear-gradient(135deg,#ec4899,#be185d)"
                            delay={320}
                        />
                        <FeatureCard
                            icon={<GlobalOutlined />}
                            title="Always Online"
                            desc="Presence indicators and away status so you always know who's available."
                            color="linear-gradient(135deg,#8b5cf6,#6366f1)"
                            delay={400}
                        />
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section id="pricing" className="lp-section lp-pricing-section">
                <div className="lp-section-inner">
                    <div className="lp-section-label">Pricing</div>
                    <h2 className="lp-section-heading">Simple, transparent pricing</h2>
                    <p className="lp-section-sub">
                        Start free and upgrade as your team grows. No hidden fees.
                    </p>
                    <div className="lp-pricing-grid">
                        <PricingCard
                            name="Free"
                            price="$0"
                            period="/ forever"
                            description="Perfect for personal use and small teams getting started."
                            features={[
                                'Up to 5 conversations',
                                '100 MB file storage',
                                'Real-time messaging',
                                'Google Sign-in',
                                'Message history (30 days)',
                            ]}
                            onCta={go}
                        />
                        <PricingCard
                            name="Pro"
                            price="$9"
                            period="/ month"
                            description="Ideal for growing teams who need more power and storage."
                            features={[
                                'Unlimited conversations',
                                '10 GB file storage',
                                'File & media gallery',
                                'Message search',
                                'Unlimited history',
                                'Priority support',
                            ]}
                            highlighted
                            badge="Most Popular"
                            onCta={go}
                        />
                        <PricingCard
                            name="Enterprise"
                            price="$29"
                            period="/ month"
                            description="Advanced features for large organizations with custom needs."
                            features={[
                                'Everything in Pro',
                                '100 GB file storage',
                                'Custom integrations',
                                'Admin dashboard',
                                'SSO & advanced auth',
                                'Dedicated support',
                            ]}
                            onCta={go}
                        />
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="lp-cta-section">
                <div className="lp-cta-inner">
                    <h2 className="lp-cta-heading">Ready to connect your team?</h2>
                    <p className="lp-cta-sub">Join thousands of teams already using ChatConnect. Free forever, no credit card required.</p>
                    <button className="lp-btn lp-btn-white lp-btn-lg" onClick={go}>
                        Get Started Free <ArrowRightOutlined />
                    </button>
                </div>
                <div className="lp-cta-blob" />
            </section>

            {/* ── Footer ── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-brand">
                        <div className="lp-brand-icon" style={{ width: 28, height: 28, fontSize: 14 }}>
                            <MessageOutlined />
                        </div>
                        <span className="lp-brand-name" style={{ fontSize: 16 }}>ChatConnect</span>
                    </div>
                    <p className="lp-footer-copy">© 2026 ChatConnect.</p>
                    <div className="lp-footer-links">
                        <a href="#features">Features</a>
                        <a href="#pricing">Pricing</a>
                        <span onClick={go} style={{ cursor: 'pointer' }}>Sign In</span>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
