"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm }             from "react-hook-form";
import { zodResolver }         from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginSchema }         from "@/lib/validators";
import { useAuth }             from "@/hooks/useAuth";
import type { LoginPayload }   from "@/types";

// ─────────────────────────────────────────────────────────────

function LoginForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirect = searchParams.get("redirect") || "/dashboard";

  // Already logged in → redirect immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, authLoading, router, redirect]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    resolver: zodResolver(LoginSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginPayload) => {
    setIsSubmitting(true);
    setServerError(null);
    const res = await login(data);
    if (res.success) {
      router.replace(redirect);
    } else {
      setServerError(res.error ?? "Invalid username or password.");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f3460]">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#0f3460]">

      {/* ── Left panel — branding ──────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative p-12 overflow-hidden">

        {/* Diagonal texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px)",
          }}
        />

        {/* Geometric accent circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute top-24 right-12 w-32 h-32 rounded-full border border-white/10" />
        <div className="absolute -top-16 right-32 w-48 h-48 rounded-full bg-[#e94560]/10" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#e94560] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#e94560]/40">
            G
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-tight leading-tight">GIP System</p>
            <p className="text-white/40 text-[11px] font-medium tracking-widest uppercase">
              {process.env.NEXT_PUBLIC_PROVINCE ?? "Provincial Government"}
            </p>
          </div>
        </div>

        {/* Center tagline */}
        <div className="relative">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.25em] mb-4">
            Government Internship Program
          </p>
          <h2 className="text-white font-black text-4xl leading-[1.1] tracking-tight mb-6"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            Empowering<br />
            Youth.<br />
            <span className="text-[#e94560]">Building</span><br />
            Communities.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            A unified system for managing GIP applicants, documents,
            and program deployment across municipalities.
          </p>
        </div>

        {/* Bottom stats row */}
        <div className="relative flex gap-8">
          {[
            { label: "Municipalities", value: "6" },
            { label: "Sectors",        value: "9" },
            { label: "Documents",      value: "7" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-white font-black text-2xl leading-tight"
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                {s.value}
              </p>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — login form ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[#f7f8fc] p-6 lg:rounded-l-3xl">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#0f3460] flex items-center justify-center text-white font-black text-lg">
              G
            </div>
            <div>
              <p className="text-[#1a1a2e] font-black text-base">GIP System</p>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest">
                {process.env.NEXT_PUBLIC_PROVINCE ?? "Provincial Government"}
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-black text-[#1a1a2e] mb-1 tracking-tight">
            Sign in
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Enter your admin credentials to continue.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-[#1a1a2e] uppercase tracking-widest mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="Enter username"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-[#1a1a2e] bg-white
                  placeholder:text-gray-300 transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]
                  ${errors.username ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#1a1a2e] uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-[#1a1a2e] bg-white
                  placeholder:text-gray-300 transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-[#0f3460]/20 focus:border-[#0f3460]
                  ${errors.password ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <span className="text-red-500 text-base flex-shrink-0">⚠</span>
                <p className="text-xs text-red-700 font-medium">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#0f3460] text-white text-sm font-bold rounded-xl
                hover:bg-[#16213e] active:scale-[0.99] transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-[#0f3460]/30 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed
                shadow-lg shadow-[#0f3460]/20 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center">
              For account issues, contact your system administrator.
            </p>
            <p className="text-[11px] text-gray-300 text-center mt-1 font-mono">
              GIP System · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page export (wraps in Suspense for useSearchParams) ───────

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0f3460]">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
