'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  ExternalLink, 
  Copy, 
  Play, 
  Code, 
  Maximize2,
  X,
  ChevronDown,
  FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractiveCodeBlock } from './InteractiveCodeBlock';

interface ArtifactFile {
  path: string;
  code: string;
  language: string;
}

interface ArtifactCardProps {
  id: string;
  title: string;
  description?: string;
  files: ArtifactFile[];
  previewUrl?: string;
  isExpanded?: boolean;
  className?: string;
  onEdit?: (file: ArtifactFile) => void;
  onApply?: (files: ArtifactFile[]) => void;
  onCopy?: (code: string) => void;
}

export function ArtifactCard({
  title,
  description,
  files,
  previewUrl,
  isExpanded = true,
  className,
  onEdit,
  onApply,
  onCopy,
}: ArtifactCardProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activeFile = files[activeFileIndex];
  const hasMultipleFiles = files.length > 1;

  const handleApply = () => {
    onApply?.(files);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl border border-border/40 bg-card shadow-lg overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 bg-muted/30 border-b border-border/40">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Box size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
                {hasMultipleFiles && (
                  <span className="text-xs text-muted-foreground">•</span>
                )}
                {hasMultipleFiles && (
                  <select
                    value={activeFileIndex}
                    onChange={(e) => setActiveFileIndex(Number(e.target.value))}
                    className="text-xs bg-background border border-border/40 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {files.map((file, i) => (
                      <option key={i} value={i}>
                        {file.path}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {previewUrl && (
              <button
                onClick={() => setShowPreview(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                title="Live preview"
              >
                <Play size={16} />
              </button>
            )}
            
            <button
              onClick={() => setShowFullscreen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <ChevronDown size={16} className={cn(expanded && 'rotate-180 transition-transform')} />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* File Preview */}
              <div className="p-4 space-y-4">
                {activeFile && (
                  <InteractiveCodeBlock
                    code={activeFile.code}
                    language={activeFile.language}
                    filename={activeFile.path}
                    maxHeight={300}
                    onApply={() => onEdit?.(activeFile)}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(activeFile)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                    >
                      <Code size={14} />
                      Edit
                    </button>
                    
                    {hasMultipleFiles && (
                      <button
                        onClick={handleApply}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/70 text-muted-foreground rounded-lg transition-colors"
                      >
                        <Copy size={14} />
                        Apply All
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onCopy?.(activeFile.code)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/70 text-muted-foreground rounded-lg transition-colors"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
              </div>

              {/* File List */}
              {hasMultipleFiles && (
                <div className="border-t border-border/40 p-4 bg-muted/20">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    All Files
                  </h4>
                  <div className="space-y-1">
                    {files.map((file, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveFileIndex(i)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-colors',
                          i === activeFileIndex
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <FileCode size={14} />
                        <span className="flex-1 truncate">{file.path}</span>
                        <span className="text-xs text-muted-foreground">
                          {file.language}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <button
                  onClick={() => setShowFullscreen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
                {activeFile && (
                  <InteractiveCodeBlock
                    code={activeFile.code}
                    language={activeFile.language}
                    filename={activeFile.path}
                    maxHeight={600}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Play size={16} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Live Preview</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open in new tab
                  </a>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-0">
                <iframe
                  src={previewUrl}
                  className="w-full h-[calc(90vh-80px)] border-0"
                  title="Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ArtifactCard;
