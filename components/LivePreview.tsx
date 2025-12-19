"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Eye } from "lucide-react";

interface LivePreviewProps {
  code: string;
  language?: string;
  className?: string;
}

/**
 * LivePreview renders React components in a sandboxed iframe
 * This is an independent implementation that doesn't rely on Vercel's infrastructure
 */
export default function LivePreview({ code, language = "tsx", className = "" }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeContent, setIframeContent] = useState<string>("");

  useEffect(() => {
    if (!code) return undefined;

    setIsLoading(true);
    setError(null);

    try {
      const iframeDocument =
        language === "html" ? createHtmlPreviewDocument(code) : createPreviewDocument(code);

      setIframeContent(iframeDocument);

      // Debug after iframe should be loaded
      setTimeout(() => {
        if (iframeRef.current) {
          console.log('[LivePreview] Iframe element exists:', iframeRef.current);
          console.log('[LivePreview] Iframe srcDoc length:', iframeRef.current.srcdoc?.length);
        }
      }, 100);

      // Listen for errors from iframe
      const handleIframeError = (event: MessageEvent) => {
        // Only accept messages from the current preview iframe window
        if (event.source !== iframeRef.current?.contentWindow) return;

        const data = event.data as any;
        if (data?.type === "preview-error") {
          setError(String(data.message || "Preview error"));
          setIsLoading(false);
        } else if (data?.type === "preview-ready") {
          setIsLoading(false);
        }
      };

      window.addEventListener("message", handleIframeError);

      // Timeout for loading state
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      return () => {
        window.removeEventListener("message", handleIframeError);
        clearTimeout(timeout);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render preview");
      setIsLoading(false);
      return undefined;
    }
  }, [code]);

  if (!code) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4 text-muted-foreground/40">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Eye size={32} />
          </div>
          <p className="text-sm">No component to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Rendering preview...
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
        srcDoc={iframeContent}
        // Treat generated code as hostile: isolate origin, allow scripts only
        sandbox="allow-scripts"
        className="w-full h-full border-0"
        title="Component Preview"
        onLoad={language === "html" ? () => setIsLoading(false) : undefined}
      />
    </div>
  );
}

