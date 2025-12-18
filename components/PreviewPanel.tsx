"use client";

import { useState, useEffect } from "react";
import { Code, Eye, Copy, Check, FileCode, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import LivePreview from "./LivePreview";
import { downloadComponent, generateFilename } from "@/lib/download";
import { isPreviewable } from "@/lib/preview-support";

interface PreviewPanelProps {
  componentCode: string;
  isStreaming?: boolean;
}

// Detect language from code content
function detectLanguage(code: string): string {
  // Python
  if (code.includes("def ") && code.includes(":") && (code.includes("import ") || code.includes("print("))) {
    return "python";
  }
  // Rust
  if (code.includes("fn ") && code.includes("->") && (code.includes("let ") || code.includes("mut "))) {
    return "rust";
  }
  // Go
  if (code.includes("package ") && code.includes("func ") && code.includes("import")) {
    return "go";
  }
  // Java
  if (code.includes("public class") || code.includes("public static void main")) {
    return "java";
  }
  // Vue SFC
  if (code.includes("<template>") && code.includes("<script")) {
    return "vue";
  }
  // React/TSX
  if (
    code.includes("import React") ||
    (code.includes("export default function") && code.includes("<")) ||
    (code.includes("export default") && code.includes("tsx"))
  ) {
    return "tsx";
  }
  // HTML
  if (code.includes("<!DOCTYPE") || code.includes("<html") || (code.trim().startsWith("<") && code.includes("</"))) {
    return "html";
  }
  // CSS
  if (code.includes("{") && code.includes(":") && code.includes(";") && !code.includes("function")) {
    return "css";
  }
  // TypeScript
  if (code.includes("interface ") || code.includes(": string") || code.includes(": number")) {
    return "typescript";
  }
  // JavaScript
  if (code.includes("function ") || code.includes("const ") || code.includes("=>")) {
    return "javascript";
  }
  return "tsx"; // Default to TSX
}

// Custom theme based on One Dark but enhanced
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

export default function PreviewPanel({ componentCode, isStreaming = false }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-switch to code tab when streaming starts
  useEffect(() => {
    if (isStreaming && componentCode) {
      setActiveTab("code");
    }
  }, [isStreaming, componentCode]);

  const handleCopy = async () => {
    if (!componentCode) return;

    try {
      await navigator.clipboard.writeText(componentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownload = () => {
    if (!componentCode) return;

    try {
      const filename = generateFilename(componentCode, detectedLanguage);
      downloadComponent(componentCode, filename, detectedLanguage);
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Failed to download component");
    }
  };

  const detectedLanguage = detectLanguage(componentCode);
  const filename = componentCode ? generateFilename(componentCode, detectedLanguage) : "component.tsx";
  const isDark = mounted && resolvedTheme === "dark";

  // Get line count for display
  const lineCount = componentCode ? componentCode.split("\n").length : 0;

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      {/* Preview Header with Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border/40">
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Eye size={14} />
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                activeTab === "code"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Code size={14} />
              Code
            </button>
          </div>
          
          {/* Language Badge */}
          {componentCode && activeTab === "code" && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
              <FileCode size={12} />
              {detectedLanguage.toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Line Count */}
          {componentCode && activeTab === "code" && (
            <span className="text-xs text-muted-foreground">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          )}
          
          {componentCode && (
            <>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent bg-mint-500 text-white hover:bg-mint-600"
                title="Download component file"
              >
                <Download size={14} />
                Download
              </button>
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
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {!componentCode ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 pointer-events-none">
            {/* Placeholder managed by parent usually */}
          </div>
        ) : activeTab === "preview" ? (
          isPreviewable(detectedLanguage) ? (
            <div className="w-full h-full overflow-auto">
              <LivePreview code={componentCode} language={detectedLanguage} />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md px-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Code Only</h3>
                  <p className="text-sm text-muted-foreground">
                    {detectedLanguage.toUpperCase()} code can't be previewed in the browser.
                    Switch to the <span className="font-medium text-foreground">Code</span> tab to view and copy the generated code.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("code")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  View Code
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full overflow-auto">
            {/* Code Editor Style Container */}
            <div className="min-h-full bg-[#fafafa] dark:bg-[#282c34]">
              {/* Editor Top Bar (like VS Code) */}
              <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-[#f3f3f3] dark:bg-[#21252b] border-b border-border/20 dark:border-[#3e4451]/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="ml-3 text-xs text-muted-foreground/60 font-mono">
                  {filename}
                </span>
                {isStreaming && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Generating...
                  </span>
                )}
              </div>
              
              {/* Code Content with Line Numbers */}
              <div className="flex">
                {/* Line Numbers */}
                <div className="flex-shrink-0 py-4 pl-4 pr-2 text-right select-none border-r border-border/30 dark:border-[#3e4451]/30">
                  {componentCode.split("\n").map((_, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono leading-[1.6] text-muted-foreground/50 dark:text-[#636d83]"
                      style={{ fontSize: "13px" }}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>
                
                {/* Syntax Highlighted Code */}
                <div className="flex-1 overflow-x-auto py-4 px-4">
                  {mounted ? (
                    <SyntaxHighlighter
                      language={detectedLanguage}
                      style={isDark ? customDarkTheme : customLightTheme}
                      customStyle={{
                        margin: 0,
                        padding: 0,
                        background: "transparent",
                        fontSize: "13px",
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
                        },
                      }}
                      wrapLongLines={false}
                    >
                      {componentCode}
                    </SyntaxHighlighter>
                  ) : (
                    <pre className="text-foreground font-mono text-sm whitespace-pre">
                      {componentCode}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
