"use client";
import React, { useState } from "react";
import {
    motion,
    useScroll,
    useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavItem {
    name: string;
    link: string;
    icon?: React.ReactNode;
}

export const FloatingNav = ({
    navItems,
    className,
    onLoginClick,
}: {
    navItems: NavItem[];
    className?: string;
    onLoginClick?: () => void;
}) => {
    const { scrollYProgress } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollYProgress, "change", (current) => {
        if (typeof current === "number") {
            setScrolled(current > 0.02);
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "flex max-w-fit fixed top-6 inset-x-0 mx-auto rounded-full z-[5000] pl-8 pr-2 py-2 items-center justify-center space-x-4 transition-all duration-300",
                scrolled
                    ? "border border-white/[0.1] bg-neutral-950/80 backdrop-blur-xl shadow-lg shadow-black/20"
                    : "border border-white/[0.05] bg-neutral-950/40 backdrop-blur-md",
                className
            )}
        >
            {navItems.map((navItem, idx) => {
                const isHash = navItem.link.startsWith("#");
                const handleClick = (e: React.MouseEvent) => {
                    if (isHash) {
                        e.preventDefault();
                        const el = document.querySelector(navItem.link);
                        if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                    }
                };

                const linkProps = isHash
                    ? { href: navItem.link, onClick: handleClick }
                    : { href: navItem.link };

                return (
                    <a
                        key={`link-${idx}`}
                        {...linkProps}
                        className="relative group items-center flex space-x-1 px-3 py-1.5 rounded-full transition-all duration-200 no-underline"
                    >
                        <span className="block sm:hidden">{navItem.icon}</span>
                        <span className="hidden sm:block text-sm text-neutral-400 group-hover:text-white transition-colors duration-200">
                            {navItem.name}
                        </span>
                        {/* Hover underline glow */}
                        <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {/* Hover background glow */}
                        <span className="absolute inset-0 rounded-full bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </a>
                );
            })}
            <button
                onClick={onLoginClick}
                className="relative border text-sm font-medium border-white/[0.15] text-neutral-300 px-5 py-2 rounded-full overflow-hidden group transition-all duration-300 hover:text-white hover:border-indigo-400/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
            >
                {/* Button background glow on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                <span className="relative z-10">Login</span>
                {/* Bottom gradient line */}
                <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px opacity-60 group-hover:opacity-100 group-hover:w-3/4 transition-all duration-300" />
            </button>
        </motion.div>
    );
};
