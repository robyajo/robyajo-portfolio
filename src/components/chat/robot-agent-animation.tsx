"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SparkleIcon, CheckIcon } from "@/components/shared/icons";

export type RobotState = "idle" | "thinking" | "working" | "success";

interface RobotAgentAnimationProps {
  state?: RobotState;
  variant?: "card" | "compact" | "avatar";
  statusText?: string;
  className?: string;
  size?: number;
  interactive?: boolean;
}

export function RobotAgentAnimation({
  state = "idle",
  variant = "card",
  statusText,
  className,
  size,
  interactive = true,
}: RobotAgentAnimationProps) {
  const [internalState, setInternalState] = useState<RobotState>(state);
  const [clickCelebration, setClickCelebration] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Sync state prop with internal state
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  // Dynamic status text cycling when thinking/working
  useEffect(() => {
    if (internalState === "thinking" || internalState === "working") {
      const interval = setInterval(() => {
        setTickerIndex((prev) => (prev + 1) % 3);
      }, 2200);
      return () => clearInterval(interval);
    }
    setTickerIndex(0);
  }, [internalState]);

  const defaultStatusTexts = {
    idle: "Asisten siap membantu",
    thinking: [
      "Menganalisis pertanyaan...",
      "Menghubungkan data portofolio...",
      "Mencari konteks & dokumentasi...",
    ],
    working: [
      "Menulis respons terstruktur...",
      "Menyusun kode & sintaksis...",
      "Memvalidasi penjelasan...",
    ],
    success: "Jawaban selesai disiapkan!",
  };

  const currentStatus =
    statusText ||
    (internalState === "thinking"
      ? defaultStatusTexts.thinking[tickerIndex]
      : internalState === "working"
      ? defaultStatusTexts.working[tickerIndex]
      : internalState === "success"
      ? defaultStatusTexts.success
      : defaultStatusTexts.idle);

  const handleClick = () => {
    if (!interactive) return;
    setClickCelebration(true);
    setInternalState("success");
    setTimeout(() => {
      setClickCelebration(false);
      setInternalState(state);
    }, 2400);
  };

  const isWorking = internalState === "working";
  const isThinking = internalState === "thinking";
  const isSuccess = internalState === "success";
  const isBusy = isThinking || isWorking;

  // Sizing
  const svgSize =
    size || (variant === "avatar" ? 44 : variant === "compact" ? 68 : 110);

  return (
    <div
      className={cn(
        "group/robot relative select-none transition-all duration-300",
        variant === "card" &&
          "flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border/80 bg-muted/30 p-3.5 shadow-xs backdrop-blur-sm",
        variant === "compact" &&
          "inline-flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5",
        variant === "avatar" && "inline-flex items-center justify-center",
        interactive && "cursor-pointer",
        className,
      )}
      onClick={handleClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={interactive ? "Klik untuk melihat respon robot!" : undefined}
    >
      {/* Robot SVG Graphic */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center transition-transform duration-300",
          interactive && "group-hover/robot:scale-105 active:scale-95",
        )}
        style={{ width: svgSize, height: svgSize }}
      >
        <svg
          viewBox="0 0 160 160"
          className="h-full w-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            /* Animations */
            @keyframes robotBob {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-4px) rotate(0.8deg); }
            }
            @keyframes robotTiltThink {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              25% { transform: translateY(-3px) rotate(-3.5deg); }
              75% { transform: translateY(-2px) rotate(3.5deg); }
            }
            @keyframes shadowPulse {
              0%, 100% { rx: 32; opacity: 0.25; transform: scale(1); }
              50% { rx: 26; opacity: 0.15; transform: scale(0.9); }
            }
            @keyframes radarPulse {
              0% { r: 5; opacity: 0.9; stroke-width: 2; }
              100% { r: 24; opacity: 0; stroke-width: 0.5; }
            }
            @keyframes eyeScan {
              0%, 100% { transform: translateX(-4px); }
              50% { transform: translateX(4px); }
            }
            @keyframes eyeBlink {
              0%, 94%, 98%, 100% { transform: scaleY(1); }
              96% { transform: scaleY(0.1); }
            }
            @keyframes typingLeft {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-4px) rotate(-8deg); }
            }
            @keyframes typingRight {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-4px) rotate(8deg); }
            }
            @keyframes codeStream {
              0% { stroke-dashoffset: 60; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes popBounce {
              0% { transform: scale(0) translateY(10px); opacity: 0; }
              60% { transform: scale(1.2) translateY(-2px); opacity: 1; }
              85% { transform: scale(0.95); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes sparkTwinkle {
              0%, 100% { opacity: 0.2; transform: scale(0.7); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            @keyframes thoughtFloat {
              0%, 100% { transform: translateY(0); opacity: 0.85; }
              50% { transform: translateY(-3px); opacity: 1; }
            }

            .anim-bob { animation: robotBob 3.6s ease-in-out infinite; transform-origin: 80px 140px; }
            .anim-think { animation: robotTiltThink 2.8s ease-in-out infinite; transform-origin: 80px 140px; }
            .anim-shadow { animation: shadowPulse 3.6s ease-in-out infinite; transform-origin: 80px 148px; }
            .anim-radar-1 { animation: radarPulse 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite; }
            .anim-radar-2 { animation: radarPulse 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) 0.6s infinite; }
            .anim-scan { animation: eyeScan 1.6s ease-in-out infinite; transform-origin: center; }
            .anim-blink { animation: eyeBlink 4.2s infinite; transform-origin: center; }
            .anim-type-l { animation: typingLeft 0.35s ease-in-out infinite alternate; transform-origin: 52px 108px; }
            .anim-type-r { animation: typingRight 0.35s ease-in-out 0.18s infinite alternate; transform-origin: 108px 108px; }
            .anim-code-1 { stroke-dasharray: 60; animation: codeStream 1.8s linear infinite; }
            .anim-code-2 { stroke-dasharray: 60; animation: codeStream 1.8s linear 0.6s infinite; }
            .anim-success-pop { animation: popBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; transform-origin: center; }
            .anim-spark { animation: sparkTwinkle 1.4s ease-in-out infinite; transform-origin: center; }
            .anim-thought { animation: thoughtFloat 2.2s ease-in-out infinite; transform-origin: center; }
          `}</style>

          {/* Floor Shadow */}
          <ellipse
            cx="80"
            cy="148"
            rx="34"
            ry="6"
            className={cn(
              "fill-foreground/20 anim-shadow transition-all duration-300",
              isWorking && "opacity-30",
            )}
          />

          {/* Main Floating Robot Group */}
          <g className={isThinking ? "anim-think" : "anim-bob"}>
            {/* Thinking / Question Bubble on Top Left */}
            {isThinking && (
              <g className="anim-thought" transform="translate(18, 12)">
                <ellipse
                  cx="18"
                  cy="16"
                  rx="14"
                  ry="12"
                  className="fill-background stroke-(--brand-text)/50"
                  strokeWidth="1.8"
                />
                <circle
                  cx="32"
                  cy="27"
                  r="2.5"
                  className="fill-(--brand-text)/60"
                />
                <circle
                  cx="37"
                  cy="32"
                  r="1.5"
                  className="fill-(--brand-text)/40"
                />
                {/* Floating Gear / Question Icon */}
                <path
                  d="M18 10C16.3 10 15 11.3 15 13H17C17 12.4 17.4 12 18 12C18.6 12 19 12.4 19 13C19 14.5 17 14 17 16H19C19 15 21 14.5 21 13C21 11.3 19.7 10 18 10ZM17 18H19V20H17V18Z"
                  className="fill-(--brand-text)"
                />
              </g>
            )}

            {/* Success Celebration Stars & Medal on Top */}
            {(isSuccess || clickCelebration) && (
              <g className="anim-success-pop" transform="translate(80, 20)">
                {/* Celebration Sparkles */}
                <path
                  d="M-36 -8 L-33 -5 L-30 -8 L-33 -11 Z"
                  className="fill-amber-400 anim-spark"
                />
                <path
                  d="M34 -10 L37 -7 L40 -10 L37 -13 Z"
                  className="fill-amber-400 anim-spark [animation-delay:0.3s]"
                />
                <circle
                  cx="-26"
                  cy="-18"
                  r="2"
                  className="fill-(--brand-text) anim-spark [animation-delay:0.5s]"
                />
                <circle
                  cx="28"
                  cy="-20"
                  r="2.5"
                  className="fill-(--brand-text) anim-spark [animation-delay:0.2s]"
                />

                {/* Badge Crown */}
                <circle
                  cx="0"
                  cy="-2"
                  r="13"
                  className="fill-(--available) shadow-md"
                />
                <path
                  d="M-4 -2 L-1 2 L5 -4"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* Antenna System */}
            <g>
              {/* Antenna Stem */}
              <line
                x1="80"
                y1="46"
                x2="80"
                y2="28"
                className="stroke-muted-foreground/80"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Radar Signal Rings (Active when thinking or working) */}
              {isBusy && (
                <>
                  <circle
                    cx="80"
                    cy="25"
                    className="stroke-(--brand-text) anim-radar-1"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="25"
                    className="stroke-(--brand-text) anim-radar-2"
                    fill="none"
                  />
                </>
              )}

              {/* Antenna Glowing Tip */}
              <circle
                cx="80"
                cy="25"
                r="6.5"
                className={cn(
                  "transition-colors duration-300",
                  isSuccess
                    ? "fill-(--available)"
                    : isBusy
                    ? "fill-(--brand-text)"
                    : "fill-(--brand-text)/80",
                )}
              />
              <circle cx="81.5" cy="23.5" r="2" fill="white" opacity="0.6" />
            </g>

            {/* Ear Bolts / Communication Hubs */}
            <rect
              x="36"
              y="58"
              width="6"
              height="16"
              rx="3"
              className="fill-muted-foreground/50 stroke-border"
              strokeWidth="1.5"
            />
            <rect
              x="118"
              y="58"
              width="6"
              height="16"
              rx="3"
              className="fill-muted-foreground/50 stroke-border"
              strokeWidth="1.5"
            />

            {/* Head Outer Casing */}
            <rect
              x="42"
              y="44"
              width="76"
              height="52"
              rx="18"
              className="fill-card stroke-border transition-colors"
              strokeWidth="2.5"
            />

            {/* Face Visor (Glossy Dark Display) */}
            <rect
              x="48"
              y="51"
              width="64"
              height="38"
              rx="12"
              fill="#090d16"
              className="stroke-border/40"
              strokeWidth="1"
            />

            {/* Visor Glare Reflection */}
            <path
              d="M 52 55 Q 80 52 108 59"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.12"
            />

            {/* Eyes & Face Expressions */}
            {isSuccess || clickCelebration ? (
              // Happy Winking / Joyful Eyes (^ ^)
              <g>
                <path
                  d="M 58 71 Q 65 62 72 71"
                  className="stroke-(--available)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 88 71 Q 95 62 102 71"
                  className="stroke-(--available)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Cute Rosy Cheeks */}
                <circle cx="56" cy="77" r="3" fill="#f43f5e" opacity="0.5" />
                <circle cx="104" cy="77" r="3" fill="#f43f5e" opacity="0.5" />
                {/* Cheerful Smile */}
                <path
                  d="M 74 76 Q 80 82 86 76"
                  className="stroke-(--available)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ) : isThinking ? (
              // Thinking Eyes: Scanning pupils moving left and right
              <g className="anim-scan">
                <circle
                  cx="65"
                  cy="68"
                  r="5.5"
                  className="fill-(--brand-text)"
                />
                <circle cx="67" cy="66" r="1.8" fill="white" />
                <circle
                  cx="95"
                  cy="68"
                  r="5.5"
                  className="fill-(--brand-text)"
                />
                <circle cx="97" cy="66" r="1.8" fill="white" />

                {/* Processing Waveform Mouth */}
                <g transform="translate(73, 76)">
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="4"
                    className="stroke-(--brand-text)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="4"
                    y1="-1"
                    x2="4"
                    y2="5"
                    className="stroke-(--brand-text)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="-2"
                    x2="8"
                    y2="6"
                    className="stroke-(--brand-text)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="12"
                    y1="0"
                    x2="12"
                    y2="4"
                    className="stroke-(--brand-text)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            ) : isWorking ? (
              // Working / Coding Eyes: Matrix code stream lines on visor
              <g>
                <line
                  x1="55"
                  y1="64"
                  x2="75"
                  y2="64"
                  className="stroke-(--brand-text) anim-code-1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="55"
                  y1="71"
                  x2="70"
                  y2="71"
                  className="stroke-sky-400 anim-code-2"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="85"
                  y1="64"
                  x2="105"
                  y2="64"
                  className="stroke-(--brand-text) anim-code-1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="90"
                  y1="71"
                  x2="105"
                  y2="71"
                  className="stroke-amber-400 anim-code-2"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Concentrated mouth */}
                <line
                  x1="76"
                  y1="78"
                  x2="84"
                  y2="78"
                  className="stroke-(--brand-text)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              // Idle / Friendly Eyes with Blinking
              <g className="anim-blink">
                <circle
                  cx="65"
                  cy="68"
                  r="5.5"
                  className="fill-(--brand-text)"
                />
                <circle cx="67" cy="66" r="2" fill="white" />
                <circle
                  cx="95"
                  cy="68"
                  r="5.5"
                  className="fill-(--brand-text)"
                />
                <circle cx="97" cy="66" r="2" fill="white" />
                {/* Friendly Gentle Smile */}
                <path
                  d="M 76 77 Q 80 80 84 77"
                  className="stroke-(--brand-text)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}

            {/* Neck Joint */}
            <rect
              x="74"
              y="96"
              width="12"
              height="7"
              rx="2.5"
              className="fill-muted-foreground/40 stroke-border/50"
              strokeWidth="1"
            />

            {/* Torso / Body */}
            <rect
              x="52"
              y="102"
              width="56"
              height="38"
              rx="12"
              className="fill-card stroke-border"
              strokeWidth="2.5"
            />

            {/* Chest Arc Reactor / Core */}
            <circle
              cx="80"
              cy="119"
              r="7.5"
              className={cn(
                "transition-colors duration-300",
                isSuccess
                  ? "fill-(--available)"
                  : isBusy
                  ? "fill-(--brand-text)"
                  : "fill-(--brand-text)/80",
              )}
            />
            <circle
              cx="80"
              cy="119"
              r="4"
              fill="white"
              className={cn(isBusy && "animate-ping opacity-60")}
            />

            {/* Chest Status Bars */}
            <line
              x1="62"
              y1="116"
              x2="68"
              y2="116"
              className="stroke-muted-foreground/60"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <line
              x1="62"
              y1="122"
              x2="66"
              y2="122"
              className="stroke-muted-foreground/40"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <line
              x1="92"
              y1="116"
              x2="98"
              y2="116"
              className="stroke-muted-foreground/60"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <line
              x1="94"
              y1="122"
              x2="98"
              y2="122"
              className="stroke-muted-foreground/40"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Working Workstation / Laptop (Visible when working) */}
            {isWorking && (
              <g transform="translate(56, 122)">
                {/* Laptop Base */}
                <path
                  d="M 2 14 L 46 14 L 42 18 L 6 18 Z"
                  className="fill-muted stroke-border"
                  strokeWidth="1"
                />
                {/* Laptop Screen with glowing code */}
                <rect
                  x="6"
                  y="2"
                  width="36"
                  height="13"
                  rx="2"
                  fill="#0b1120"
                  className="stroke-border/70"
                  strokeWidth="1"
                />
                <line
                  x1="9"
                  y1="5"
                  x2="22"
                  y2="5"
                  className="stroke-(--brand-text) anim-code-1"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <line
                  x1="9"
                  y1="9"
                  x2="32"
                  y2="9"
                  className="stroke-sky-400 anim-code-2"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Robotic Arms */}
            <g>
              {/* Left Arm */}
              <g className={isWorking ? "anim-type-l" : undefined}>
                <rect
                  x="41"
                  y="107"
                  width="11"
                  height="22"
                  rx="5.5"
                  className="fill-muted stroke-border"
                  strokeWidth="2"
                />
                {/* Hand/Gripper */}
                <circle
                  cx="46.5"
                  cy="129"
                  r="4.5"
                  className="fill-muted-foreground/60"
                />
              </g>

              {/* Right Arm */}
              <g className={isWorking ? "anim-type-r" : undefined}>
                <rect
                  x="108"
                  y="107"
                  width="11"
                  height="22"
                  rx="5.5"
                  className="fill-muted stroke-border"
                  strokeWidth="2"
                />
                {/* Hand/Gripper */}
                <circle
                  cx="113.5"
                  cy="129"
                  r="4.5"
                  className="fill-muted-foreground/60"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Info / Status Description (in card & compact variants) */}
      {variant !== "avatar" && (
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-heading text-xs font-semibold text-foreground tracking-tight">
              {isSuccess
                ? "Respon Selesai"
                : isWorking
                ? "Menulis Kode & Solusi"
                : isThinking
                ? "Menganalisis Kode"
                : "ER AI Assistant"}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.2 font-pixel text-3xs font-semibold uppercase tracking-widest transition-colors",
                isSuccess
                  ? "bg-(--available)/15 text-(--available) border border-(--available)/30"
                  : isBusy
                  ? "bg-(--brand)/15 text-(--brand-text) border border-(--brand)/30"
                  : "bg-muted text-muted-foreground border border-border/80",
              )}
            >
              {isSuccess
                ? "[SYS // DONE]"
                : isWorking
                ? "[SYS // EXEC]"
                : isThinking
                ? "[SYS // COMPUTE]"
                : "[SYS // IDLE]"}
            </span>
          </div>

          <p className="flex items-center justify-center sm:justify-start gap-1.5 font-mono text-2xs text-muted-foreground">
            {isBusy ? (
              <span className="text-(--brand-text) font-pixel text-3xs font-bold animate-pulse">
                ›
              </span>
            ) : isSuccess ? (
              <CheckIcon className="size-3 text-(--available) shrink-0" />
            ) : (
              <span className="text-muted-foreground/60 font-pixel text-3xs">
                ›
              </span>
            )}
            <span className="truncate">{currentStatus}</span>
          </p>

          {/* Cyberpunk Progress Micro-Bar during busy states */}
          {isBusy && (
            <div className="mt-1 flex items-center gap-1.5 w-full">
              <div className="h-1 flex-1 overflow-hidden rounded-xs bg-muted border border-border/60">
                <div
                  className={cn(
                    "h-full bg-(--brand-text) transition-all duration-300",
                    isThinking
                      ? "w-2/5 animate-pulse"
                      : "w-4/5 animate-pulse [animation-duration:800ms]",
                  )}
                />
              </div>
              <span className="font-pixel text-3xs uppercase tracking-wider text-muted-foreground/70 shrink-0">
                {isThinking ? "40%" : "85%"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
