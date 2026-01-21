"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Globe,
  FileText,
  Clock,
} from "lucide-react";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
  timestamp?: string;
}

export interface WebSearchDisplayProps {
  query: string;
  results: WebSearchResult[];
  isSearching: boolean;
  timestamp?: number;
}

export function WebSearchDisplay({
  query,
  results,
  isSearching,
  timestamp,
}: WebSearchDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSearching
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isSearching ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Search size={16} />
            </motion.div>
          ) : (
            <Globe size={16} />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isSearching ? "Searching..." : "Web Search"}
            </span>
            {!isSearching && results.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {results.length} sources
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{query}</p>
        </div>

        {timestamp && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={10} />
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}

        {results.length > 0 && (
          isExpanded ? (
            <ChevronDown size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )
        )}
      </button>

      {/* Loading Animation */}
      {isSearching && (
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 flex-1 bg-primary/20 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-primary/50 rounded-full"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Results List */}
      <AnimatePresence>
        {isExpanded && results.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="divide-y divide-border/40">
              {results.map((result, index) => (
                <motion.a
                  key={index}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={12} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary group-hover:underline truncate">
                        {result.title}
                      </span>
                      <ExternalLink
                        size={12}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      />
                    </div>
                    {result.domain && (
                      <span className="text-[10px] text-muted-foreground">
                        {result.domain}
                      </span>
                    )}
                    {result.snippet && (
                      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Sources (collapsed view) */}
      {!isExpanded && results.length > 0 && (
        <div className="px-4 pb-3 -mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {results.slice(0, 5).map((result, index) => {
              const domain = result.domain || new URL(result.url).hostname.replace("www.", "");
              return (
                <a
                  key={index}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Globe size={8} />
                  {domain.length > 20 ? domain.slice(0, 20) + "..." : domain}
                </a>
              );
            })}
            {results.length > 5 && (
              <span className="text-[10px] text-muted-foreground">
                +{results.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Parse sources from web search context string
 */
export function parseWebSearchSources(context: string): WebSearchResult[] {
  const results: WebSearchResult[] = [];
  const lines = context.split("\n");

  for (const line of lines) {
    // Match format: [1] Title — URL
    const match = line.match(/^\[(\d+)\]\s*([^—]+)\s*—\s*(.+)$/);
    if (match) {
      const [, , title, url] = match;
      try {
        const urlObj = new URL(url.trim());
        results.push({
          title: title.trim(),
          url: url.trim(),
          domain: urlObj.hostname.replace("www.", ""),
        });
      } catch {
        // Invalid URL, skip
      }
    }
  }

  return results;
}
