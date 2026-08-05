"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Oswald, Space_Mono } from "next/font/google";
import gsap from "gsap";
import BikeIntro from "./BikeIntro";

// Display face: condensed, bold, poster/stencil energy — reads like a
// vintage workshop sign. Body/labels: Space Mono, for a speedometer /
// gauge-readout feel.
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const cardRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (introDone && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 28, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "power3.out" }
      );
    }
  }, [introDone]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      localStorage.setItem("authToken", data.token);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const error =
        err instanceof Error ? err.message : "Unexpected error";
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      className={`${oswald.variable} ${spaceMono.variable} relative flex min-h-screen items-center justify-center overflow-hidden px-4`}
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #f4ecd8 0%, #e8dcc0 55%, #ddcda3 100%)",
      }}
    >
      {/* pegboard texture, consistent with the intro */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(#241c15 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {!introDone && <BikeIntro onDone={() => setIntroDone(true)} />}

      <div
        ref={cardRef}
        className="relative w-full max-w-md"
        style={{ opacity: introDone ? undefined : 0, fontFamily: "var(--font-mono)" }}
      >
        {/* riveted workshop plate card */}
        <div
          className="relative rounded-[22px] border-[3px] shadow-[0_18px_40px_-12px_rgba(36,28,21,0.45)]"
          style={{ borderColor: "#241c15", background: "#f4ecd8" }}
        >
          {/* racing stripe header band */}
          <div className="flex h-3 overflow-hidden rounded-t-[19px]">
            <div className="flex-1" style={{ background: "#1f5c56" }} />
            <div className="w-3" style={{ background: "#f4ecd8" }} />
            <div className="flex-1" style={{ background: "#b5451b" }} />
            <div className="w-3" style={{ background: "#f4ecd8" }} />
            <div className="flex-1" style={{ background: "#d8a33d" }} />
          </div>

          {/* corner rivets */}
          {[
            { top: "20px", left: "16px" },
            { top: "20px", right: "16px" },
          ].map((pos, i) => (
            <span
              key={i}
              className="absolute h-2.5 w-2.5 rounded-full"
              style={{
                ...pos,
                background: "#9aa0a6",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.4)",
              }}
            />
          ))}

          <div className="px-8 pb-9 pt-8">
            {/* emblem */}
            <div className="mb-5 flex justify-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-[3px]"
                style={{ borderColor: "#241c15", background: "#1f5c56" }}
              >
                <svg viewBox="0 0 40 40" className="h-8 w-8">
                  <circle cx="12" cy="26" r="8" fill="none" stroke="#f4ecd8" strokeWidth="2.5" />
                  <circle cx="28" cy="26" r="8" fill="none" stroke="#f4ecd8" strokeWidth="2.5" />
                  <path
                    d="M12 26 L20 14 L28 26 M17 14 L23 14"
                    fill="none" stroke="#f4ecd8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h1
              className="text-center text-[28px] font-semibold uppercase leading-tight"
              style={{ fontFamily: "var(--font-display)", color: "#241c15", letterSpacing: "0.04em" }}
            >
              Ammar Autos
            </h1>
            <p
              className="mt-1 text-center text-[11px] font-bold uppercase"
              style={{ color: "#b5451b", letterSpacing: "0.35em" }}
            >
              Point of Sale
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label
                  className="block text-[11px] font-bold uppercase"
                  style={{ color: "#6b5a3f", letterSpacing: "0.2em" }}
                >
                  Rider ID
                </label>
                <input
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mt-2 w-full border-0 border-b-2 bg-transparent pb-2 text-[15px] outline-none transition-colors placeholder:text-[#a99a7c] focus:border-[#b5451b]"
                  style={{ borderColor: "#241c15", color: "#241c15" }}
                />
              </div>

              <div>
                <label
                  className="block text-[11px] font-bold uppercase"
                  style={{ color: "#6b5a3f", letterSpacing: "0.2em" }}
                >
                  Ignition Key
                </label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border-0 border-b-2 bg-transparent pb-2 pr-8 text-[15px] outline-none transition-colors placeholder:text-[#a99a7c] focus:border-[#b5451b]"
                    style={{ borderColor: "#241c15", color: "#241c15" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0"
                    style={{ color: "#6b5a3f" }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold uppercase text-[#f4ecd8] transition-transform active:scale-[0.98] disabled:opacity-70"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.15em",
                  background: "linear-gradient(180deg, #c1521f 0%, #a3390f 100%)",
                  boxShadow: "0 6px 0 #6e2408, 0 8px 14px rgba(36,28,21,0.35)",
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Kick-Start"}
              </button>

              {error && (
                <p
                  className="text-center text-xs font-bold uppercase"
                  style={{ color: "#a3390f", letterSpacing: "0.1em" }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        <p
          className="mt-4 text-center text-[10px] font-bold uppercase"
          style={{ color: "#8a7959", letterSpacing: "0.3em" }}
        >
          Est. Garage Systems
        </p>
      </div>
    </div>
  );
}