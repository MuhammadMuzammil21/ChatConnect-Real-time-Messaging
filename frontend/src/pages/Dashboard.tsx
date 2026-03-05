import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import RoleBadge from '../components/RoleBadge';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Settings,
    LogOut,
    CheckCircle,
    Clock,
    Shield,
    Zap,
    Star,
} from 'lucide-react';

function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isPremium, isAdmin } = useRole();

    const handleLogout = async () => {
        await logout();
    };

    if (!user) return null;

    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
    };
    const item = {
        hidden: { y: 16, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
            {/* ── Header ── */}
            <header className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-neutral-200 tracking-wide">ChatConnect</span>
                </div>
                <nav className="flex items-center gap-1">
                    {[
                        { label: 'Chat', icon: MessageSquare, to: '/chat' },
                        { label: 'Profile', icon: Settings, to: '/profile' },
                    ].map((n) => (
                        <button
                            key={n.label}
                            onClick={() => navigate(n.to)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <n.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{n.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors ml-2"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </nav>
            </header>

            {/* ── Content ── */}
            <motion.main
                variants={container}
                initial="hidden"
                animate="visible"
                className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-8"
            >
                {/* Welcome */}
                <motion.section variants={item} className="flex items-center gap-5">
                    <img
                        src={user.avatarUrl || ''}
                        alt={user.displayName}
                        className="h-16 w-16 rounded-full border-2 border-white/10 object-cover bg-neutral-800"
                    />
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">
                            Welcome back, {user.displayName}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-0.5">{user.email}</p>
                        <div className="mt-2">
                            <RoleBadge role={user.role} />
                        </div>
                    </div>
                </motion.section>

                {/* Stats row */}
                <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Status', value: 'Active', icon: CheckCircle, color: '#10b981' },
                        {
                            label: 'Member Since',
                            value: user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                : '—',
                            icon: Clock,
                            color: '#818cf8',
                        },
                        { label: 'Role', value: user.role, icon: Shield, color: '#a78bfa' },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="rounded-xl border border-white/[0.06] p-5 flex items-start gap-4"
                            style={{ background: '#111' }}
                        >
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: `${s.color}15` }}
                            >
                                <s.icon className="h-4 w-4" style={{ color: s.color }} />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">{s.label}</p>
                                <p className="text-lg font-semibold text-neutral-200 mt-0.5">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/chat')}
                        className="group flex items-center justify-center gap-3 rounded-xl border border-white/[0.06] py-4 text-sm font-medium text-white transition-all hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                    >
                        <MessageSquare className="h-4 w-4" />
                        Start Chatting
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="group flex items-center justify-center gap-3 rounded-xl border border-white/[0.08] py-4 text-sm font-medium text-neutral-300 transition-all hover:text-white hover:border-white/[0.15] hover:bg-white/[0.03]"
                        style={{ background: '#111' }}
                    >
                        <Settings className="h-4 w-4" />
                        Edit Profile
                    </button>
                </motion.div>

                {/* Features */}
                <motion.section variants={item}>
                    <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">Your Features</h2>
                    <div className="space-y-4">
                        <div className="rounded-xl border border-white/[0.06] p-5" style={{ background: '#111' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-400">Included</span>
                            </div>
                            <ul className="space-y-2">
                                {['Real-time messaging', 'Create conversations', 'Message editing & deletion', 'Online status indicators', 'Typing indicators'].map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500/60" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {(isPremium || isAdmin) && (
                            <div className="rounded-xl border border-indigo-500/20 p-5" style={{ background: 'rgba(99,102,241,0.04)' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="h-4 w-4 text-indigo-400" />
                                    <span className="text-sm font-medium text-indigo-400">
                                        {isAdmin ? 'Admin' : 'Premium'}
                                    </span>
                                </div>
                                <ul className="space-y-2">
                                    {(isAdmin
                                        ? ['User management', 'System analytics', 'Role assignment', 'Full system access']
                                        : ['Advanced chat features', 'File sharing (100MB)', 'Custom themes', 'Priority support']
                                    ).map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                                            <CheckCircle className="h-3.5 w-3.5 text-indigo-500/60" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </motion.section>
            </motion.main>
        </div>
    );
}

export default Dashboard;
