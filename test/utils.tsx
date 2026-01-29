import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PlanBuildProvider } from "@/lib/contexts/PlanBuildContext";
import { TerminalProvider } from "@/components/terminal/TerminalProvider";

/**
 * Mock providers for testing
 * These wrap children without actual external connections
 */

// Mock Theme Provider - uses dark theme by default for tests
function MockThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

// Mock Convex Provider - renders children without actual Convex connection
function MockConvexProvider({ children }: { children: React.ReactNode }) {
  // In test environment, we don't have a real Convex client
  // The ConvexClientProvider handles null client gracefully
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}

// Mock PlanBuild Provider
function MockPlanBuildProvider({ children }: { children: React.ReactNode }) {
  return <PlanBuildProvider>{children}</PlanBuildProvider>;
}

// Mock Terminal Provider
function MockTerminalProvider({ children }: { children: React.ReactNode }) {
  return <TerminalProvider>{children}</TerminalProvider>;
}

/**
 * Combined provider wrapper that includes all app providers
 * Mirrors the provider hierarchy in app/layout.tsx
 */
export function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MockThemeProvider>
      <MockConvexProvider>
        <MockPlanBuildProvider>
          <MockTerminalProvider>{children}</MockTerminalProvider>
        </MockPlanBuildProvider>
      </MockConvexProvider>
    </MockThemeProvider>
  );
}

/**
 * Options for renderWithProviders
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Whether to include all providers (Theme, Convex, PlanBuild, Terminal)
   * @default true
   */
  withAllProviders?: boolean;
  /**
   * Include only specific providers
   */
  providers?: {
    theme?: boolean;
    convex?: boolean;
    planBuild?: boolean;
    terminal?: boolean;
  };
}

/**
 * Custom render function that wraps components with necessary providers
 *
 * @example
 * // Basic usage with all providers
 * renderWithProviders(<MyComponent />);
 *
 * // With specific providers only
 * renderWithProviders(<MyComponent />, {
 *   providers: { theme: true, planBuild: true }
 * });
 *
 * // Without any providers
 * renderWithProviders(<MyComponent />, { withAllProviders: false });
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { withAllProviders = true, providers, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    // If no providers requested, return children as-is
    if (!withAllProviders && !providers) {
      return <>{children}</>;
    }

    // If specific providers are specified, use those
    if (providers) {
      let wrapped = <>{children}</>;

      if (providers.terminal) {
        wrapped = <MockTerminalProvider>{wrapped}</MockTerminalProvider>;
      }
      if (providers.planBuild) {
        wrapped = <MockPlanBuildProvider>{wrapped}</MockPlanBuildProvider>;
      }
      if (providers.convex) {
        wrapped = <MockConvexProvider>{wrapped}</MockConvexProvider>;
      }
      if (providers.theme) {
        wrapped = <MockThemeProvider>{wrapped}</MockThemeProvider>;
      }

      return wrapped;
    }

    // Default: wrap with all providers
    return <AllProviders>{children}</AllProviders>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Helper to create a mock Convex context value
 * Useful for testing components that depend on Convex hooks
 */
export function createMockConvexContext(overrides = {}) {
  return {
    queries: {},
    mutations: {},
    actions: {},
    ...overrides,
  };
}

/**
 * Helper to wait for async operations in tests
 * Useful for testing async components or hooks
 */
export async function waitForAsync(
  callback: () => void,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      lastError = error as Error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  throw lastError || new Error("Timeout waiting for condition");
}

/**
 * Helper to create mock plan build state
 * Useful for testing plan/build related components
 */
export function createMockPlanBuildState(overrides = {}) {
  return {
    mode: "plan" as const,
    currentPlan: null,
    planHistory: [],
    isPlanEditable: true,
    canStartBuild: false,
    isBuilding: false,
    isPaused: false,
    currentStep: null,
    statusLabel: "Ready to plan",
    hasUnansweredQuestions: false,
    ...overrides,
  };
}

/**
 * Helper to create mock terminal session
 * Useful for testing terminal-related components
 */
export function createMockTerminalSession(overrides = {}) {
  return {
    id: "test-session",
    name: "Test Terminal",
    cwd: "/home/test",
    ptyId: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

/**
 * Re-export testing-library utilities for convenience
 */
export { render, screen, waitFor, fireEvent } from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
export { vi, expect, describe, it, beforeEach, afterEach } from "vitest";
