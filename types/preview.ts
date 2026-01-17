import type { ProjectFile } from '@/lib/project-types';

export type PreviewType = 
  | 'html'        // Full iframe render
  | 'css'         // Style demo
  | 'javascript'  // Basic execution  
  | 'component'   // React/TSX - code view only
  | 'python'      // Download only
  | 'project'     // Multi-file project
  | 'code'        // Generic code view
  | 'none';       // No preview available

export interface PreviewRouterProps {
  files: ProjectFile[];
  projectType: 'single' | 'project';
  projectName?: string;
  activePath?: string;
  onSelectPath?: (path: string) => void;
  readOnly?: boolean;
}

export interface CodeViewerProps {
  code: string;
  language: string;
  path?: string;
  onCopy?: () => void;
  showLineNumbers?: boolean;
}

export interface HtmlPreviewProps {
  code: string;
  className?: string;
}

export interface ExportPanelProps {
  files: ProjectFile[];
  projectName?: string;
  projectType: 'single' | 'project';
}
