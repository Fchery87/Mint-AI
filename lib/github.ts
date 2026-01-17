import type { ProjectFile } from "./project-types";

export interface GitHubConfig {
  token?: string;
  owner?: string;
  repo?: string;
  isPrivate?: boolean;
  description?: string;
}

export interface GitHubRepoResult {
  success: boolean;
  repoUrl?: string;
  error?: string;
}

/**
 * Check if GitHub is configured
 */
export function isGitHubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN;
}

/**
 * Create a GitHub repository and upload files
 * Requires GITHUB_TOKEN environment variable
 */
export async function createGitHubRepo(
  files: ProjectFile[],
  name: string,
  config: GitHubConfig = {}
): Promise<GitHubRepoResult> {
  const token = config.token || process.env.GITHUB_TOKEN;
  
  if (!token) {
    return {
      success: false,
      error: "GitHub token not configured. Set GITHUB_TOKEN environment variable.",
    };
  }

  const owner = config.owner || await getAuthenticatedUser(token);
  if (!owner) {
    return {
      success: false,
      error: "Failed to get authenticated user",
    };
  }

  try {
    // Step 1: Create repository
    const createResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: config.description || `Generated with Mint AI`,
        private: config.isPrivate || false,
        auto_init: false,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      // Repo might already exist
      if (error.message?.includes("already exists")) {
        // Continue to upload files to existing repo
      } else {
        return {
          success: false,
          error: error.message || "Failed to create repository",
        };
      }
    }

    // Step 2: Get default branch
    const repoInfo = await fetch(
      `https://api.github.com/repos/${owner}/${name}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    ).then((r) => r.json());

    const defaultBranch = repoInfo.default_branch || "main";

    // Step 3: Create a commit with all files using the Trees API
    // First, create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const blobResponse = await fetch(
          `https://api.github.com/repos/${owner}/${name}/git/blobs`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: file.content,
              encoding: "utf-8",
            }),
          }
        );
        const blob = await blobResponse.json();
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      })
    );

    // Create tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${name}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_tree: undefined, // Start fresh
          tree: blobs,
        }),
      }
    );
    const tree = await treeResponse.json();

    // Create commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${name}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Initial commit from Mint AI",
          tree: tree.sha,
        }),
      }
    );
    const commit = await commitResponse.json();

    // Update ref
    await fetch(
      `https://api.github.com/repos/${owner}/${name}/git/refs/heads/${defaultBranch}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sha: commit.sha,
          force: true,
        }),
      }
    );

    return {
      success: true,
      repoUrl: `https://github.com/${owner}/${name}`,
    };
  } catch (error) {
    console.error("GitHub error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get authenticated user from GitHub API
 */
async function getAuthenticatedUser(token: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const user = await response.json();
    return user.login || null;
  } catch {
    return null;
  }
}

/**
 * Generate .gitignore content based on project files
 */
export function generateGitignore(files: ProjectFile[]): string {
  const languages = new Set(files.map((f) => f.language));
  
  let ignoreContent = `# Generated by Mint AI
node_modules/
dist/
build/
.next/
.env
.env.local
*.log
.DS_Store
`;

  if (languages.has("python") || languages.has("py")) {
    ignoreContent += `
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
.venv/
`;
  }

  if (languages.has("rust") || languages.has("rs")) {
    ignoreContent += `
# Rust
target/
Cargo.lock
**/*.rs.bk
`;
  }

  if (languages.has("java")) {
    ignoreContent += `
# Java
*.class
*.jar
*.war
.gradle/
build/
`;
  }

  return ignoreContent;
}

/**
 * Generate README.md content
 */
export function generateReadme(projectName: string, files: ProjectFile[]): string {
  return `# ${projectName}

Generated with [Mint AI](https://mint-ai.app)

## Files

${files.map((f) => `- \`${f.path}\``).join("\n")}

## Getting Started

${
  files.some((f) => f.language === "typescript" || f.language === "tsx")
    ? "```bash\nnpm install\nnpm run dev\n```"
    : files.some((f) => f.language === "python")
    ? "```bash\npip install -r requirements.txt\npython main.py\n```"
    : "See individual file instructions."
}

## License

MIT
`;
}

/**
 * Generate package.json for Node.js projects
 */
export function generatePackageJson(
  projectName: string,
  files: ProjectFile[]
): string | null {
  const hasPackageJson = files.some((f) => f.path === "package.json");
  if (hasPackageJson) return null;

  const hasTsx = files.some(
    (f) => f.language === "typescript" || f.language === "tsx"
  );
  const hasJs = files.some(
    (f) => f.language === "javascript" || f.language === "js"
  );

  if (!hasTsx && !hasJs) return null;

  return JSON.stringify(
    {
      name: projectName.toLowerCase().replace(/\s+/g, "-"),
      version: "1.0.0",
      private: true,
      scripts: {
        dev: hasTsx ? "vite" : "vite",
        build: hasTsx ? "tsc && vite build" : "vite build",
        preview: "vite preview",
      },
      devDependencies: hasTsx
        ? {
            typescript: "^5.0.0",
            vite: "^5.0.0",
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0",
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "@vitejs/plugin-react": "^4.2.0",
          }
        : {
            vite: "^5.0.0",
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
    },
    null,
    2
  );
}
