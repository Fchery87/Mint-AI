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
  Check,
  ChevronDown,
  LayoutGrid,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Build file tree
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
      'ts': 'typescript', 'tsx': 'typescript', 'js': 'javascript', 'jsx': 'javascript',
      'py': 'python', 'go': 'go', 'rs': 'rust', 'java': 'java',
      'json': 'json', 'md': 'markdown', 'css': 'css', 'scss': 'scss',
      'html': 'html', 'svg': 'svg', 'png': 'image', 'jpg': 'image',
      'mp3': 'audio', 'mp4': 'video', 'zip': 'archive',
      'txt': 'text', 'yml': 'yaml', 'yaml': 'yaml',
    };
    return langMap[ext || ''] || 'text';
  }, []);

  const getFileIcon = useCallback((node: FileNode, isActive: boolean = false) => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path);
      return isExpanded ? (
        <FolderOpen size={16} className="text-accent flex-shrink-0" />
      ) : (
        <Folder size={16} className="text-muted-foreground flex-shrink-0" />
      );
    }
    
    const lang = node.language || 'text';
    const iconMap: Record<string, { icon: any; color: string }> = {
      typescript: { icon: FileCode, color: isActive ? 'text-accent' : 'text-blue-400' },
      javascript: { icon: FileCode, color: isActive ? 'text-accent' : 'text-yellow-400' },
      python: { icon: FileCode, color: isActive ? 'text-accent' : 'text-blue-300' },
      json: { icon: FileJson, color: isActive ? 'text-accent' : 'text-yellow-300' },
      markdown: { icon: FileText, color: isActive ? 'text-accent' : 'text-blue-300' },
      css: { icon: FileCode, color: isActive ? 'text-accent' : 'text-blue-400' },
      html: { icon: FileCode, color: isActive ? 'text-accent' : 'text-orange-400' },
      text: { icon: FileText, color: isActive ? 'text-accent' : 'text-muted-foreground' },
    };
    
    const config = iconMap[lang] || iconMap['text'];
    const Icon = config.icon;
    return <Icon size={16} className={cn("flex-shrink-0", config.color)} />;
  }, [expandedFolders]);

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

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = node.path === activePath;
    const isFolder = node.type === 'folder';
    const isRenaming = renameState.path === node.path;
    
    return (
      <div key={node.path}>
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 pr-2 cursor-pointer transition-colors select-none',
            isActive 
              ? 'bg-accent/10 text-foreground border-l-2 border-accent' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent',
            depth > 0 && 'ml-2'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (isRenaming) return;
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              onSelectPath(node.path);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              node,
            });
          }}
        >
          {isFolder && (
            <ChevronRight 
              size={14} 
              className={cn(
                "flex-shrink-0 transition-transform",
                isExpanded && "rotate-90"
              )} 
            />
          )}
          {!isFolder && <span className="w-3.5" />}
          
          {getFileIcon(node, isActive)}
          
          {isRenaming ? (
            <input
              type="text"
              value={renameState.value}
              onChange={(e) => setRenameState({ ...renameState, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (renameState.value.trim() && onRenameFile) {
                    const dir = renameState.path!.substring(0, renameState.path!.lastIndexOf('/'));
                    onRenameFile(renameState.path!, `${dir}/${renameState.value.trim()}`);
                  }
                  setRenameState({ path: null, value: '' });
                }
                if (e.key === 'Escape') {
                  setRenameState({ path: null, value: '' });
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 text-sm bg-background border border-accent rounded px-1 py-0 focus:outline-none"
              autoFocus
            />
          ) : (
            <span className={cn(
              "text-sm truncate flex-1 min-w-0",
              isActive && "text-foreground font-medium"
            )}>
              {node.name}
            </span>
          )}
        </div>
        
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fileTree = useMemo(() => buildFileTree(), [buildFileTree]);

  return (
    <div className={cn('flex flex-col h-full bg-sidebar', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Files
        </span>
        <div className="flex items-center gap-1">
          {onCreateFile && (
            <button
              onClick={() => {
                setNewFilePath('/untitled.ts');
                setShowNewFileDialog(true);
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="New File"
            >
              <Plus size={14} />
            </button>
          )}
          {onCreateFolder && (
            <button
              onClick={() => {
                setNewFolderPath('/new-folder');
                setShowNewFolderDialog(true);
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="New Folder"
            >
              <FolderPlus size={14} />
            </button>
          )}
          <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-7 pr-2 py-1 text-xs bg-muted rounded border border-transparent focus:border-accent focus:outline-none transition-colors placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No files yet
          </div>
        ) : (
          <div>
            {fileTree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 min-w-40 bg-popover border border-border rounded-lg shadow-lg py-1"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              top: Math.min(contextMenu.y, window.innerHeight - 200),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node?.type === 'file' ? (
              <>
                <button
                  onClick={() => {
                    if (contextMenu.node) onSelectPath(contextMenu.node.path);
                    setContextMenu({ visible: false, x: 0, y: 0, node: null });
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/10 flex items-center gap-2 transition-colors"
                >
                  <FileCode size={14} />
                  Open
                </button>
                {onRenameFile && (
                  <button
                    onClick={() => {
                      setRenameState({ path: contextMenu.node!.path, value: contextMenu.node!.name });
                      setContextMenu({ visible: false, x: 0, y: 0, node: null });
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/10 flex items-center gap-2 transition-colors"
                  >
                    <Edit3 size={14} />
                    Rename
                  </button>
                )}
                {onDeleteFile && (
                  <>
                    <div className="my-1 border-t border-border mx-2" />
                    <button
                      onClick={() => {
                        onDeleteFile(contextMenu.node!.path);
                        setContextMenu({ visible: false, x: 0, y: 0, node: null });
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {onCreateFile && (
                  <button
                    onClick={() => {
                      const folder = contextMenu.node!.path;
                      setNewFilePath(folder === '/' ? '/untitled.ts' : `${folder}/untitled.ts`);
                      setShowNewFileDialog(true);
                      setContextMenu({ visible: false, x: 0, y: 0, node: null });
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/10 flex items-center gap-2 transition-colors"
                  >
                    <Plus size={14} />
                    New File
                  </button>
                )}
                {onCreateFolder && (
                  <button
                    onClick={() => {
                      const folder = contextMenu.node!.path;
                      setNewFolderPath(folder === '/' ? '/new-folder' : `${folder}/new-folder`);
                      setShowNewFolderDialog(true);
                      setContextMenu({ visible: false, x: 0, y: 0, node: null });
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/10 flex items-center gap-2 transition-colors"
                  >
                    <FolderPlus size={14} />
                    New Folder
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">New File</h3>
              <button onClick={() => setShowNewFileDialog(false)} className="p-1 hover:bg-muted rounded">
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onCreateFile?.(newFilePath, '');
                  setShowNewFileDialog(false);
                  setNewFilePath('');
                }
              }}
              placeholder="path/to/file.ts"
              className="w-full px-3 py-2 text-sm bg-muted rounded border border-border focus:border-accent focus:outline-none mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewFileDialog(false)} className="px-3 py-1.5 text-sm hover:bg-muted rounded transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => {
                  onCreateFile?.(newFilePath, '');
                  setShowNewFileDialog(false);
                  setNewFilePath('');
                }}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">New Folder</h3>
              <button onClick={() => setShowNewFolderDialog(false)} className="p-1 hover:bg-muted rounded">
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onCreateFolder?.(newFolderPath);
                  setShowNewFolderDialog(false);
                  setNewFolderPath('');
                }
              }}
              placeholder="path/to/folder"
              className="w-full px-3 py-2 text-sm bg-muted rounded border border-border focus:border-accent focus:outline-none mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewFolderDialog(false)} className="px-3 py-1.5 text-sm hover:bg-muted rounded transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => {
                  onCreateFolder?.(newFolderPath);
                  setShowNewFolderDialog(false);
                  setNewFolderPath('');
                }}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(FileExplorerComponent, (prevProps, nextProps) => {
  return (
    prevProps.files === nextProps.files &&
    prevProps.activePath === nextProps.activePath &&
    prevProps.className === nextProps.className &&
    prevProps.projectId === nextProps.projectId
  );
});
