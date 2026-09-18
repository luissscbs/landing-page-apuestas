"use client";

import { trackCtaRegistro } from "@/lib/analytics";
import { getEventUrl, getLoginUrl, getSignupUrl } from "@/lib/cbs";

type Destination = "register" | "login" | "event";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "dark" | "accent";
  destination?: Destination;
  eventId?: string;
  campaign?: string;
  medium?: string;
  className?: string;
  ariaLabel?: string;
};

const STYLES: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-lime-400 text-zinc-950 font-750 hover:bg-lime-300 hover:shadow-[0_0_24px_rgba(163,230,53,0.45)] transition-all duration-200",
  ghost:
    "border border-white/15 text-white hover:bg-white/10 hover:border-white/30 font-450 transition-all duration-200",
  dark:
    "bg-zinc-900/90 text-white border border-white/10 hover:bg-zinc-800 hover:border-white/20 font-450 transition-all duration-200",
  accent:
    "bg-gradient-to-r from-lime-400 to-emerald-400 text-zinc-950 font-750 hover:brightness-110 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] transition-all duration-200",
};

function hasAgeCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("age_verified=1");
}

export default function CtaButton({
  children,
  variant = "primary",
  destination = "register",
  eventId,
  campaign,
  medium = "cta_hero",
  className = "",
  ariaLabel,
}: Props) {
  const href =
    destination === "login"
      ? getLoginUrl()
      : destination === "event" && eventId
        ? getEventUrl(eventId, medium, campaign)
        : getSignupUrl(campaign, medium);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackCtaRegistro(medium, campaign);
    // Gate +18: si no hay cookie, abre modal y difiere la navegación.
    if (destination === "register" && !hasAgeCookie()) {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("cbs:age-gate", { detail: { href } })
      );
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`inline-flex min-h-[46px] items-center justify-center rounded-full px-6 py-3 text-[15px] leading-6 select-none focus-visible:outline-lime-400 ${STYLES[variant]} ${className}`}
    >
      {children}
    </a>
  );
}
