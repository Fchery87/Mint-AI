"use client";

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HtmlPreviewProps {
  code: string;
  className?: string;
}

/**
 * Simple HTML preview that renders HTML in a sandboxed iframe
 * Only handles HTML/CSS/JS - no React or complex frameworks
 */
export function HtmlPreview({ code, className = '' }: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setError('No HTML code to preview');
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    // Detect if this is React/JSX code
    const isReact = /import\s+.*from\s+['"]react['"]|export\s+default\s+function|const\s+\w+\s+=\s+\(\s*\)\s+=>/i.test(code) ||
                    /<[A-Z]\w*/.test(code); // JSX component tags

    let htmlDoc: string;

    if (isReact) {
      // Use Babel Standalone for React/JSX transpilation
      htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Preview</title>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react-dom": "https://esm.sh/react-dom@18",
        "react-dom/client": "https://esm.sh/react-dom@18/client"
      }
    }
  </script>
  <style>
    body { margin: 0; padding: 0; width: 100%; height: 100vh; overflow: auto; }
    #root { width: 100%; min-height: 100vh; }
    .error-container {
      padding: 1rem;
      margin: 1rem;
      background-color: #fee;
      border: 1px solid #fcc;
      border-radius: 0.5rem;
      font-family: monospace;
      color: #c00;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    import React, { useState, useEffect } from 'react';
    import ReactDOM from 'react-dom/client';

    // Error boundary for runtime errors
    window.addEventListener('error', (e) => {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.innerHTML = \`
          <div class="error-container">
            <h3 style="margin-top: 0;">Runtime Error</h3>
            <pre style="white-space: pre-wrap;">\${e.message}
\${e.filename ? e.filename + ':' + e.lineno + ':' + e.colno : ''}</pre>
          </div>
        \`;
      }
      e.preventDefault();
    });

    try {
      // Inject the user's code
      const userCode = \`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
      
      // Create a function to execute the user code and extract the component
      const extractComponent = new Function('React', 'useState', 'useEffect', \`
        \${userCode}
        
        // Try to find the component
        if (typeof App !== 'undefined') return App;
        
        // Look for default export pattern
        const match = \${JSON.stringify(code)}.match(/export\\\\s+default\\\\s+(?:function\\\\s+)?(\\\\w+)/);
        if (match && typeof window[match[1]] !== 'undefined') {
          return window[match[1]];
        }
        
        // Look for function Component pattern
        const funcMatch = \${JSON.stringify(code)}.match(/(?:function|const)\\\\s+(\\\\w+)\\\\s*=?\\\\s*(?:\\\\([^)]*\\\\))?\\\\s*=?\\\\s*(?:=>)?\\\\s*\\\\{[^}]*return\\\\s*\\\\(/);
        if (funcMatch && typeof window[funcMatch[1]] !== 'undefined') {
          return window[funcMatch[1]];
        }
        
        return null;
      \`);
      
      const Component = extractComponent(React, useState, useEffect);
      
      const rootEl = document.getElementById('root');
      const root = ReactDOM.createRoot(rootEl);
      
      if (Component) {
        root.render(React.createElement(Component));
      } else {
        rootEl.innerHTML = \`
          <div class="error-container">
            <h3 style="margin-top: 0;">Component Not Found</h3>
            <p>Could not find a React component to render. Make sure to export a component or define an 'App' function.</p>
          </div>
        \`;
      }
    } catch (err) {
      document.getElementById('root').innerHTML = \`
        <div class="error-container">
          <h3 style="margin-top: 0;">Error</h3>
          <pre style="white-space: pre-wrap;">\${err.message}\${err.stack ? '\\n' + err.stack : ''}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
    } else {
      // Standard HTML handling
      const trimmed = code.trim();
      htmlDoc = trimmed;
      
      if (!/<!doctype\s+html/i.test(htmlDoc) && !/<html[\s>]/i.test(htmlDoc)) {
        htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
${trimmed}
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
  }, [code]);

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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading preview...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 z-10">
          <div className="max-w-md mx-auto p-6 bg-background border border-destructive/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Preview Error</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="w-full h-full border-0"
        title="HTML Preview"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
