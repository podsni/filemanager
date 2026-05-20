import { useState, useCallback, useRef } from "react";
import { Upload, Loader2, Cloud, ArrowUpFromLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export function DropZone({ onUpload, disabled, compact = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (!disabled && !isUploading && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setIsUploading(true);
      const firstFile = files[0];
      if (firstFile) {
        setUploadProgress({ name: firstFile.name, count: files.length });
      }
      try {
        await onUpload(files);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    }
  }, [onUpload, disabled, isUploading]);

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setIsUploading(true);
      const firstFile = files[0];
      if (firstFile) {
        setUploadProgress({ name: firstFile.name, count: files.length });
      }
      try {
        await onUpload(files);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex items-center gap-3 px-4 py-3 border border-dashed rounded-xl cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/40",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <div className={cn(
          "size-10 rounded-lg flex items-center justify-center transition-colors shrink-0",
          isDragging ? "bg-primary/20" : "bg-muted"
        )}>
          {isUploading ? (
            <Loader2 className="size-5 text-primary animate-spin" />
          ) : isDragging ? (
            <ArrowUpFromLine className="size-5 text-primary" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium transition-colors truncate",
            isDragging ? "text-primary" : "text-foreground"
          )}>
            {isUploading
              ? `Uploading ${uploadProgress?.count || 0} file(s)`
              : isDragging
                ? "Drop files here"
                : "Drop files or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {isUploading
              ? uploadProgress?.name
              : "Supports all file types"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all duration-300 overflow-hidden group",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/40",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="relative flex flex-col items-center gap-3 sm:gap-4">
        {isUploading ? (
          <div className="relative">
            <div className="size-14 sm:size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="size-6 sm:size-8 text-primary animate-spin" />
            </div>
          </div>
        ) : isDragging ? (
          <div className="relative">
            <div className="size-14 sm:size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ArrowUpFromLine className="size-6 sm:size-8 text-primary" />
            </div>
          </div>
        ) : (
          <div className="relative group-hover:scale-110 transition-transform duration-300">
            <Cloud className="size-12 sm:size-16 text-muted-foreground/40 absolute -top-2 left-1/2 -translate-x-1/2" />
            <Upload className="size-6 sm:size-8 text-muted-foreground relative top-3 group-hover:text-primary transition-colors" />
          </div>
        )}

        <div className="space-y-1">
          <p className={cn(
            "text-base sm:text-lg font-semibold transition-colors",
            isDragging ? "text-primary" : "text-foreground"
          )}>
            {isUploading
              ? `Uploading ${uploadProgress?.count || 0} file(s)`
              : isDragging
                ? "Drop to upload"
                : "Drag & drop files here"}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isUploading
              ? uploadProgress?.name
              : "or click anywhere to browse"}
          </p>
        </div>
      </div>
    </div>
  );
}
