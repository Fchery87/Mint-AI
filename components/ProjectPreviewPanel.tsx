"use client";

import { useState, useEffect } from "react";
import { Download, Copy, Check, FolderTree, FileCode, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import FileTree from "./FileTree";
import { downloadProjectAsZip } from "@/lib/download";
import type { ProjectFile, FileTreeNode } from "@/lib/project-types";
import { buildFileTree } from "@/lib/project-types";

interface ProjectPreviewPanelProps {
  files: ProjectFile[];
  projectName?: string;
  isStreaming?: boolean;
}

// Custom themes
const customDarkTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "transparent",
    margin: 0,
    padding: 0,
    fontSize: "13px",
    lineHeight: "1.6",
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
    fontSize: "13px",
    lineHeight: "1.6",
  },
};

const customLightTheme = {
  ...oneLight,
  'pre[class*="language-"]': {
    ...oneLight['pre[class*="language-"]'],
    background: "transparent",
    margin: 0,
    padding: 0,
    fontSize: "13px",
    lineHeight: "1.6",
  },
  'code[class*="language-"]': {
    ...oneLight['code[class*="language-"]'],
    background: "transparent",
    fontSize: "13px",
    lineHeight: "1.6",
  },
};

export default function ProjectPreviewPanel({
  files,
  projectName = "project",
  isStreaming = false,
}: ProjectPreviewPanelProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [treeNodes, setTreeNodes] = useState<FileTreeNode[]>([]);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build tree when files change
  useEffect(() => {
    if (files.length > 0) {
      setTreeNodes(buildFileTree(files));
      // Select first file by default
      if (!selectedPath && files.length > 0) {
        setSelectedPath(files[0].path);
      }
    }
  }, [files, selectedPath]);

  const selectedFile = files.find((f) => f.path === selectedPath);
  const isDark = mounted && resolvedTheme === "dark";

  const handleCopy = async () => {
    if (!selectedFile) return;

    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownloadZip = async () => {
    try {
      await downloadProjectAsZip(files, projectName);
      toast.success(`Downloaded ${projectName}.zip`);
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Failed to download project");
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground/40">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Package size={32} />
          </div>
          <p className="text-sm">Generating project files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium">
            <FolderTree size={14} />
            Project Mode
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package size={12} />
            <span>{files.length} files</span>
          </div>
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Generating...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-mint-500 text-white hover:bg-mint-600"
          >
            <Download size={14} />
            Download ZIP
          </button>
          {selectedFile && (
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent",
                copied
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border-border/40"
              )}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-border/40 overflow-y-auto bg-muted/20">
          <div className="p-2">
            <FileTree
              nodes={treeNodes}
              selectedPath={selectedPath}
              onSelectFile={setSelectedPath}
            />
          </div>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f3f3] dark:bg-[#21252b] border-b border-border/20 dark:border-[#3e4451]/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="ml-3 text-xs text-muted-foreground/60 font-mono">
                  {selectedFile.path}
                </span>
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  <FileCode size={12} />
                  {selectedFile.language.toUpperCase()}
                </div>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-[#282c34]">
                <div className="flex">
                  {/* Line numbers */}
                  <div className="flex-shrink-0 py-4 pl-4 pr-2 text-right select-none border-r border-border/30 dark:border-[#3e4451]/30">
                    {selectedFile.content.split("\n").map((_, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono leading-[1.6] text-muted-foreground/50 dark:text-[#636d83]"
                        style={{ fontSize: "13px" }}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>

                  {/* Syntax highlighted code */}
                  <div className="flex-1 overflow-x-auto py-4 px-4">
                    {mounted ? (
                      <SyntaxHighlighter
                        language={selectedFile.language}
                        style={isDark ? customDarkTheme : customLightTheme}
                        customStyle={{
                          margin: 0,
                          padding: 0,
                          background: "transparent",
                          fontSize: "13px",
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily:
                              "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
                          },
                        }}
                        wrapLongLines={false}
                      >
                        {selectedFile.content}
                      </SyntaxHighlighter>
                    ) : (
                      <pre className="text-foreground font-mono text-sm whitespace-pre">
                        {selectedFile.content}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground/40">
              <p className="text-sm">Select a file to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
