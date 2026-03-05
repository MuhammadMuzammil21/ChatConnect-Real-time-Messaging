import { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileApi, type ProfileData, type UpdateProfileData } from '../api/profile';
import AvatarUpload from '../components/AvatarUpload';
import RoleBadge from '../components/RoleBadge';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Pencil, Save, X, Loader2 } from 'lucide-react';

function Profile() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [formValues, setFormValues] = useState({ displayName: '', statusMessage: '' });
    const [errors, setErrors] = useState<{ displayName?: string; statusMessage?: string }>({});

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getProfile();
            setProfileData(data);
            setFormValues({ displayName: data.displayName, statusMessage: data.statusMessage || '' });
        } catch {
            message.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setIsEditing(false);
        setErrors({});
        if (profileData) {
            setFormValues({ displayName: profileData.displayName, statusMessage: profileData.statusMessage || '' });
        }
    };

    const validate = () => {
        const e: typeof errors = {};
        if (!formValues.displayName || formValues.displayName.length < 2) e.displayName = 'At least 2 characters';
        if (formValues.displayName.length > 50) e.displayName = 'Max 50 characters';
        if (formValues.statusMessage.length > 200) e.statusMessage = 'Max 200 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            const values: UpdateProfileData = { displayName: formValues.displayName, statusMessage: formValues.statusMessage };
            const updatedProfile = await profileApi.updateProfile(values);
            setProfileData(updatedProfile);
            setIsEditing(false);
            message.success('Profile updated!');
            if (user) {
                login({
                    accessToken: localStorage.getItem('accessToken') || '',
                    refreshToken: localStorage.getItem('refreshToken') || '',
                    user: { ...user, displayName: updatedProfile.displayName, avatarUrl: updatedProfile.avatarUrl },
                });
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUploadSuccess = (avatarUrl: string) => {
        setProfileData(prev => prev ? { ...prev, avatarUrl } : null);
        if (user) {
            login({
                accessToken: localStorage.getItem('accessToken') || '',
                refreshToken: localStorage.getItem('refreshToken') || '',
                user: { ...user, avatarUrl },
            });
        }
    };

    if (loading && !profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
                <Spin size="large" />
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
    };
    const item = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
            {/* ── Header ── */}
            <header className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center h-8 w-8 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="h-4 w-px bg-white/[0.08]" />
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-neutral-200 tracking-wide">Profile</span>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing ? (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Save
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                            >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* ── Content ── */}
            {profileData && (
                <motion.main
                    variants={container}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto px-6 md:px-10 py-10 space-y-8"
                >
                    {/* Avatar + Name */}
                    <motion.section variants={item} className="flex flex-col items-center text-center">
                        <AvatarUpload
                            currentAvatar={profileData.avatarUrl}
                            onUploadSuccess={handleAvatarUploadSuccess}
                            size={100}
                        />
                        <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight mt-5">
                            {profileData.displayName}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-1">{profileData.email}</p>
                        <div className="mt-3">
                            <RoleBadge role={profileData.role} />
                        </div>
                    </motion.section>

                    {/* Info / Edit */}
                    <motion.section variants={item}>
                        <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
                            {isEditing ? 'Edit Profile' : 'Profile Information'}
                        </h2>
                        <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.06]" style={{ background: '#111' }}>
                            {!isEditing ? (
                                <>
                                    {[
                                        { label: 'Display Name', value: profileData.displayName },
                                        { label: 'Email', value: profileData.email },
                                        { label: 'Status', value: profileData.statusMessage || 'No status message' },
                                        { label: 'Member Since', value: new Date(profileData.createdAt).toLocaleDateString() },
                                        { label: 'Subscription', value: profileData.subscriptionStatus },
                                    ].map((row) => (
                                        <div key={row.label} className="flex items-center justify-between px-5 py-4">
                                            <span className="text-sm text-neutral-500">{row.label}</span>
                                            <span className="text-sm text-neutral-200 font-medium">{row.value}</span>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="p-5 space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Display Name</label>
                                        <input
                                            value={formValues.displayName}
                                            onChange={(e) => setFormValues({ ...formValues, displayName: e.target.value })}
                                            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                                            placeholder="Enter your display name"
                                        />
                                        {errors.displayName && <p className="text-xs text-red-400 mt-1">{errors.displayName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Status Message</label>
                                        <textarea
                                            rows={3}
                                            value={formValues.statusMessage}
                                            onChange={(e) => setFormValues({ ...formValues, statusMessage: e.target.value })}
                                            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-colors resize-none"
                                            placeholder="What's on your mind?"
                                            maxLength={200}
                                        />
                                        <p className="text-xs text-neutral-600 mt-1 text-right">{formValues.statusMessage.length}/200</p>
                                        {errors.statusMessage && <p className="text-xs text-red-400 mt-1">{errors.statusMessage}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.section>
                </motion.main>
            )}
        </div>
    );
}

export default Profile;
