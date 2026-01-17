"use client";

import { useState } from "react";
import { Download, Github, Terminal, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "@/lib/project-types";
import { downloadProjectAsZip } from "@/lib/download";
import { createGitHubRepo } from "@/lib/github";
import { deployToVercel } from "@/lib/vercel";
import { exportForCursor } from "@/lib/cursor";

interface ExportPanelProps {
  files: ProjectFile[];
  projectName?: string;
}

type ExportOption = "zip" | "github" | "vercel" | "cursor" | "copy";

export function ExportPanel({ files, projectName = "project" }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState<ExportOption | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDownloadZip = async () => {
    setIsExporting("zip");
    try {
      await downloadProjectAsZip(files, projectName);
      toast.success("Downloaded ZIP");
    } catch (error) {
      console.error("Failed to download ZIP:", error);
      toast.error("Failed to download ZIP");
    } finally {
      setIsExporting(null);
    }
  };

  const handleGitHub = async () => {
    setIsExporting("github");
    try {
      const result = await createGitHubRepo(files, projectName.toLowerCase().replace(/\s+/g, "-"));
      if (result.success && result.repoUrl) {
        window.open(result.repoUrl, "_blank");
        toast.success("Repository created!");
      } else {
        toast.error(result.error || "Failed to create repository");
      }
    } catch (error) {
      console.error("GitHub error:", error);
      toast.error("Failed to create repository");
    } finally {
      setIsExporting(null);
    }
  };

  const handleVercel = async () => {
    setIsExporting("vercel");
    try {
      const result = await deployToVercel(files, projectName);
      if (result.success && result.deployUrl) {
        window.open(result.deployUrl, "_blank");
        toast.success("Opening Vercel...");
      } else {
        toast.error(result.error || "Failed to deploy");
      }
    } catch (error) {
      console.error("Vercel error:", error);
      toast.error("Failed to deploy to Vercel");
    } finally {
      setIsExporting(null);
    }
  };

  const handleCursor = async () => {
    setIsExporting("cursor");
    try {
      const result = exportForCursor(files, projectName);
      if (result.success) {
        await downloadProjectAsZip(
          result.files.map((f) => ({ path: f.path, content: f.content })),
          `${projectName}-cursor`
        );
        toast.success("Downloaded for Cursor!");
      } else {
        toast.error(result.error || "Failed to export for Cursor");
      }
    } catch (error) {
      console.error("Cursor error:", error);
      toast.error("Failed to export for Cursor");
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopyAll = async () => {
    const allCode = files.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(allCode);
      setCopied(true);
      toast.success("Copied all code");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy code");
    }
  };

  const exportOptions = [
    {
      id: "zip" as ExportOption,
      label: "Download ZIP",
      description: "Download project as ZIP archive",
      icon: Download,
      onClick: handleDownloadZip,
      isLoading: isExporting === "zip",
    },
    {
      id: "github" as ExportOption,
      label: "Push to GitHub",
      description: "Create repository and push code",
      icon: Github,
      onClick: handleGitHub,
      isLoading: isExporting === "github",
    },
    {
      id: "vercel" as ExportOption,
      label: "Deploy to Vercel",
      description: "Deploy with one click",
      icon: ExternalLink,
      onClick: handleVercel,
      isLoading: isExporting === "vercel",
    },
    {
      id: "cursor" as ExportOption,
      label: "Open in Cursor",
      description: "Export for Cursor IDE",
      icon: Terminal,
      onClick: handleCursor,
      isLoading: isExporting === "cursor",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
        <h3 className="font-medium text-sm">Export Options</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {files.length} file{files.length !== 1 ? "s" : ""} • {projectName}
        </p>
      </div>

      {/* Export Options */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-2">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.onClick}
              disabled={option.isLoading}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border border-border/40",
                "bg-background hover:bg-muted/50 transition-colors",
                "text-left disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <option.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {option.description}
                </div>
              </div>
              {option.isLoading && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          ))}
        </div>

        {/* Copy All */}
        <div className="mt-6">
          <button
            onClick={handleCopyAll}
            disabled={copied}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border/40",
              "bg-muted/30 hover:bg-muted/50 transition-colors",
              "text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy all code to clipboard</span>
              </>
            )}
          </button>
        </div>

        {/* File Summary */}
        <div className="mt-6 p-3 bg-muted/20 rounded-lg">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Files included:</h4>
          <div className="space-y-1">
            {files.slice(0, 5).map((file) => (
              <div key={file.path} className="text-xs text-muted-foreground truncate">
                • {file.path}
              </div>
            ))}
            {files.length > 5 && (
              <div className="text-xs text-muted-foreground">
                • And {files.length - 5} more...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
