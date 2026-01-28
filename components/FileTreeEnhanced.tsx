'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  Image as ImageIcon,
  ChevronRight,
  Plus,
  Upload,
  Search,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
}

interface FileTreeEnhancedProps {
  files: Record<string, string>;
  activePath: string | null;
  onSelectPath: (path: string) => void;
  onCreateFile?: () => void;
  onUploadFile?: () => void;
  className?: string;
}

export function FileTreeEnhanced({
  files,
  activePath,
  onSelectPath,
  onCreateFile,
  onUploadFile,
  className,
}: FileTreeEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  // Convert flat file object to tree structure
  const buildFileTree = (): FileNode[] => {
    const root: FileNode = { name: 'root', path: '/', type: 'folder', children: [] };
    
    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/');
      let currentLevel = root;
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join('/');
        
        let existingNode = currentLevel.children?.find(child => child.name === part);
        
        if (!existingNode) {
          existingNode = {
            name: part,
            path,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
            language: isFile ? getLanguage(part) : undefined,
          };
          if (!currentLevel.children) currentLevel.children = [];
          currentLevel.children.push(existingNode);
        }
        
        if (!isFile && existingNode.children) {
          currentLevel = existingNode;
        }
      });
    });
    
    return root.children || [];
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'svg': 'svg',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
    };
    return langMap[ext || ''] || 'text';
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return null; // Handled in render
    }
    
    const lang = node.language || 'text';
    
    if (lang === 'image') return <ImageIcon size={14} className="text-purple-500" />;
    if (lang === 'json') return <FileJson size={14} className="text-yellow-500" />;
    if (lang === 'markdown') return <FileText size={14} className="text-blue-500" />;
    return <FileCode size={14} className="text-blue-500" />;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce((acc: FileNode[], node) => {
      const matchesQuery = node.name.toLowerCase().includes(query.toLowerCase());
      
      if (node.type === 'folder') {
        const filteredChildren = node.children ? filterTree(node.children, query) : [];
        if (filteredChildren.length > 0 || matchesQuery) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }
      } else if (matchesQuery) {
        acc.push(node);
      }
      
      return acc;
    }, []);
  };

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = node.path === activePath;
    const isFolder = node.type === 'folder';
    
    return (
      <div key={node.path}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group',
            'hover:bg-muted/50',
            isActive && 'bg-primary/10 text-primary',
            depth > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              onSelectPath(node.path);
            }
          }}
        >
          {isFolder ? (
            <>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight size={12} className="text-muted-foreground" />
              </motion.div>
              {isExpanded ? (
                <FolderOpen size={14} className="text-blue-500" />
              ) : (
                <Folder size={14} className="text-blue-500" />
              )}
              <span className="text-sm flex-1 truncate">{node.name}</span>
            </>
          ) : (
            <>
              <div className="w-4" />
              {getFileIcon(node)}
              <span className="text-sm flex-1 truncate">{node.name}</span>
            </>
          )}
        </motion.div>
        
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fileTree = buildFileTree();
  const filteredTree = searchQuery ? filterTree(fileTree, searchQuery) : fileTree;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-3 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 rounded-md border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-1">
          {(onCreateFile || onUploadFile) && (
            <>
              {onCreateFile && (
                <button
                  onClick={onCreateFile}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                >
                  <Plus size={12} />
                  New File
                </button>
              )}
              {onUploadFile && (
                <button
                  onClick={onUploadFile}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs bg-muted hover:bg-muted/70 text-muted-foreground rounded-md transition-colors"
                >
                  <Upload size={12} />
                  Upload
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {searchQuery ? 'No files found' : 'No files yet'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredTree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-3 py-2 border-t border-border/40 bg-muted/30">
        <div className="text-xs text-muted-foreground">
          {Object.keys(files).length} {Object.keys(files).length === 1 ? 'file' : 'files'}
        </div>
      </div>
    </div>
  );
}

export default FileTreeEnhanced;