function createHtmlPreviewDocument(htmlCode: string): string {
  const trimmed = htmlCode.trim();
  if (/<!doctype\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) return trimmed;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
</head>
<body>
${trimmed}
</body>
</html>
  `.trim();
}

/**
 * Creates an HTML document that can render the React component
 * Uses UMD builds from CDN for React and ReactDOM
 */
function createPreviewDocument(componentCode: string): string {
  // Transform the component code to be executable
  const transformedCode = transformComponentCode(componentCode);
  const transformedCodeAsStringLiteral = JSON.stringify(transformedCode).replace(/</g, "\\u003c");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React and ReactDOM from CDN (UMD builds) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

  <!-- Babel Standalone for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: white;
      color: #0a0a0a;
    }

    #root {
      padding: 2rem;
      min-height: 100vh;
    }

    /* Error display */
    .preview-error {
      padding: 1rem;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 0.5rem;
      color: #c00;
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-presets="env,react,typescript">
    console.log('[Preview] Babel script executing!');
    console.log('[Preview] React:', typeof React);
    console.log('[Preview] ReactDOM:', typeof ReactDOM);

    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const __TRANSFORMED_CODE__ = ${transformedCodeAsStringLiteral};

    function escapeHtml(unsafe) {
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Error boundary component
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        console.error('Preview error:', error, errorInfo);
        window.parent.postMessage({
          type: 'preview-error',
          message: error.toString()
        }, '*');
      }

      render() {
        if (this.state.hasError) {
          return (
            <div className="preview-error">
              <strong>Component Error:</strong>
              <br />
              {this.state.error?.toString()}
            </div>
          );
        }

        return this.props.children;
      }
    }

    try {
      // Component code injected here
      ${transformedCode}

      // Debug: Check if Component exists
      if (typeof Component === 'undefined') {
        throw new Error('Component is not defined after transformation');
      }

      // Render the component with demo props if needed
      const root = ReactDOM.createRoot(document.getElementById('root'));

      // Detect if component needs children (like Button)
      const componentString = Component.toString();
      const needsChildren = componentString.includes('children');

      root.render(
        <ErrorBoundary>
          {needsChildren ? (
            <div style={{ padding: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Component>Click Me</Component>
              <Component variant="secondary">Secondary</Component>
              <Component variant="outline">Outline</Component>
              <Component size="small">Small</Component>
              <Component size="large">Large</Component>
              <Component loading>Loading</Component>
            </div>
          ) : (
            <Component />
          )}
        </ErrorBoundary>
      );

      // Debug logging
      console.log('[Preview] Component rendered successfully');
      console.log('[Preview] Root element:', document.getElementById('root'));
      console.log('[Preview] Body HTML:', document.body.innerHTML);

      // Signal that preview is ready
      window.parent.postMessage({ type: 'preview-ready' }, '*');
    } catch (error) {
      console.error('Failed to render component:', error);
      console.error('Transformed code:', __TRANSFORMED_CODE__);
      document.getElementById('root').innerHTML = \`
        <div class="preview-error">
          <strong>Render Error:</strong><br/>
          \${error.toString()}
          <br/><br/>
          <details>
            <summary style="cursor: pointer; color: #666;">View Transformed Code</summary>
            <pre style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; overflow-x: auto; font-size: 12px;">\${escapeHtml(__TRANSFORMED_CODE__)}</pre>
          </details>
        </div>
      \`;
      window.parent.postMessage({
        type: 'preview-error',
        message: error.toString()
      }, '*');
    }
  </script>

  <script>
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Runtime error:', event.error || event.message);
      window.parent.postMessage({
        type: 'preview-error',
        message: event.error?.toString() || event.message || 'Runtime error occurred'
      }, '*');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      window.parent.postMessage({
        type: 'preview-error',
        message: 'Promise rejection: ' + (event.reason?.toString() || 'Unknown error')
      }, '*');
    });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Transforms component code to be executable in the preview environment
 * Handles common patterns like export default, named exports, etc.
 */
function transformComponentCode(code: string): string {
  let transformed = code;

  // Remove import statements (React is already global)
  // Note: we rely on the iframe's Babel `typescript` preset to strip TS syntax safely;
  // regex-based stripping can corrupt valid JS (e.g. ternaries/object literals).
  transformed = transformed.replace(/^\s*import\s+[\s\S]*?;\s*$/gm, "");

  // Handle different export patterns

  // Pattern 1: export default function ComponentName() { ... }
  transformed = transformed.replace(
    /^export\s+default\s+function\s+(\w+)/m,
    "function Component"
  );

  // Pattern 2: export default const ComponentName = () => { ... }
  transformed = transformed.replace(
    /^export\s+default\s+const\s+(\w+)\s*=/m,
    "const Component ="
  );

  // Pattern 3: function ComponentName() { ... } \n export default ComponentName;
  const exportDefaultMatch = transformed.match(/^export\s+default\s+(\w+);?\s*$/m);
  if (exportDefaultMatch) {
    const componentName = exportDefaultMatch[1];
    // Replace the export statement
    transformed = transformed.replace(/^export\s+default\s+\w+;?\s*$/m, "");
    // Rename the component function/const to 'Component'
    transformed = transformed.replace(
      new RegExp(`\\b(function|const)\\s+${componentName}\\b`, "g"),
      "$1 Component"
    );
  }

  // Pattern 4: Just 'export default' at the start of function/const
  transformed = transformed.replace(/^export\s+default\s+/gm, "");

  // Remove any remaining 'export' keywords (named exports)
  transformed = transformed.replace(/^export\s+/gm, "");

  // If no 'Component' was created yet, try to find the main component
  if (!transformed.includes("function Component") && !transformed.includes("const Component")) {
    // Look for the first function or const that looks like a React component (starts with capital letter)
    // Prefer functions that contain JSX (return statements with <)
    const lines = transformed.split('\n');
    let componentName = null;
    let inFunction = false;
    let currentFunctionName = null;

    for (const line of lines) {
      const functionMatch = line.match(/^(?:function|const)\s+([A-Z]\w*)/);
      if (functionMatch) {
        currentFunctionName = functionMatch[1];
        inFunction = true;
      }

      // If we find JSX in this function, it's likely our component
      if (inFunction && currentFunctionName && line.includes('return') && line.includes('<')) {
        componentName = currentFunctionName;
        break;
      }
    }

    // If we didn't find a function with JSX, just take the first capitalized function
    if (!componentName) {
      const componentMatch = transformed.match(/^(?:function|const)\s+([A-Z]\w*)/m);
      if (componentMatch) {
        componentName = componentMatch[1];
      }
    }

    if (componentName) {
      transformed = transformed.replace(
        new RegExp(`\\b(function|const)\\s+${componentName}\\b`, "g"),
        "$1 Component"
      );
    } else {
      // Last resort: just wrap everything in a Component function
      transformed = `function Component() {\n${transformed}\n}`;
    }
  }

  // Clean up empty lines
  transformed = transformed.replace(/^\s*[\r\n]/gm, "\n").trim();

  return transformed;
}
