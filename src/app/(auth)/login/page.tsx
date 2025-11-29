"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

enum ModeEnum {
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  RESET = "RESET",
}

// Loading fallback component
function LoginPageSkeleton() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="w-full max-w-md p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-700 rounded-lg w-3/4 mx-auto" />
          <div className="h-10 bg-gray-700 rounded-lg" />
          <div className="h-10 bg-gray-700 rounded-lg" />
          <div className="h-10 bg-gray-700 rounded-lg w-1/2" />
        </div>
      </div>
    </div>
  );
}

function LoginPageContent() {
  const [mode, setMode] = useState<ModeEnum>(ModeEnum.LOGIN);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Memoizar handlers
  const handleSuccess = useCallback(() => {
    const redirectTo = searchParams.get("redirect") || "/";
    router.replace(redirectTo);
  }, [searchParams, router]);

  const handleRegisterSuccess = useCallback(() => {
    setMode(ModeEnum.LOGIN);
  }, []);

  const switchMode = useCallback((newMode: ModeEnum) => {
    setMode(newMode);
  }, []);

  const handleForgotPassword = useCallback(() => {
    setMode(ModeEnum.RESET);
  }, []);

  const handleResetSuccess = useCallback(() => {
    setMode(ModeEnum.LOGIN);
  }, []);

  const handleBackToLogin = useCallback(() => {
    setMode(ModeEnum.LOGIN);
  }, []);

  return (
    <div
      className="relative flex justify-center items-center min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 800px at 10% -10%, rgba(56,189,248,0.18), transparent 60%), " +
          "radial-gradient(900px 700px at 90% 0%, rgba(167,139,250,0.16), transparent 55%), " +
          "radial-gradient(700px 500px at 50% 110%, rgba(248,113,113,0.12), transparent 50%), " +
          "linear-gradient(180deg, #0b0f1a 0%, #0a0a0a 100%)",
      }}
    >
      {/* Grid pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-[42rem] w-[42rem] rounded-full blur-3xl opacity-0 animate-fade-in"
        style={{
          background:
            "radial-gradient(closest-side, rgba(56,189,248,0.35), transparent)",
          animationDelay: "0.1s",
          animationFillMode: "forwards",
        }}
      />
      
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-[36rem] w-[36rem] rounded-full blur-3xl opacity-0 animate-fade-in"
        style={{
          background:
            "radial-gradient(closest-side, rgba(167,139,250,0.32), transparent)",
          animationDelay: "0.2s",
          animationFillMode: "forwards",
        }}
      />
      
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-0 animate-fade-in"
        style={{
          background:
            "radial-gradient(closest-side, rgba(248,113,113,0.22), transparent)",
          animationDelay: "0.3s",
          animationFillMode: "forwards",
        }}
      />

      {/* Form container with fade transition */}
      <div className="relative z-10 w-full max-w-md px-4">
        {mode === ModeEnum.LOGIN && (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => switchMode(ModeEnum.REGISTER)}
            onForgotPassword={handleForgotPassword}
          />
        )}
        
        {mode === ModeEnum.REGISTER && (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => switchMode(ModeEnum.LOGIN)}
          />
        )}
        
        {mode === ModeEnum.RESET && (
          <ResetPasswordForm
            onBack={handleBackToLogin}
            onSuccess={handleResetSuccess}
          />
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

// Agregar estilos de animación en tu CSS global o tailwind.config.js
// @keyframes fade-in {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// .animate-fade-in {
//   animation: fade-in 1s ease-out;
// }
