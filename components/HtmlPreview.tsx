"use client";

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HtmlPreviewProps {
  code: string;
  className?: string;
  /** When true, allows React/JSX execution via Babel. Default: false (safe mode) */
  trustedMode?: boolean;
}

/**
 * Secure HTML preview component with sandboxed iframe rendering.
 * 
 * Security features:
 * - Default SAFE mode: HTML/CSS rendering only, NO script execution
 * - trustedMode prop (default: false) must be explicitly enabled for React/JSX
 * - Sandbox attributes restrict iframe capabilities
 * - Proper escaping for user content injection
 * - Warning UI when trusted mode is active
 */
export function HtmlPreview({ code, className = '', trustedMode = false }: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrustedMode, setIsTrustedMode] = useState(trustedMode);
  const [babelLoaded, setBabelLoaded] = useState(false);

  // Reset trustedMode when code changes for security
  useEffect(() => {
    setIsTrustedMode(false);
  }, [code]);

  // Load Babel Standalone when trusted mode is enabled
  useEffect(() => {
    if (!isTrustedMode) {
      setBabelLoaded(false);
      return;
    }

    // Check if Babel is already loaded
    if (typeof window !== 'undefined' && (window as unknown as { Babel?: unknown }).Babel) {
      setBabelLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
    script.onload = () => setBabelLoaded(true);
    script.onerror = () => setError('Failed to load Babel for JSX transpilation');
    document.head.appendChild(script);

    return () => {
      // Don't remove the script as it may be needed elsewhere
    };
  }, [isTrustedMode]);

  useEffect(() => {
    if (!code) {
      setError('No HTML code to preview');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Detect if this is React/JSX code
    const isReact = /import\s+.*from\s+['"]react['"]|export\s+default\s+function|const\s+\w+\s+=\s+\(\s*\)\s*=>/i.test(code) ||
                    /<[A-Z]\w*/.test(code); // JSX component tags

    // If React detected but trustedMode is false, show error
    if (isReact && !isTrustedMode) {
      setError(
        'React/JSX code detected. This preview runs in SAFE mode with script execution disabled. ' +
        'Enable trustedMode to render React components (requires explicit trust).'
      );
      setIsLoading(false);
      return;
    }

    let htmlDoc: string;

    if (isReact && isTrustedMode && babelLoaded) {
      // Secure React rendering using Babel Standalone
      try {
        // @ts-expect-error Babel is loaded from CDN
        const Babel = window.Babel;
        
        // Transform the code using Babel
        const transformedCode = Babel.transform(code, {
          presets: ['react', 'env'],
          filename: 'preview.jsx',
        }).code;

        // Escape user content for safe injection
        const escapedCode = code
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$');

        // Build the script content as a simple string to avoid escape issues
        const innerScript = 
          'try {' +
          '// Execute the transformed code\n' +
          transformedCode +
          '\n\n' +
          '// Find and render the component\n' +
          'const rootEl = document.getElementById("root");\n' +
          'let Component = null;\n' +
          'if (typeof App !== "undefined") {\n' +
          '  Component = App;\n' +
          '} else {\n' +
          '  const componentMatch = /export\\\\s+default\\\\s+(?:function\\\\s+)?(\\\\w+)/.exec(`' + escapedCode + '`);\n' +
          '  if (componentMatch && typeof window[componentMatch[1]] !== "undefined") {\n' +
          '    Component = window[componentMatch[1]];\n' +
          '  }\n' +
          '}\n' +
          'if (Component) {\n' +
          '  import("react-dom/client").then(({ createRoot }) => {\n' +
          '    const root = createRoot(rootEl);\n' +
          '    import("react").then(({ createElement, useState, useEffect }) => {\n' +
          '      root.render(createElement(Component));\n' +
          '    });\n' +
          '  });\n' +
          '} else {\n' +
          '  rootEl.innerHTML = \'<div class="error-container"><h3>Component Not Found</h3><p>Could not find a React component to render.</p></div>\';\n' +
          '}\n' +
          '} catch (err) {\n' +
          '  const rootEl = document.getElementById("root");\n' +
          '  if (rootEl) {\n' +
          '    rootEl.innerHTML = "<div class=\\"error-container\\"><h3>Error</h3><pre>" + err.message + (err.stack ? "\\n" + err.stack : "") + "</pre></div>";\n' +
          '  }\n' +
          '}';

        htmlDoc = '<!DOCTYPE html>\n' +
          '<html lang="en">\n' +
          '<head>\n' +
          '  <meta charset="UTF-8" />\n' +
          '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
          '  <title>React Preview (Trusted Mode)</title>\n' +
          '  <script src="https://cdn.tailwindcss.com"></script>\n' +
          '  <script type="importmap">{"imports":{"react":"https://esm.sh/react@18","react-dom":"https://esm.sh/react-dom@18","react-dom/client":"https://esm.sh/react-dom@18/client"}}</script>\n' +
          '  <style>body{margin:0;padding:0;width:100%;height:100vh;overflow:auto}#root{width:100%;min-height:100vh}.error-container{padding:1rem;margin:1rem;background-color:#fee;border:1px solid #fcc;border-radius:0.5rem;font-family:monospace;color:#c00}</style>\n' +
          '</head>\n' +
          '<body>\n' +
          '  <div id="root"></div>\n' +
          '  <script type="module">\n' +
          '    window.addEventListener("error", function(e) {\n' +
          '      const rootEl = document.getElementById("root");\n' +
          '      if (rootEl) {\n' +
          '        rootEl.innerHTML = "<div class=\\"error-container\\"><h3>Runtime Error</h3><pre>" + e.message + (e.filename ? e.filename + ":" + e.lineno + ":" + e.colno : "") + "</pre></div>";\n' +
          '      }\n' +
          '      e.preventDefault();\n' +
          '    });\n' +
          innerScript +
          '\n  </script>\n' +
          '</body>\n' +
          '</html>';
      } catch (err) {
        setError(`JSX transpilation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
        return;
      }
    } else {
      const trimmed = code.trim();
      
      // Remove any script tags for safe mode
      const sanitizedHtml = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove event handlers (onclick, onerror, etc.)
      const sanitizedHtmlNoEvents = sanitizedHtml.replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/g, '');
      
      // Remove javascript: and data: URLs in href/src
      const sanitizedHtmlNoUrls = sanitizedHtmlNoEvents
        .replace(/\bhref\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href="$1about:blank$1"')
        .replace(/\bsrc\s*=\s*(['"])javascript:[^'"]*\1/gi, 'src="$1about:blank$1"')
        .replace(/\bhref\s*=\s*(['"])data:[^'"]*\1/gi, 'href="$1about:blank$1"');

      htmlDoc = sanitizedHtmlNoUrls;
      
      if (!/<!doctype\s+html/i.test(htmlDoc) && !/<html[\s>]/i.test(htmlDoc)) {
        htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
${sanitizedHtmlNoUrls}
</body>
</html>`;
      }
    }

    // Set iframe content
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      
      // Use srcdoc for preview
      iframe.srcdoc = htmlDoc;

      // Timeout for loading
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      return () => {
        clearTimeout(timeout);
      };
    }

    return undefined;
  }, [code, isTrustedMode, babelLoaded]);

  const toggleTrustedMode = () => {
    setIsTrustedMode(!isTrustedMode);
  };

  if (!code) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
        <div className="text-center space-y-4 text-muted-foreground/40">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Eye size={32} />
          </div>
          <p className="text-sm">No HTML to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Trusted Mode Warning Banner */}
      {isTrustedMode && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldAlert size={16} />
            <span className="text-sm font-medium">Trusted Mode Active</span>
          </div>
          <button
            onClick={toggleTrustedMode}
            className="text-xs px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-full transition-colors text-amber-700 dark:text-amber-300"
          >
            Disable Safe Mode
          </button>
        </div>
      )}

      {/* Safe Mode Indicator */}
      {!isTrustedMode && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
          <Shield size={16} className="text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-300">Safe Mode - Scripts Disabled</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10" style={{ marginTop: '40px' }}>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading preview...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 z-10" style={{ marginTop: '40px' }}>
          <div className="max-w-md mx-auto p-6 bg-background border border-destructive/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Preview Error</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                {error.includes('React/JSX') && (
                  <button
                    onClick={toggleTrustedMode}
                    className="mt-3 text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Enable Trusted Mode to Render
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        // Sandbox attributes: allow-scripts only in trusted mode
        sandbox={isTrustedMode ? "allow-scripts allow-modals" : "allow-same-origin"}
        className="w-full h-full border-0"
        title="HTML Preview"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
