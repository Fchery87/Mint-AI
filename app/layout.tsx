import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PlanBuildProvider } from "@/lib/contexts/PlanBuildContext";
import { SentryErrorBoundaryWrapper } from "@/components/SentryErrorBoundaryWrapper";

// IDE Typography System
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mint AI",
  description: "AI-powered code editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <PlanBuildProvider>
              <SentryErrorBoundaryWrapper>
                {children}
              </SentryErrorBoundaryWrapper>
            </PlanBuildProvider>
          </ConvexClientProvider>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: "bg-card text-foreground border border-border",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
