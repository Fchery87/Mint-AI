"use client";

import { useState, useEffect } from "react";
import { Code, Eye, Copy, Check, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

interface PreviewPanelProps {
  componentCode: string;
  isStreaming?: boolean;
}

// Detect language from code content
function detectLanguage(code: string): string {
  if (code.includes("import React") || code.includes("export default function") || code.includes("tsx")) {
    return "tsx";
  }
  if (code.includes("interface ") || code.includes(": string") || code.includes(": number")) {
    return "typescript";
  }
  if (code.includes("function ") || code.includes("const ") || code.includes("=>")) {
    return "javascript";
  }
  if (code.includes("<html") || code.includes("<div") || code.includes("<!DOCTYPE")) {
    return "html";
  }
  if (code.includes("{") && code.includes(":") && code.includes(";")) {
    return "css";
  }
  return "tsx"; // Default to TSX for React components
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

  const detectedLanguage = detectLanguage(componentCode);
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

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {!componentCode ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 pointer-events-none">
            {/* Placeholder managed by parent usually */}
          </div>
        ) : activeTab === "preview" ? (
          <div className="w-full h-full overflow-auto p-4 bg-muted/10">
            <div className="bg-background rounded-xl shadow-sm border border-border/50 min-h-full p-8">
              <div className="prose max-w-none">
                {/* This is where the component would be rendered */}
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/60 rounded-xl text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                    <Eye size={24} />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Live Preview</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    This is where your generated component will be rendered. 
                    Switch to the "Code" tab to copy the snippet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-auto">
            {/* Code Editor Style Container */}
            <div className="min-h-full bg-[#282c34] dark:bg-[#1e1e1e]">
              {/* Editor Top Bar (like VS Code) */}
              <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-[#21252b] dark:bg-[#1e1e1e] border-b border-[#3e4451]/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="ml-3 text-xs text-[#abb2bf]/60 font-mono">
                  component.tsx
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
                <div className="flex-shrink-0 py-4 pl-4 pr-2 text-right select-none border-r border-[#3e4451]/30">
                  {componentCode.split("\n").map((_, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono leading-[1.6] text-[#636d83]"
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
                    <pre className="text-[#abb2bf] font-mono text-sm whitespace-pre">
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
