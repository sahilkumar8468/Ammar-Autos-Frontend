"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * BikeIntro — Authentic Pakistani 70cc (CD 70 Style) Assembly Animation
 *
 * Sequence:
 * 1. Front Tyre starts off-screen left and rolls smoothly to the screen center.
 * 2. Rear Tyre rolls into position.
 * 3. Main frame drops down to link the wheels.
 * 4. Engine, Tank, Seat, Handlebars, Headlight & Exhaust snap into place.
 * 5. Settles with a bounce, badges pop, and scene fades out to trigger onDone().
 */
export default function BikeIntro({ onDone }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  // Bike Component Refs
  const frontWheelRef = useRef(null);
  const frontWheelSpinRef = useRef(null);
  const rearWheelRef = useRef(null);
  const rearWheelSpinRef = useRef(null);

  const frameRef = useRef(null);
  const engineRef = useRef(null);
  const tankRef = useRef(null);
  const seatRef = useRef(null);
  const barsRef = useRef(null);
  const headlightRef = useRef(null);
  const exhaustRef = useRef(null);
  const sideCoverRef = useRef(null);
  const rearFenderRef = useRef(null);
  const badgeRef = useRef(null);
  const groundRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ----------------------------------------------------
      // INITIAL HIDDEN STATES
      // ----------------------------------------------------
      // Front wheel starts far off-screen left (laptop edge)
      gsap.set(frontWheelRef.current, { x: -450, opacity: 1 });

      // Ground line hidden
      gsap.set(groundRef.current, { scaleX: 0, transformOrigin: "0% 50%" });

      // All remaining CD 70 parts are hidden and offset for assembly
      gsap.set(rearWheelRef.current, { opacity: 0, x: -120, scale: 0.8 });
      gsap.set(frameRef.current, { opacity: 0, y: -40 });
      gsap.set(engineRef.current, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" });
      gsap.set(tankRef.current, { opacity: 0, y: -45, scale: 0.7, transformOrigin: "50% 100%" });
      gsap.set(seatRef.current, { opacity: 0, y: -25 });
      gsap.set(barsRef.current, { opacity: 0, y: -30, rotate: -25, transformOrigin: "0% 100%" });
      gsap.set(headlightRef.current, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });
      gsap.set(sideCoverRef.current, { opacity: 0, scale: 0.5 });
      gsap.set(rearFenderRef.current, { opacity: 0, x: -20 });
      gsap.set(exhaustRef.current, { opacity: 0, x: -25 });
      gsap.set(badgeRef.current, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });

      // ----------------------------------------------------
      // MASTER TIMELINE
      // ----------------------------------------------------
      const tl = gsap.timeline({
        onComplete: () => {
          // Transition intro out to reveal login
          gsap.to(sceneRef.current, {
            opacity: 0,
            y: -20,
            scale: 0.98,
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: onDone,
          });
        },
      });

      // 1. Draw Road Ground Line
      tl.to(groundRef.current, { scaleX: 1, duration: 1.3, ease: "power1.out" }, 0);

      // 2. Front Tyre Rolls from Left Screen edge -> Center (x: 0)
      tl.to(frontWheelRef.current, { x: 0, duration: 1.4, ease: "power2.out" }, 0);
      tl.to(
        frontWheelSpinRef.current,
        { rotate: 720, duration: 1.4, ease: "power2.out", transformOrigin: "50% 50%" },
        0
      );

      // 3. ASSEMBLY STAGE (Starts right when front wheel settles in center)
      const assembleTime = 1.2;

      // Rear Wheel rolls in
      tl.to(
        rearWheelRef.current,
        { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: "back.out(1.4)" },
        assembleTime
      );
      tl.to(
        rearWheelSpinRef.current,
        { rotate: 360, duration: 0.35, transformOrigin: "50% 50%" },
        assembleTime
      );

      // Main Underbone Frame & Swingarm attach
      tl.to(frameRef.current, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, assembleTime + 0.15);

      // 70cc Engine Block snaps into cradle
      tl.to(engineRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, assembleTime + 0.3);

      // Fuel Tank drops into place
      tl.to(tankRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, assembleTime + 0.45);

      // Side Covers & Rear Mudguard attach
      tl.to(sideCoverRef.current, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, assembleTime + 0.55);
      tl.to(rearFenderRef.current, { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" }, assembleTime + 0.6);

      // Seat snaps on top
      tl.to(seatRef.current, { opacity: 1, y: 0, duration: 0.25, ease: "back.out(1.8)" }, assembleTime + 0.7);

      // Handlebars & Chrome Speedo Console
      tl.to(barsRef.current, { opacity: 1, y: 0, rotate: 0, duration: 0.3, ease: "back.out(2)" }, assembleTime + 0.8);

      // Square 70cc Headlight
      tl.to(headlightRef.current, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, assembleTime + 0.9);

      // Chrome Downswept Silencer / Exhaust
      tl.to(exhaustRef.current, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, assembleTime + 1.0);

      // Badge Pop
      tl.to(badgeRef.current, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.5)" }, assembleTime + 1.15);

      // Kickstand bounce & small delay before revealing login
      tl.to(sceneRef.current, { y: -6, duration: 0.12, ease: "power1.out" }, assembleTime + 1.3)
        .to(sceneRef.current, { y: 0, duration: 0.25, ease: "bounce.out" })
        .to({}, { duration: 0.5 });
    }, containerRef);

    return () => ctx.revert();
  }, [onDone]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950 text-slate-100"
    >
      {/* Background Radial Spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.12)_0%,_transparent_75%)]" />

      <div ref={sceneRef} className="relative w-[92vw] max-w-[700px] flex flex-col items-center">
        <svg viewBox="0 0 700 320" className="w-full h-auto overflow-visible">
          {/* Road / Ground Line */}
          <line
            ref={groundRef}
            x1="30"
            y1="240"
            x2="670"
            y2="240"
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* ==================== 70cc BIKE ASSEMBLY ==================== */}
          <g transform="translate(100, 0)">
            
            {/* 1. REAR WHEEL ASSEMBLY */}
            <g ref={rearWheelRef} transform="translate(170, 190)">
              <g ref={rearWheelSpinRef}>
                {/* 17-inch Thin Rim & Tyre */}
                <circle r="46" fill="none" stroke="#0f172a" strokeWidth="8" />
                <circle r="46" fill="none" stroke="#94a3b8" strokeWidth="2" />
                <circle r="7" fill="#cbd5e1" />
                {/* 36 Spokes representation */}
                {[...Array(12)].map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={40 * Math.cos((i * 30 * Math.PI) / 180)}
                    y2={40 * Math.sin((i * 30 * Math.PI) / 180)}
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
              {/* Rear Chain Sprocket */}
              <circle r="18" fill="none" stroke="#475569" strokeWidth="3" strokeDasharray="3,3" />
            </g>

            {/* 2. REAR MUDGUARD & TAIL LIGHT */}
            <g ref={rearFenderRef}>
              <path
                d="M135 185 C140 145, 175 140, 205 155"
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Red Tail Light */}
              <rect x="128" y="172" width="8" height="12" rx="2" fill="#ef4444" stroke="#0f172a" strokeWidth="1" />
            </g>

            {/* 3. UNDERBONE FRAME & SWINGARM */}
            <g ref={frameRef}>
              {/* Rear Swingarm */}
              <line x1="170" y1="190" x2="250" y2="175" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              {/* Rear Shock Absorber */}
              <line x1="190" y1="185" x2="215" y2="135" stroke="#cbd5e1" strokeWidth="4" />
              <line x1="190" y1="185" x2="215" y2="135" stroke="#dc2626" strokeWidth="2" strokeDasharray="3,2" />
              {/* Main Spine Frame */}
              <path
                d="M230 175 L280 140 L380 135 L400 190"
                fill="none"
                stroke="#0f172a"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* 4. 70cc HORIZONTAL ENGINE BLOCK */}
            <g ref={engineRef} transform="translate(245, 160)">
              {/* Crankcase */}
              <rect x="0" y="5" width="45" height="35" rx="6" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Horizontal 70cc Cylinder Head */}
              <rect x="42" y="12" width="30" height="22" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Cooling Fins */}
              <line x1="48" y1="10" x2="48" y2="36" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="55" y1="10" x2="55" y2="36" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="62" y1="10" x2="62" y2="36" stroke="#94a3b8" strokeWidth="1.5" />
              {/* CD 70 Magneto Cover Circle */}
              <circle cx="20" cy="22" r="10" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Kick Starter */}
              <path d="M10 28 L-5 35 L-8 32" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* 5. SIDE COVER (70 TOOLBOX COVER) */}
            <g ref={sideCoverRef} transform="translate(250, 138)">
              <polygon points="0,0 45,0 35,28 5,28" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
              <text x="22" y="18" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">
                70
              </text>
            </g>

            {/* 6. PAKISTANI CLASSIC CD 70 FUEL TANK */}
            <g ref={tankRef}>
              {/* Main Red Slim Tank */}
              <path
                d="M260 112 L355 110 C370 110, 375 125, 365 138 L275 138 C260 138, 250 128, 260 112 Z"
                fill="#dc2626"
                stroke="#b91c1c"
                strokeWidth="2"
              />
              {/* Iconic CD 70 Side Stripe Graphics */}
              <path d="M275 120 L358 118" fill="none" stroke="#fef08a" strokeWidth="3" />
              <path d="M280 126 L352 124" fill="none" stroke="#ffffff" strokeWidth="2" />
              <path d="M288 131 L345 130" fill="none" stroke="#1e293b" strokeWidth="2" />
              {/* Chrome Gas Cap */}
              <rect x="330" y="106" width="12" height="4" rx="1" fill="#cbd5e1" />
            </g>

            {/* 7. LONG FLAT 70cc DUAL SEAT */}
            <path
              ref={seatRef}
              d="M200 126 C220 124, 255 122, 285 122 L285 136 L205 136 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* 8. HANDLEBARS & SPEEDO CONSOLE */}
            <g ref={barsRef}>
              {/* Front Fork Top Assembly */}
              <line x1="390" y1="120" x2="415" y2="85" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
              <line x1="410" y1="92" x2="435" y2="100" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              {/* Square Meter Box */}
              <rect x="402" y="80" width="12" height="10" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
            </g>

            {/* 9. RECTANGULAR/SQUARE 70cc HEADLIGHT */}
            <g ref={headlightRef}>
              <rect x="420" y="118" width="14" height="18" rx="3" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5" />
              <line x1="427" y1="118" x2="427" y2="136" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
            </g>

            {/* 10. CHROME DOWNSWEPT EXHAUST SILENCER */}
            <path
              ref={exhaustRef}
              d="M290 182 L340 188 L180 198"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* 11. FRONT WHEEL ASSEMBLY (Enters Screen First from Left) */}
            <g ref={frontWheelRef} transform="translate(410, 190)">
              {/* Front Telescopic Forks */}
              <line x1="0" y1="0" x2="-20" y2="-70" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
              <line x1="0" y1="0" x2="-20" y2="-70" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
              {/* Front Mudguard */}
              <path d="M-28 -25 C-25 -50, 5 -50, 18 -30" fill="none" stroke="#dc2626" strokeWidth="3.5" />

              {/* Front Wheel Spin Container */}
              <g ref={frontWheelSpinRef}>
                <circle r="46" fill="none" stroke="#0f172a" strokeWidth="8" />
                <circle r="46" fill="none" stroke="#94a3b8" strokeWidth="2" />
                <circle r="7" fill="#cbd5e1" />
                {[...Array(12)].map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={40 * Math.cos((i * 30 * Math.PI) / 180)}
                    y2={40 * Math.sin((i * 30 * Math.PI) / 180)}
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            </g>
          </g>

          {/* ASSEMBLED BADGE */}
          <g ref={badgeRef} transform="translate(350, 275)">
            <rect x="-85" y="-16" width="170" height="32" rx="16" fill="#dc2626" stroke="#fca5a5" strokeWidth="2" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#ffffff"
              letterSpacing="2"
            >
              PAKISTANI 70cc READY
            </text>
          </g>
        </svg>

        <p className="mt-4 text-xs tracking-[0.3em] text-slate-400 uppercase font-mono">
          Assembling 70cc Motorcycle... Launching Login
        </p>
      </div>
    </div>
  );
}