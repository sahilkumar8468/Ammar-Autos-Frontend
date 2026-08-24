"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * BikeIntro — Authentic Pakistani 70cc (CD 70 Style) Assembly Animation
 *
 * Sequence:
 * 1. Road Ground line draws smoothly.
 * 2. Front & Rear Wheels roll into exact symmetrical positions (left & right hubs).
 * 3. Main Frame & Front Fork drop down and lock directly onto wheel axles.
 * 4. Engine, Exhaust, Fuel Tank, Seat, Handlebars, and Headlight assemble seamlessly.
 * 5. Settles with realistic suspension bounce, badge pops, and transitions cleanly to onDone().
 */
export default function BikeIntro({ onDone }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  // Pre-compute spoke coordinates for 12 spoke pairs (36 visual spokes representation)
  const spokes = [...Array(12)].map((_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    return {
      x2: (40 * Math.cos(angle)).toFixed(4),
      y2: (40 * Math.sin(angle)).toFixed(4),
    };
  });

  // Bike Component Refs
  const frontWheelRef = useRef(null);
  const frontWheelSpinRef = useRef(null);
  const rearWheelRef = useRef(null);
  const rearWheelSpinRef = useRef(null);

  const frameRef = useRef(null);
  const forkRef = useRef(null);
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
      // INITIAL HIDDEN & OFFSET STATES
      // ----------------------------------------------------
      // Ground line hidden
      gsap.set(groundRef.current, { scaleX: 0, transformOrigin: "0% 50%" });

      // Front wheel starts off-screen left and rolls into position (x: 470)
      gsap.set(frontWheelRef.current, { x: -500, opacity: 1 });

      // Rear wheel starts off-screen left behind front wheel and rolls to (x: 230)
      gsap.set(rearWheelRef.current, { x: -350, opacity: 0 });

      // Body parts are offset vertically/horizontally and ready to snap into place
      gsap.set(frameRef.current, { opacity: 0, y: -50 });
      gsap.set(forkRef.current, { opacity: 0, y: -45, rotate: -15, transformOrigin: "0% 100%" });
      gsap.set(engineRef.current, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" });
      gsap.set(tankRef.current, { opacity: 0, y: -40, scale: 0.8, transformOrigin: "50% 100%" });
      gsap.set(seatRef.current, { opacity: 0, y: -30 });
      gsap.set(barsRef.current, { opacity: 0, y: -35, rotate: -20, transformOrigin: "0% 100%" });
      gsap.set(headlightRef.current, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });
      gsap.set(sideCoverRef.current, { opacity: 0, scale: 0.5 });
      gsap.set(rearFenderRef.current, { opacity: 0, x: -25 });
      gsap.set(exhaustRef.current, { opacity: 0, x: -30 });
      gsap.set(badgeRef.current, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });

      // ----------------------------------------------------
      // MASTER TIMELINE
      // ----------------------------------------------------
      const tl = gsap.timeline({
        onComplete: () => {
          // Transition intro out to reveal login
          gsap.to(sceneRef.current, {
            opacity: 0,
            y: -15,
            scale: 0.98,
            duration: 0.45,
            ease: "power2.inOut",
            onComplete: onDone,
          });
        },
      });

      // 1. Draw Road Ground Line
      tl.to(groundRef.current, { scaleX: 1, duration: 1.0, ease: "power1.out" }, 0);

      // 2. Both Tyres Roll from Left to exact bike wheelbase positions
      // Front wheel rolls to front axle position (x: 0 offset from hub 470)
      tl.to(frontWheelRef.current, { x: 0, duration: 1.3, ease: "power2.out" }, 0.1);
      tl.to(
        frontWheelSpinRef.current,
        { rotate: 720, duration: 1.3, ease: "power2.out", transformOrigin: "50% 50%" },
        0.1
      );

      // Rear wheel rolls in with opacity and settles at rear axle position (x: 0 offset from hub 230)
      tl.to(
        rearWheelRef.current,
        { opacity: 1, x: 0, duration: 1.1, ease: "power2.out" },
        0.3
      );
      tl.to(
        rearWheelSpinRef.current,
        { rotate: 540, duration: 1.1, ease: "power2.out", transformOrigin: "50% 50%" },
        0.3
      );

      // 3. ASSEMBLY STAGE (Right when wheels lock in place)
      const assembleTime = 1.35;

      // Front Forks lock onto Front Wheel Axle
      tl.to(forkRef.current, { opacity: 1, y: 0, rotate: 0, duration: 0.25, ease: "back.out(2)" }, assembleTime);

      // Main Spine Frame & Swingarm attach both axles together
      tl.to(frameRef.current, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, assembleTime + 0.12);

      // 70cc Horizontal Engine Block snaps into chassis cradle
      tl.to(engineRef.current, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.2)" }, assembleTime + 0.24);

      // Chrome Downswept Silencer / Exhaust attaches to engine
      tl.to(exhaustRef.current, { opacity: 1, x: 0, duration: 0.22, ease: "back.out(1.8)" }, assembleTime + 0.35);

      // Pakistani Red CD 70 Fuel Tank drops on frame
      tl.to(tankRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "back.out(2)" }, assembleTime + 0.45);

      // Side Covers & Rear Fender attach
      tl.to(sideCoverRef.current, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2)" }, assembleTime + 0.55);
      tl.to(rearFenderRef.current, { opacity: 1, x: 0, duration: 0.2, ease: "power2.out" }, assembleTime + 0.6);

      // Long Flat Dual Seat snaps on top
      tl.to(seatRef.current, { opacity: 1, y: 0, duration: 0.22, ease: "back.out(2)" }, assembleTime + 0.68);

      // Handlebars & Speedo Console lock onto forks
      tl.to(barsRef.current, { opacity: 1, y: 0, rotate: 0, duration: 0.25, ease: "back.out(2)" }, assembleTime + 0.76);

      // Classic Square Headlight pops on
      tl.to(headlightRef.current, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2.5)" }, assembleTime + 0.86);

      // Glowing Badge Pop
      tl.to(badgeRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, assembleTime + 1.0);

      // Realistic Kickstand / Suspension bounce before revealing POS
      tl.to(sceneRef.current, { y: -6, duration: 0.1, ease: "power1.out" }, assembleTime + 1.15)
        .to(sceneRef.current, { y: 0, duration: 0.2, ease: "bounce.out" })
        .to({}, { duration: 0.45 });
    }, containerRef);

    return () => ctx.revert();
  }, [onDone]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950 text-slate-100 select-none"
    >
      {/* Radial Spotlight Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.14)_0%,_transparent_72%)]" />

      <div ref={sceneRef} className="relative w-[92vw] max-w-[700px] flex flex-col items-center">
        <svg viewBox="0 0 700 320" className="w-full h-auto overflow-visible">
          {/* Ground Road Line */}
          <line
            ref={groundRef}
            x1="40"
            y1="240"
            x2="660"
            y2="240"
            stroke="#dc2626"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* ==================== 70cc MOTORCYCLE ASSEMBLY ==================== */}
          <g>
            {/* 1. REAR WHEEL (Hub at x=230, y=194) */}
            <g ref={rearWheelRef} transform="translate(230, 194)">
              <g ref={rearWheelSpinRef}>
                {/* 17-inch Outer Tyre (radius 46 touches ground y=240) */}
                <circle r="46" fill="none" stroke="#0f172a" strokeWidth="8" />
                <circle r="46" fill="none" stroke="#94a3b8" strokeWidth="2" />
                <circle r="7" fill="#cbd5e1" />
                {/* Spokes */}
                {spokes.map((s, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={s.x2}
                    y2={s.y2}
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
                d="M195 194 C198 152, 235 145, 270 156"
                fill="none"
                stroke="#64748b"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Tail Light */}
              <rect x="188" y="180" width="8" height="13" rx="2" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
            </g>

            {/* 3. MAIN UNDERBONE FRAME & SWINGARM */}
            <g ref={frameRef}>
              {/* Rear Swingarm connecting rear axle (230,194) to pivot (310,185) */}
              <line x1="230" y1="194" x2="310" y2="185" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              {/* Rear Shock Absorber */}
              <line x1="250" y1="190" x2="275" y2="140" stroke="#cbd5e1" strokeWidth="4" />
              <line x1="250" y1="190" x2="275" y2="140" stroke="#dc2626" strokeWidth="2" strokeDasharray="3,2" />
              {/* Main Underbone Spine Frame */}
              <path
                d="M290 185 L340 148 L445 118"
                fill="none"
                stroke="#0f172a"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* 4. 70cc HORIZONTAL ENGINE BLOCK */}
            <g ref={engineRef} transform="translate(305, 162)">
              {/* Crankcase */}
              <rect x="0" y="5" width="46" height="34" rx="6" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Horizontal 70cc Forward Cylinder Head */}
              <rect x="42" y="10" width="32" height="24" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Cooling Fins */}
              <line x1="48" y1="8" x2="48" y2="36" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="56" y1="8" x2="56" y2="36" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="64" y1="8" x2="64" y2="36" stroke="#94a3b8" strokeWidth="1.5" />
              {/* CD 70 Magneto Cover */}
              <circle cx="21" cy="22" r="11" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Kick Starter Lever */}
              <path d="M10 28 L-6 36 L-9 33" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* 5. SIDE TOOLBOX COVER (70 BADGE) */}
            <g ref={sideCoverRef} transform="translate(310, 140)">
              <polygon points="0,0 48,0 38,28 5,28" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
              <text x="24" y="18" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                70
              </text>
            </g>

            {/* 6. CHROME DOWNSWEPT EXHAUST SILENCER */}
            <g ref={exhaustRef}>
              <path
                d="M365 182 L360 204 L235 204"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Exhaust Chrome Heat Shield Tip */}
              <line x1="285" y1="204" x2="235" y2="204" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
            </g>

            {/* 7. CLASSIC RED CD 70 FUEL TANK */}
            <g ref={tankRef}>
              {/* Main Red Slim Tank */}
              <path
                d="M320 114 L415 112 C430 112, 435 128, 425 140 L335 140 C320 140, 310 130, 320 114 Z"
                fill="#dc2626"
                stroke="#b91c1c"
                strokeWidth="2"
              />
              {/* Iconic CD 70 Side Graphics */}
              <path d="M335 122 L418 120" fill="none" stroke="#fef08a" strokeWidth="3" />
              <path d="M340 128 L412 126" fill="none" stroke="#ffffff" strokeWidth="2" />
              <path d="M348 133 L405 132" fill="none" stroke="#1e293b" strokeWidth="2" />
              {/* Chrome Gas Cap */}
              <rect x="390" y="108" width="12" height="4" rx="1" fill="#cbd5e1" />
            </g>

            {/* 8. LONG FLAT DUAL SEAT */}
            <path
              ref={seatRef}
              d="M255 126 C280 124, 315 122, 345 122 L345 137 L260 137 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* 9. FRONT TELESCOPIC FORK & MUDGUARD */}
            <g ref={forkRef}>
              {/* Front Fork Legs (connecting triple clamp at (445,115) down to front hub (470,194)) */}
              <line x1="445" y1="115" x2="470" y2="194" stroke="#0f172a" strokeWidth="7.5" strokeLinecap="round" />
              <line x1="445" y1="115" x2="470" y2="194" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
              {/* Front Red Mudguard */}
              <path d="M442 168 C446 142, 478 142, 492 165" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* 10. HANDLEBARS & SPEEDO CONSOLE */}
            <g ref={barsRef}>
              <line x1="445" y1="115" x2="465" y2="82" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
              <line x1="460" y1="88" x2="485" y2="96" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              {/* Square Speedometer */}
              <rect x="452" y="78" width="13" height="10" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.2" />
            </g>

            {/* 11. CLASSIC 70cc RECTANGULAR HEADLIGHT */}
            <g ref={headlightRef}>
              <rect x="472" y="112" width="14" height="18" rx="3" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5" />
              <line x1="479" y1="112" x2="479" y2="130" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
            </g>

            {/* 12. FRONT WHEEL (Hub at x=470, y=194) */}
            <g ref={frontWheelRef} transform="translate(470, 194)">
              <g ref={frontWheelSpinRef}>
                <circle r="46" fill="none" stroke="#0f172a" strokeWidth="8" />
                <circle r="46" fill="none" stroke="#94a3b8" strokeWidth="2" />
                <circle r="7" fill="#cbd5e1" />
                {spokes.map((s, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={s.x2}
                    y2={s.y2}
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            </g>
          </g>

          {/* ASSEMBLED READY BADGE */}
          <g ref={badgeRef} transform="translate(350, 280)">
            <rect x="-95" y="-16" width="190" height="32" rx="16" fill="#dc2626" stroke="#fca5a5" strokeWidth="2" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fontSize="11"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="2"
              fontFamily="sans-serif"
            >
              AMMAR AUTOS READY
            </text>
          </g>
        </svg>

        <p className="mt-4 text-xs tracking-[0.3em] text-slate-400 uppercase font-mono font-bold">
          Assembling 70cc Motorcycle... Launching System
        </p>
      </div>
    </div>
  );
}