"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileTreeNode } from "@/lib/project-types";

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

export default function FileTree({ nodes, selectedPath, onSelectFile }: FileTreeProps) {
  return (
    <div className="text-sm font-mono">
      {nodes.map((node) => (
        <FileTreeNodeComponent
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          depth={0}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeComponentProps {
  node: FileTreeNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
}

function FileTreeNodeComponent({
  node,
  selectedPath,
  onSelectFile,
  depth,
}: FileTreeNodeComponentProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = node.path === selectedPath;
  const isFolder = node.type === "folder";

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  // Get file icon based on language/extension
  const getFileIcon = () => {
    const iconClass = "w-4 h-4 flex-shrink-0";
    
    if (isFolder) {
      return isOpen ? (
        <FolderOpen className={cn(iconClass, "text-amber-500")} />
      ) : (
        <Folder className={cn(iconClass, "text-amber-500")} />
      );
    }
    
    // Color based on file type
    const colorMap: Record<string, string> = {
      tsx: "text-blue-400",
      typescript: "text-blue-400",
      jsx: "text-yellow-400",
      javascript: "text-yellow-400",
      json: "text-yellow-500",
      css: "text-pink-400",
      scss: "text-pink-400",
      html: "text-orange-400",
      markdown: "text-gray-400",
      python: "text-green-400",
      rust: "text-orange-500",
      go: "text-cyan-400",
    };
    
    const color = colorMap[node.language || ""] || "text-gray-400";
    return <File className={cn(iconClass, color)} />;
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-muted/50",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder && (
          <span className="w-4 h-4 flex items-center justify-center">
            {isOpen ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </span>
        )}
        {!isFolder && <span className="w-4" />}
        {getFileIcon()}
        <span className="truncate">{node.name}</span>
      </div>
      
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNodeComponent
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
