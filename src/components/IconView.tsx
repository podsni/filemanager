import { useState, useRef } from "react";
import { Folder, FolderOpen, Check, Download, Trash2, FolderInput, Eye, GripVertical } from "lucide-react";
import { FileIcon } from "./FileIcon";
import { cn } from "@/lib/utils";

interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
  type: string;
  isDirectory: boolean;
  path: string;
}

interface IconViewProps {
  files: FileInfo[];
  selectedFiles: Set<string>;
  focusedFile: FileInfo | null;
  onSelect: (file: FileInfo) => void;
  onToggleSelect: (path: string) => void;
  onNavigate: (path: string) => void;
  onPreview: (file: FileInfo) => void;
  onDownload: (path: string) => void;
  onDelete: (path: string) => Promise<void>;
  onMove: (file: FileInfo) => void;
  onDragStart?: (file: FileInfo) => void;
  onDrop?: (targetPath: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function IconView({
  files,
  selectedFiles,
  focusedFile,
  onSelect,
  onToggleSelect,
  onNavigate,
  onPreview,
  onDownload,
  onDelete,
  onMove,
  onDragStart,
  onDrop,
}: IconViewProps) {
  const [contextMenu, setContextMenu] = useState<{ file: FileInfo; x: number; y: number } | null>(null);

  const handleDoubleClick = (file: FileInfo) => {
    if (file.isDirectory) {
      onNavigate(file.path);
    } else {
      onPreview(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileInfo) => {
    e.preventDefault();
    setContextMenu({ file, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDelete = async (file: FileInfo) => {
    await onDelete(file.path);
    closeContextMenu();
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
          <Folder className="size-8 text-muted-foreground/60" />
        </div>
        <h3 className="font-medium text-foreground">No files</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Drop files here or create a folder
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1 sm:gap-2 p-3 sm:p-4">
        {files.map((file, index) => (
          <IconItem
            key={file.path}
            file={file}
            index={index}
            isSelected={selectedFiles.has(file.path)}
            isFocused={focusedFile?.path === file.path}
            onSelect={onSelect}
            onToggleSelect={onToggleSelect}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onDragStart={onDragStart}
            onDrop={onDrop}
          />
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
            onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
          />
          <div
            className="fixed z-50 surface-panel rounded-xl py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {!contextMenu.file.isDirectory && (
              <>
                <ContextMenuItem
                  icon={<Eye className="size-4" />}
                  label="Preview"
                  onClick={() => { onPreview(contextMenu.file); closeContextMenu(); }}
                />
                <ContextMenuItem
                  icon={<Download className="size-4" />}
                  label="Download"
                  onClick={() => { onDownload(contextMenu.file.path); closeContextMenu(); }}
                />
                <div className="h-px bg-border my-1" />
              </>
            )}
            <ContextMenuItem
              icon={<FolderInput className="size-4" />}
              label="Move to..."
              onClick={() => { onMove(contextMenu.file); closeContextMenu(); }}
            />
            <div className="h-px bg-border my-1" />
            <ContextMenuItem
              icon={<Trash2 className="size-4" />}
              label="Delete"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(contextMenu.file)}
            />
          </div>
        </>
      )}
    </>
  );
}

function ContextMenuItem({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors",
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function IconItem({
  file,
  index,
  isSelected,
  isFocused,
  onSelect,
  onToggleSelect,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDrop,
}: {
  file: FileInfo;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (file: FileInfo) => void;
  onToggleSelect: (path: string) => void;
  onDoubleClick: (file: FileInfo) => void;
  onContextMenu: (e: React.MouseEvent, file: FileInfo) => void;
  onDragStart?: (file: FileInfo) => void;
  onDrop?: (targetPath: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", file.path);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    onDragStart?.(file);

    // Create a custom drag image
    const dragEl = e.currentTarget.cloneNode(true) as HTMLElement;
    dragEl.style.position = "absolute";
    dragEl.style.top = "-1000px";
    dragEl.style.opacity = "0.9";
    dragEl.style.transform = "scale(0.8)";
    document.body.appendChild(dragEl);
    e.dataTransfer.setDragImage(dragEl, 50, 50);
    setTimeout(() => document.body.removeChild(dragEl), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
    dragCounterRef.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (file.isDirectory && !isDragging) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (file.isDirectory && !isDragging) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;
    if (file.isDirectory && onDrop && !isDragging) {
      onDrop(file.path);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onToggleSelect(file.path);
    } else {
      onSelect(file);
    }
  };

  return (
    <div
      draggable
      onClick={handleClick}
      onDoubleClick={() => onDoubleClick(file)}
      onContextMenu={(e) => onContextMenu(e, file)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
      className={cn(
        "file-tile relative flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group animate-in fade-in-0 slide-in-from-bottom-1",
        isSelected && "bg-primary/10 ring-1 ring-primary/50",
        isFocused && !isSelected && "bg-muted/55 ring-1 ring-border/70",
        !isSelected && !isFocused && "hover:bg-muted/45",
        isDragOver && "bg-primary/15 ring-2 ring-primary",
        isDragging && "opacity-40 scale-95"
      )}
    >
      {/* Drag handle indicator on hover */}
      <div className={cn(
        "absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity",
        isDragging && "opacity-0"
      )}>
        <GripVertical className="size-3.5 text-muted-foreground" />
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 size-5 rounded-full bg-primary flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}

      {/* Icon */}
      <div className={cn(
        "size-16 rounded-xl flex items-center justify-center mb-3 transition-all duration-300",
        file.isDirectory ? "bg-amber-500/10" : "bg-muted/55",
        isDragOver && "bg-primary/30 animate-pulse",
        !isDragging && "group-hover:-translate-y-0.5"
      )}>
        {file.isDirectory ? (
          isDragOver ? (
            <FolderOpen className="size-10 text-primary" />
          ) : (
            <Folder className="size-10 text-amber-500 fill-amber-500/20" />
          )
        ) : (
          <FileIcon type={file.type} className="size-9 drop-shadow-sm" />
        )}
      </div>

      {/* Name */}
      <p className={cn(
        "text-xs text-center line-clamp-2 w-full break-all leading-tight font-medium transition-colors",
        isSelected ? "text-primary" : "text-foreground/90 group-hover:text-foreground"
      )}>
        {file.name}
      </p>

      {/* Size for files */}
      {!file.isDirectory && (
        <p className="text-[10px] text-muted-foreground/70 mt-1 font-normal">
          {formatBytes(file.size)}
        </p>
      )}

      {/* Drop target indicator */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary rounded-xl pointer-events-none" />
      )}
    </div>
  );
}
