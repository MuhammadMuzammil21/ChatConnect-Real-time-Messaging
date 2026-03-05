"use client";


import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";

interface AuthFormSplitScreenProps {
    onGoogleLogin: () => void;
    onBack: () => void;
    imageSrc: string;
    imageAlt: string;
}

/**
 * A responsive, split-screen authentication component adapted for Google OAuth.
 */
export function AuthFormSplitScreen({
    onGoogleLogin,
    onBack,
    imageSrc,
    imageAlt,
}: AuthFormSplitScreenProps) {
    // Animation variants for staggering children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col md:flex-row">
            {/* Left Panel: Form */}
            <div className="flex w-full min-h-screen md:min-h-0 flex-col items-center justify-center px-5 py-10 sm:p-8 md:w-1/2" style={{ background: '#0a0a0a' }}>
                <div className="w-full max-w-md">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-6"
                    >
                        {/* Back button */}
                        <motion.div variants={itemVariants}>
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-sm font-medium transition-colors"
                                style={{ color: '#818cf8' }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to home
                            </button>
                        </motion.div>

                        {/* Logo */}
                        <motion.div variants={itemVariants} className="mb-2 flex items-center gap-3">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                            >
                                <MessageSquare className="h-6 w-6 text-white" />
                            </div>
                            <span
                                className="text-xl font-bold tracking-wide"
                                style={{
                                    background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                ChatConnect
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.div variants={itemVariants} className="text-left">
                            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: '#e5e5e5' }}>
                                Welcome back
                            </h1>
                            <p className="mt-1.5 sm:mt-2 text-sm" style={{ color: '#737373' }}>
                                Sign in to continue to your conversations
                            </p>
                        </motion.div>

                        {/* Separator */}
                        <motion.div variants={itemVariants} className="flex items-center gap-4">
                            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#525252' }}>
                                sign in with
                            </span>
                            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        </motion.div>

                        {/* Google Sign In Button */}
                        <motion.div variants={itemVariants}>
                            <button
                                onClick={onGoogleLogin}
                                className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{
                                    background: 'rgba(23, 23, 23, 0.8)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: '#e5e5e5',
                                }}
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </button>
                        </motion.div>

                        {/* Primary CTA */}
                        <motion.div variants={itemVariants}>
                            <Button
                                onClick={onGoogleLogin}
                                className="w-full h-12 text-sm font-semibold"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    border: 'none',
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                }}
                            >
                                Get Started Free
                            </Button>
                        </motion.div>

                        {/* Features list */}
                        <motion.div variants={itemVariants} className="mt-4 space-y-3">
                            {[
                                'Real-time messaging with WebSocket technology',
                                'Secure authentication via Google OAuth 2.0',
                                'File sharing and media gallery support',
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div
                                        className="flex h-5 w-5 items-center justify-center rounded-full text-xs"
                                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                                    >
                                        ✓
                                    </div>
                                    <span className="text-xs" style={{ color: '#a3a3a3' }}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </motion.div>

                        {/* Footer */}
                        <motion.p
                            variants={itemVariants}
                            className="mt-4 text-center text-xs"
                            style={{ color: '#525252' }}
                        >
                            By signing in, you agree to our Terms of Service and Privacy Policy.
                            <br />
                            Secure authentication powered by Google OAuth 2.0
                        </motion.p>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel: Image */}
            <div className="relative hidden w-1/2 md:block">
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {/* Overlay branding */}
                {/* <div className="absolute bottom-12 left-12 right-12">
                    <h2 className="text-3xl font-bold text-white mb-3">
                        Connect, Collaborate &amp; Communicate
                    </h2>
                    <p className="text-sm text-white/70 max-w-md">
                        Enterprise-grade messaging with real-time delivery, file sharing, and smart search — all in one beautiful interface.
                    </p>
                </div> */}
            </div>
        </div>
    );
}
