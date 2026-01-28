'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  FileCode, 
  FileJson, 
  Image as ImageIcon,
  ChevronRight,
  Plus,
  Search,
  FileText,
  Music,
  Film,
  Archive,
  FileSpreadsheet,
  Copy,
  Trash2,
  Edit3,
  X,
  FolderPlus,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CyberBadge } from '@/components/ui';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
}

interface FileExplorerProps {
  files: Record<string, string>;
  activePath: string | null;
  onSelectPath: (path: string) => void;
  onCreateFile?: (path: string, content: string) => void;
  onDeleteFile?: (path: string) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  onCreateFolder?: (path: string) => void;
  className?: string;
  projectId?: string;
}

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  node: FileNode | null;
}

interface RenameState {
  path: string | null;
  value: string;
}

const STORAGE_KEY = 'file-explorer-state';

function FileExplorerComponent({
  files,
  activePath,
  onSelectPath,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onCreateFolder,
  className,
  projectId = 'default',
}: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, node: null });
  const [renameState, setRenameState] = useState<RenameState>({ path: null, value: '' });
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${projectId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expandedFolders) {
          setExpandedFolders(new Set(parsed.expandedFolders));
        }
      }
    } catch (e) {
      console.warn('Failed to load file explorer state:', e);
    }
  }, [projectId]);

  // Save state to localStorage
  const saveState = useCallback((folders: Set<string>) => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}-${projectId}`,
        JSON.stringify({ expandedFolders: Array.from(folders) })
      );
    } catch (e) {
      console.warn('Failed to save file explorer state:', e);
    }
  }, [projectId]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, node: null });
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Convert flat file object to tree structure - memoized
  const buildFileTree = useCallback((): FileNode[] => {
    const root: FileNode = { name: 'root', path: '/', type: 'folder', children: [] };
    
    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/').filter(Boolean);
      if (parts.length === 0) return;
      
      let currentLevel = root;
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const path = '/' + parts.slice(0, index + 1).join('/');
        
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
  }, [files]);

  const getLanguage = useCallback((filename: string): string => {
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
      'scala': 'scala',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'scss': 'scss',
      'sass': 'scss',
      'less': 'less',
      'html': 'html',
      'htm': 'html',
      'svg': 'svg',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'webp': 'image',
      'ico': 'image',
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'flac': 'audio',
      'mp4': 'video',
      'mov': 'video',
      'avi': 'video',
      'webm': 'video',
      'mkv': 'video',
      'zip': 'archive',
      'tar': 'archive',
      'gz': 'archive',
      'rar': 'archive',
      '7z': 'archive',
      'xls': 'excel',
      'xlsx': 'excel',
      'csv': 'excel',
      'doc': 'word',
      'docx': 'word',
      'pdf': 'pdf',
      'txt': 'text',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'sql': 'sql',
      'graphql': 'graphql',
      'gql': 'graphql',
      'dockerfile': 'docker',
      'dockerignore': 'docker',
      'env': 'env',
      'gitignore': 'git',
      'eslintrc': 'eslint',
      'prettierrc': 'prettier',
      'editorconfig': 'editorconfig',
    };
    return langMap[ext || ''] || 'text';
  }, []);

  const getFileIcon = useCallback((node: FileNode, size: number = 14) => {
    if (node.type === 'folder') {
      return null;
    }
    
    const lang = node.language || 'text';
    
    const iconMap: Record<string, { icon: any; color: string }> = {
      typescript: { icon: FileCode, color: 'text-blue-500' },
      javascript: { icon: FileCode, color: 'text-yellow-500' },
      python: { icon: FileCode, color: 'text-blue-400' },
      java: { icon: FileCode, color: 'text-orange-500' },
      go: { icon: FileCode, color: 'text-cyan-500' },
      rust: { icon: FileCode, color: 'text-orange-600' },
      cpp: { icon: FileCode, color: 'text-blue-600' },
      c: { icon: FileCode, color: 'text-blue-600' },
      csharp: { icon: FileCode, color: 'text-purple-500' },
      php: { icon: FileCode, color: 'text-indigo-500' },
      ruby: { icon: FileCode, color: 'text-red-500' },
      swift: { icon: FileCode, color: 'text-orange-500' },
      kotlin: { icon: FileCode, color: 'text-purple-600' },
      scala: { icon: FileCode, color: 'text-red-600' },
      json: { icon: FileJson, color: 'text-yellow-500' },
      markdown: { icon: FileText, color: 'text-blue-500' },
      md: { icon: FileText, color: 'text-blue-500' },
      css: { icon: FileCode, color: 'text-blue-500' },
      scss: { icon: FileCode, color: 'text-pink-500' },
      sass: { icon: FileCode, color: 'text-pink-500' },
      less: { icon: FileCode, color: 'text-blue-600' },
      html: { icon: FileCode, color: 'text-orange-500' },
      svg: { icon: ImageIcon, color: 'text-yellow-500' },
      image: { icon: ImageIcon, color: 'text-purple-500' },
      audio: { icon: Music, color: 'text-pink-500' },
      video: { icon: Film, color: 'text-purple-500' },
      archive: { icon: Archive, color: 'text-yellow-600' },
      excel: { icon: FileSpreadsheet, color: 'text-green-600' },
      word: { icon: FileText, color: 'text-blue-600' },
      pdf: { icon: FileText, color: 'text-red-500' },
      text: { icon: FileText, color: 'text-gray-500' },
      xml: { icon: FileCode, color: 'text-orange-400' },
      yaml: { icon: FileCode, color: 'text-pink-400' },
      yml: { icon: FileCode, color: 'text-pink-400' },
      toml: { icon: FileCode, color: 'text-red-400' },
      shell: { icon: FileCode, color: 'text-green-500' },
      bash: { icon: FileCode, color: 'text-green-500' },
      zsh: { icon: FileCode, color: 'text-green-500' },
      fish: { icon: FileCode, color: 'text-green-500' },
      sql: { icon: FileCode, color: 'text-blue-400' },
      graphql: { icon: FileCode, color: 'text-pink-500' },
      docker: { icon: FileCode, color: 'text-blue-500' },
      env: { icon: FileCode, color: 'text-yellow-400' },
      git: { icon: FileCode, color: 'text-orange-600' },
      eslint: { icon: FileCode, color: 'text-purple-400' },
      prettier: { icon: FileCode, color: 'text-pink-400' },
    };
    
    const config = iconMap[lang] || iconMap['text'];
    const Icon = config.icon;
    return <Icon size={size} className={config.color} />;
  }, []);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      saveState(next);
      return next;
    });
  };

  const filterTree = useCallback((nodes: FileNode[], query: string): FileNode[] => {
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
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  const handleCopyPath = () => {
    if (contextMenu.node) {
      navigator.clipboard.writeText(contextMenu.node.path);
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }
  };

  const handleRename = () => {
    if (contextMenu.node) {
      setRenameState({ path: contextMenu.node.path, value: contextMenu.node.name });
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }
  };

  const handleRenameSubmit = () => {
    if (renameState.path && onRenameFile && renameState.value.trim()) {
      const oldPath = renameState.path;
      const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${dir}/${renameState.value.trim()}`;
      onRenameFile(oldPath, newPath);
      setRenameState({ path: null, value: '' });
    }
  };

  const handleDelete = () => {
    if (contextMenu.node && onDeleteFile) {
      onDeleteFile(contextMenu.node.path);
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }
  };

  const handleNewFile = () => {
    const activeFolder = contextMenu.node?.type === 'folder' ? contextMenu.node.path : '/';
    setNewFilePath(activeFolder === '/' ? '/untitled.ts' : `${activeFolder}/untitled.ts`);
    setShowNewFileDialog(true);
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  };

  const handleNewFolder = () => {
    const activeFolder = contextMenu.node?.type === 'folder' ? contextMenu.node.path : '/';
    setNewFolderPath(activeFolder === '/' ? '/new-folder' : `${activeFolder}/new-folder`);
    setShowNewFolderDialog(true);
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  };

  const handleCreateFile = () => {
    if (onCreateFile && newFilePath.trim()) {
      onCreateFile(newFilePath, '');
      setShowNewFileDialog(false);
      setNewFilePath('');
    }
  };

  const handleCreateFolder = () => {
    if (onCreateFolder && newFolderPath.trim()) {
      onCreateFolder(newFolderPath);
      setShowNewFolderDialog(false);
      setNewFolderPath('');
    }
  };

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = node.path === activePath;
    const isFolder = node.type === 'folder';
    const isRenaming = renameState.path === node.path;
    
    return (
      <div key={node.path}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-fast group font-mono text-xs uppercase tracking-wider',
            'hover:bg-muted/30 cyber-chamfer-sm',
            isActive && 'bg-primary/20 text-primary border-l-2 border-primary shadow-neon-sm',
            depth > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${depth * 12 + 10}px` }}
          onClick={() => {
            if (isRenaming) return;
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              onSelectPath(node.path);
            }
          }}
          onContextMenu={(_e) => handleContextMenu(_e, node)}
        >
          {isFolder ? (
            <>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight size={11} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.div>
              {isExpanded ? (
                <FolderOpen size={13} className="text-secondary group-hover:text-secondary transition-colors shadow-neon-secondary-sm" />
              ) : (
                <Folder size={13} className="text-secondary group-hover:text-secondary transition-colors" />
              )}
              {isRenaming ? (
                <input
                  type="text"
                  value={renameState.value}
                  onChange={(e) => setRenameState({ ...renameState, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenameState({ path: null, value: '' });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-xs bg-background border-2 border-primary cyber-chamfer-sm px-2 py-1 focus:outline-none focus:shadow-neon-sm font-mono uppercase tracking-wider"
                  autoFocus
                />
              ) : (
                <span className="text-xs flex-1 truncate font-mono uppercase tracking-wider">{node.name}</span>
              )}
            </>
          ) : (
            <>
              <div className="w-4" />
              <div className="group-hover:shadow-neon-sm transition-all duration-fast">
                {getFileIcon(node)}
              </div>
              {isRenaming ? (
                <input
                  type="text"
                  value={renameState.value}
                  onChange={(e) => setRenameState({ ...renameState, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenameState({ path: null, value: '' });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-xs bg-background border-2 border-primary cyber-chamfer-sm px-2 py-1 focus:outline-none focus:shadow-neon-sm font-mono uppercase tracking-wider"
                  autoFocus
                />
              ) : (
                <span className="text-xs flex-1 truncate font-mono uppercase tracking-wider">{node.name}</span>
              )}
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

  const fileTree = useMemo(() => buildFileTree(), [buildFileTree]);
  const filteredTree = useMemo(() => 
    searchQuery ? filterTree(fileTree, searchQuery) : fileTree,
    [searchQuery, filterTree, fileTree]
  );
  
  return (
    <div className={cn('flex flex-col h-full cyber-grid', className)}>
      {/* Header - Cyberpunk */}
      <div className="p-4 space-y-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
            FILE_SYSTEM
          </span>
          <CyberBadge variant="primary" shape="sharp" className="gap-1.5">
            <span className="text-[10px] font-mono">{Object.keys(files).length} files</span>
          </CyberBadge>
        </div>
        
        {/* Search - Cyberpunk */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="> Search_files..."
            className="w-full pl-8 pr-3 py-2 text-xs font-mono uppercase tracking-wider bg-card/40 border-2 border-border/60 cyber-chamfer-sm focus:border-primary focus:shadow-neon-sm transition-all duration-fast placeholder:text-muted-foreground/60 terminal-prompt"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-1">
          {(onCreateFile || onCreateFolder) && (
            <>
              {onCreateFile && (
                <button
                  onClick={() => {
                    setNewFilePath('/untitled.ts');
                    setShowNewFileDialog(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-primary/10 border border-primary/30 hover:border-primary hover:bg-primary/20 hover:shadow-neon-sm cyber-chamfer-sm transition-all duration-fast text-primary"
                >
                  <Plus size={11} />
                  File
                </button>
              )}
              {onCreateFolder && (
                <button
                  onClick={() => {
                    setNewFolderPath('/new-folder');
                    setShowNewFolderDialog(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-muted/20 border border-border/60 hover:border-secondary hover:bg-secondary/10 hover:shadow-neon-secondary-sm cyber-chamfer-sm transition-all duration-fast text-secondary"
                >
                  <FolderPlus size={11} />
                  Folder
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* File Tree - Cyberpunk */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs font-mono uppercase tracking-wider">
            {searchQuery ? 'NO_FILES_FOUND' : 'NO_FILES_YET'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredTree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* Stats - Cyberpunk */}
      <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <span className="text-primary terminal-prompt"></span> {Object.keys(files).length} {Object.keys(files).length === 1 ? 'FILE' : 'FILES'}
        </div>
      </div>

      {/* Context Menu - Cyberpunk */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[180px] bg-popover border-2 border-border cyber-chamfer-md shadow-neon-sm py-1 backdrop-blur-md"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              top: Math.min(contextMenu.y, window.innerHeight - 200),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node?.type === 'file' && (
              <>
                <button
                  onClick={() => {
                    if (contextMenu.node) onSelectPath(contextMenu.node.path);
                    setContextMenu({ visible: false, x: 0, y: 0, node: null });
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors duration-fast"
                >
                  <FileCode size={12} />
                  Open
                </button>
                <button
                  onClick={handleCopyPath}
                  className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors duration-fast"
                >
                  <Copy size={12} />
                  Copy Path
                </button>
                {onRenameFile && (
                  <button
                    onClick={handleRename}
                    className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-secondary/10 hover:text-secondary flex items-center gap-2 transition-colors duration-fast"
                  >
                    <Edit3 size={12} />
                    Rename
                  </button>
                )}
                {onDeleteFile && (
                  <>
                    <div className="my-1 border-t border-border/60" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-destructive/20 text-destructive flex items-center gap-2 transition-colors duration-fast hover:shadow-neon"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </>
                )}
              </>
            )}
            {contextMenu.node?.type === 'folder' && (
              <>
                {onCreateFile && (
                  <button
                    onClick={handleNewFile}
                    className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-tertiary/10 hover:text-tertiary flex items-center gap-2 transition-colors duration-fast"
                  >
                    <Plus size={12} />
                    New File
                  </button>
                )}
                {onCreateFolder && (
                  <button
                    onClick={handleNewFolder}
                    className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-tertiary/10 hover:text-tertiary flex items-center gap-2 transition-colors duration-fast"
                  >
                    <FolderPlus size={12} />
                  </button>
                )}
                {onRenameFile && (
                  <button
                    onClick={handleRename}
                    className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-secondary/10 hover:text-secondary flex items-center gap-2 transition-colors duration-fast"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
                {onDeleteFile && (
                  <>
                    <div className="my-1 border-t border-border/60" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-xs font-mono uppercase tracking-wider hover:bg-destructive/20 text-destructive flex items-center gap-2 transition-colors duration-fast hover:shadow-neon"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New File Dialog */}
      <AnimatePresence>
        {showNewFileDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-popover border border-border rounded-lg shadow-lg p-4 w-80"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">New File</h3>
                <button
                  onClick={() => setShowNewFileDialog(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                  if (e.key === 'Escape') setShowNewFileDialog(false);
                }}
                placeholder="File path (e.g., /src/index.ts)"
                className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/50 mb-3"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewFileDialog(false)}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/70 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-1"
                >
                  <Check size={12} />
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Dialog */}
      <AnimatePresence>
        {showNewFolderDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-popover border border-border rounded-lg shadow-lg p-4 w-80"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">New Folder</h3>
                <button
                  onClick={() => setShowNewFolderDialog(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                value={newFolderPath}
                onChange={(e) => setNewFolderPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowNewFolderDialog(false);
                }}
                placeholder="Folder path (e.g., /src/components)"
                className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/50 mb-3"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewFolderDialog(false)}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/70 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-1"
                >
                  <Check size={12} />
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Memoize the FileExplorer component
export default memo(FileExplorerComponent, (prevProps, nextProps) => {
  return (
    prevProps.files === nextProps.files &&
    prevProps.activePath === nextProps.activePath &&
    prevProps.className === nextProps.className &&
    prevProps.projectId === nextProps.projectId
  );
});
