
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import GlobalClientEffects from "@/components/GlobalClientEffects";
import { getEnvironmentInfo } from "@/lib/environment";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema Minimarket",
  description: "Sistema integral de gestión para minimarket con módulos por rol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Log environment info in development
  if (typeof window === 'undefined') {
    const envInfo = getEnvironmentInfo();
    console.log('[Environment Info]', envInfo);
  }

  const content = (
    <>
      {children}
      <Toaster />
    </>
  );

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{content}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
