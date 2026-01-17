import type { ProjectFile } from './project-types';
import type { PreviewType } from '@/types/preview';

export function determinePreviewType(files: ProjectFile[]): PreviewType {
  if (files.length === 0) return 'none';
  
  if (files.length === 1) {
    const file = files[0];
    const ext = file.path.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
      case 'scss':
      case 'sass':
        return 'css';
      case 'js':
      case 'mjs':
        return 'javascript';
      case 'ts':
        return 'javascript';
      case 'jsx':
      case 'tsx':
        return 'component';
      case 'py':
        return 'python';
      case 'json':
      case 'md':
      case 'txt':
        return 'code';
      default:
        return 'code';
    }
  }
  
  // Multiple files = project mode
  return 'project';
}

export function getMainFile(files: ProjectFile[]): ProjectFile | undefined {
  if (files.length === 0) return undefined;
  
  // Prefer index files
  const indexFile = files.find(f => 
    ['index.html', 'index.tsx', 'index.js', 'App.tsx', 'App.js'].includes(f.path)
  );
  if (indexFile) return indexFile;
  
  // Return first file
  return files[0];
}

export function isPreviewable(previewType: PreviewType): boolean {
  return ['html', 'css', 'javascript'].includes(previewType);
}

export function getPreviewLabel(previewType: PreviewType): string {
  switch (previewType) {
    case 'html':
      return 'HTML Preview';
    case 'css':
      return 'CSS Preview';
    case 'javascript':
      return 'JavaScript Preview';
    case 'component':
      return 'Component Code';
    case 'python':
      return 'Python Script';
    case 'project':
      return 'Project Files';
    case 'code':
      return 'Code View';
    case 'none':
      return 'No Preview';
    default:
      return 'Preview';
  }
}

export function canCopyCode(previewType: PreviewType): boolean {
  return ['component', 'code', 'python', 'javascript', 'css'].includes(previewType);
}

export function getDefaultFileName(files: ProjectFile[], fallback: string = 'file'): string {
  if (files.length === 0) return fallback;
  
  // Try to get a meaningful name from the first file
  const firstFile = files[0];
  const name = firstFile.path.split('/').pop()?.split('.').shift() || fallback;
  
  return name;
}
