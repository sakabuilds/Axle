"use client";
import React, { useEffect, useState } from "react";
import Logo from "./Logo";
import {
  CardsThreeIcon,
  CaretDownIcon,
  CreditCardIcon,
  CubeIcon,
  GearIcon,
  HandshakeIcon,
  HouseIcon,
  SquaresFourIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import AccountSettingsModal from "./AccountSettingsModal";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { usePlan } from "@/context/PlanContext";

type ProfileData = {
  name?: string;
  email?: string;
  avatar?: string;
  plan?: string;
  tokensUsed?: number;
  tokensTotal?: number;
  tokensPurchased?: number;
};

const Sidebar = () => {
  const pathname = usePathname();
  const { plan: activePlan } = usePlan();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.getProfile();
        const profileData = (response as any)?.user ?? (response as any)?.profile ?? response;
        setProfile({
          name: profileData?.name || profileData?.email?.split("@")[0] || "User",
          email: profileData?.email || "",
          avatar: profileData?.avatar || profileData?.profileImageUrl || "/tayo.png",
          plan: profileData?.plan || activePlan || "free",
          tokensUsed: profileData?.credits ?? 0,
          tokensTotal: profileData?.plan === "pro" ? 500 : 100,
          tokensPurchased: 0,
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        // Fallback to defaults
        setProfile({
          name: "User",
          email: "",
          avatar: "/tayo.png",
          plan: "free",
          tokensUsed: 0,
          tokensTotal: 100,
          tokensPurchased: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const navigation = [
    {
      name: "Home",
      href: "/app",
      icons: HouseIcon,
    },
    {
      name: "Agents",
      href: "/app/agents",
      icons: CubeIcon,
    },
    {
      name: "Templates",
      href: "/app/templates",
      icons: CardsThreeIcon,
    },
    {
      name: "Apps",
      href: "/app/apps",
      icons: SquaresFourIcon,
    },
    {
      name: "X Accounts",
      href: "/app/x-accounts",
      icons: XLogoIcon,
    },
    {
      name: "Settings",
      href: "/app/settings",
      icons: GearIcon,
    },
  ];

  const displayName = profile?.name || "User";
  const displayEmail = profile?.email || "";
  const avatarUrl = profile?.avatar || "/tayo.png";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const profileVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay: 0.3,
      },
    },
  };

  return (
    <div className="bg-surface dark:bg-[#0a0a0a] dark:text-white hidden md:flex md:relative items-center flex-col justify-between p-4.5 w-48 lg:w-64 h-screen">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="flex w-full text-xl font-bold text-text items-center gap-1"
        >
          <Logo size={28} />
          Axle
        </motion.div>
        <motion.nav
          id="sidebar-nav"
          className="flex w-full h-full flex-col pt-12 lg:pt-16 gap-2 py-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {navigation.map(({ name, href, icons: Icon }) => {
            const isActive =
              href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(href);

            return (
              <motion.div key={name} variants={navItemVariants}>
                <Link
                  href={href}
                  className={`
    relative flex items-center gap-2 p-[9px] rounded-xl
    font-semibold transition-all duration-300
    glass
    hover:inner-hover hover:scale-[0.99]
    ${isActive
                      ? "bg-accent dark:bg-accent-dark dark:inner-pressed"
                      : "hover:bg-white/10 dark:hover:bg-white/[0.06]"
                    }
  `}
                >
                  <Icon
                    size={20}
                    weight={isActive ? "fill" : "bold"}
                    className={`shrink-0 dark:text-white text-dark/50 ${isActive ? "drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] text-white" : ""}`}
                  />
                  <p
                    className={`
    text-sm dark:bg-clip-text text-dark/50 dark:text-transparent
    dark:bg-linear-to-b dark:from-white dark:via-neutral-300 dark:to-neutral-500
    ${isActive ? "text-white dark:text-white" : ""}
  `}
                  >
                    {name}
                  </p>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-accent/10 dark:bg-white/5 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
      </div>

      <div className="relative w-full">
        <div className="flex flex-col py-4 gap-2">
          <Link href="/app/billing" className="bg-dark/4 hover:bg-accent/15 hover:shadow-accent/15 transition-all duration-300 shadow-lg shadow-dark/0 hover:border-accent/35 hover:text-accent dark:bg-white/4 dark:text-white text-dark/50 flex gap-2 text-xs p-2.5 border-dark/5 dark:border-white/5 border rounded-xl items-center">
            <CreditCardIcon size={16} weight="bold" className="shrink-0" />
            Billing
          </Link>
          <Link href="/app/feedback" className="bg-dark/4 hover:bg-accent/15 hover:shadow-accent/15 transition-all duration-300 shadow-lg shadow-dark/0 hover:border-accent/35 hover:text-accent dark:bg-white/4 dark:text-white text-dark/50 flex gap-2 text-xs p-2.5 border-dark/5 dark:border-white/5 border rounded-xl items-center">
            <HandshakeIcon size={16} weight="bold" className="shrink-0" />
            Feedback
          </Link>
        </div>
        <AnimatePresence>
          {isModalOpen && (
            <AccountSettingsModal
              profile={profile}
              loading={loading}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </AnimatePresence>

        <motion.div
          variants={profileVariants}
          initial="hidden"
          animate="visible"
          onClick={() => setIsModalOpen(!isModalOpen)}
          className="flex w-full cursor-pointer items-center justify-between p-1 rounded-lg transition-all duration-300 gap-2"
        >
          <div className="flex gap-2 items-center">
            {loading ? (
              <div className="w-12 h-12 rounded-full bg-dark/10 dark:bg-white/10 animate-pulse" />
            ) : (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={48}
                height={48}
                className="rounded-full border-4 dark:border-white/3 border-dark/15"
              />
            )}
            <div className="flex flex-col gap-0.5">
              {loading ? (
                <>
                  <div className="w-16 h-4 bg-dark/10 dark:bg-white/10 rounded animate-pulse" />
                  <div className="w-24 h-3 bg-dark/10 dark:bg-white/10 rounded animate-pulse mt-1" />
                </>
              ) : (
                <>
                  <p className="text-sm dark:text-white font-semibold">{displayName}</p>
                  <p className="text-[11px] dark:text-white/35 text-text/50 truncate max-w-[120px]">
                    {displayEmail}
                  </p>
                </>
              )}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isModalOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <CaretDownIcon size={17} weight="regular" className="dark:text-white/50 text-dark/50" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Sidebar;
