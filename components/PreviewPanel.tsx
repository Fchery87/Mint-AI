"use client";

import { useState, useEffect } from "react";
import { Code, Eye, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  componentCode: string;
  isStreaming?: boolean;
}

export default function PreviewPanel({ componentCode, isStreaming = false }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      {/* Preview Header with Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
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

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {!componentCode ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 pointer-events-none">
            {/* Placeholder managed by parent usually, but if independent, we show nothing or message */}
          </div>
        ) : activeTab === "preview" ? (
          <div className="w-full h-full overflow-auto p-4 bg-muted/10">
            <div className="bg-background rounded-xl shadow-sm border border-border/50 min-h-full p-8">
              <div className="prose max-w-none">
                {/* This is where the component would be rendered */}
                {/* For now, we'll show a placeholder */}
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
          <div className="w-full h-full overflow-auto bg-muted/50 p-4 text-sm font-mono leading-relaxed">
            <pre className="text-foreground whitespace-pre-wrap break-words bg-card/80 rounded-lg p-4 border border-border/50 min-h-full">
              <code>{componentCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
