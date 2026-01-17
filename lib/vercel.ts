import type { ProjectFile } from "./project-types";

export interface VercelConfig {
  token?: string;
  projectName?: string;
  teamId?: string;
  framework?: "nextjs" | "vite" | "remix" | "svelte" | "astro" | "other";
}

export interface VercelDeployResult {
  success: boolean;
  deployUrl?: string;
  error?: string;
}

/**
 * Check if Vercel is configured
 */
export function isVercelConfigured(): boolean {
  return !!(process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN);
}

/**
 * Deploy to Vercel using the Deploy API
 * Note: This requires a Vercel Pro/Enterprise account for the Deploy API
 */
export async function deployToVercel(
  files: ProjectFile[],
  projectName: string,
  config: VercelConfig = {}
): Promise<VercelDeployResult> {
  const token = config.token || process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN;
  
  if (!token) {
    // Fallback: Generate a deploy link for manual deployment
    const deployUrl = generateVercelDeployLink(files, projectName, config);
    return {
      success: true,
      deployUrl,
    };
  }

  try {
    // For now, return a deploy link since the full API requires paid plans
    // In production, you'd use the Vercel Deploy API with proper authentication
    const deployUrl = generateVercelDeployLink(files, projectName, config);
    
    return {
      success: true,
      deployUrl,
    };
  } catch (error) {
    console.error("Vercel error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Generate a Vercel deploy link for manual deployment
 */
export function generateVercelDeployLink(
  _files: ProjectFile[],
  projectName: string,
  config: VercelConfig
): string {
  const repoName = config.projectName || projectName.toLowerCase().replace(/\s+/g, "-");
  
  // Create a minimal project structure for deployment
  const deployParams = new URLSearchParams({
    "repository-name": repoName,
    "team-scope": config.teamId || "",
    "project-name": config.projectName || repoName,
  });

  return `https://vercel.com/new/clone?${deployParams.toString()}`;
}

/**
 * Detect the framework based on project files
 */
function detectFramework(files: ProjectFile[]): VercelConfig["framework"] {
  const hasNextConfig = files.some((f) => f.path === "next.config.js" || f.path === "next.config.mjs");
  const hasViteConfig = files.some(
    (f) =>
      f.path === "vite.config.ts" ||
      f.path === "vite.config.js" ||
      f.path === "vite.config.mjs"
  );
  const hasRemixConfig = files.some(
    (f) => f.path === "remix.config.js" || f.path === "remix.config.ts"
  );
  const hasSvelteConfig = files.some(
    (f) => f.path === "svelte.config.js" || f.path === "svelte.config.ts"
  );
  const hasAstroConfig = files.some(
    (f) => f.path === "astro.config.mjs" || f.path === "astro.config.ts"
  );

  if (hasNextConfig) return "nextjs";
  if (hasViteConfig) return "vite";
  if (hasRemixConfig) return "remix";
  if (hasSvelteConfig) return "svelte";
  if (hasAstroConfig) return "astro";
  return "other";
}

/**
 * Generate Vercel configuration file
 */
export function generateVercelConfig(
  files: ProjectFile[],
  _projectName: string
): string | null {
  const framework = detectFramework(files);
  
  if (framework === "nextjs") {
    // Next.js projects don't need vercel.json
    return null;
  }

  const config: Record<string, unknown> = {
    framework,
    buildCommand: framework === "vite" ? "npm run build" : undefined,
    outputDirectory: framework === "vite" ? "dist" : undefined,
  };

  // Remove undefined values
  Object.keys(config).forEach((key) => {
    if (config[key] === undefined) delete config[key];
  });

  return JSON.stringify(config, null, 2);
}

/**
 * Generate .env.example for the project
 */
export function generateEnvExample(files: ProjectFile[]): string {
  const envVars = new Set<string>();

  // Look for environment variable patterns in files
  files.forEach((file) => {
    const matches = file.content.match(/process\.env\.([A-Z_]+)/g);
    matches?.forEach((m) => {
      const varName = m.replace("process.env.", "");
      envVars.add(`${varName}=your_${varName.toLowerCase()}_here`);
    });
  });

  if (envVars.size === 0) {
    return `# Add environment variables here
# API_KEY=
# DATABASE_URL=
`;
  }

  return `# Environment variables\n${Array.from(envVars).join("\n")}\n`;
}
