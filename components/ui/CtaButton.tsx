"use client";

import { trackCtaRegistro } from "@/lib/analytics";
import { getEventUrl, getLoginUrl, getSignupUrl } from "@/lib/p50";

type Destination = "register" | "login" | "event";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "dark";
  destination?: Destination;
  eventId?: string;
  campaign?: string;
  medium?: string;
  className?: string;
  ariaLabel?: string;
};

const STYLES: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-lime-400 text-zinc-950 hover:bg-lime-300 font-750 shadow-[0_8px_30px_-8px_rgba(163,230,53,0.5)]",
  ghost:
    "border border-white/20 text-white hover:bg-white/10 font-450",
  dark: "bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 font-450",
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
        new CustomEvent("p50:age-gate", { detail: { href } })
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
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-3 text-[15px] leading-6 transition-colors focus-visible:outline-lime-400 ${STYLES[variant]} ${className}`}
    >
      {children}
    </a>
  );
}
