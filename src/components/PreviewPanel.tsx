import { useState, useEffect } from "react";
import {
  X,
  Download,
  Trash2,
  FolderInput,
  Calendar,
  HardDrive,
  FileType,
  Clock,
  ChevronDown,
  ChevronRight,
  Eye,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface PreviewPanelProps {
  file: FileInfo | null;
  onClose: () => void;
  onDownload: (path: string) => void;
  onDelete: (path: string) => Promise<void>;
  onMove: (file: FileInfo) => void;
  onPreview: (file: FileInfo) => void;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        {title}
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export function PreviewPanel({
  file,
  onClose,
  onDownload,
  onDelete,
  onMove,
  onPreview,
}: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const ext = getFileExtension(file.name);
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);

    if (isImage) {
      setImageLoading(true);
      setPreviewUrl(`/api/files/${encodeURIComponent(file.path)}`);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-muted/20">
        <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Eye className="size-8 text-muted-foreground/40" />
        </div>
        <h3 className="font-medium text-muted-foreground">No selection</h3>
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-[180px]">
          Select a file or folder to see its details
        </p>
      </div>
    );
  }

  const ext = getFileExtension(file.name);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext);
  const isAudio = ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext);

  const handleDelete = async () => {
    await onDelete(file.path);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Info
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="size-6 rounded-md"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Preview thumbnail */}
        <div className="p-6 flex flex-col items-center border-b bg-muted/20">
          {isImage && previewUrl ? (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted/50 shadow-lg">
              {imageLoading && (
                <div className="absolute inset-0 skeleton-shimmer" />
              )}
              <img
                src={previewUrl}
                alt={file.name}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => setImageLoading(false)}
              />
            </div>
          ) : (isVideo || isAudio) ? (
            <div
              onClick={() => onPreview(file)}
              className="w-full aspect-square rounded-xl bg-primary/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/15 transition-colors"
            >
              <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Play className="size-8 text-primary ml-1" />
              </div>
              <span className="text-sm font-medium text-primary">
                {isVideo ? "Play Video" : "Play Audio"}
              </span>
            </div>
          ) : (
            <div className="size-24 rounded-2xl bg-muted/50 flex items-center justify-center shadow-lg">
              <FileIcon type={file.isDirectory ? "folder" : file.type} className="size-12" />
            </div>
          )}

          {/* File name */}
          <h3 className="mt-4 text-sm font-semibold text-center px-2 break-all line-clamp-2">
            {file.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {file.isDirectory ? "Folder" : ext.toUpperCase() + " File"}
          </p>
        </div>

        {/* Info sections */}
        <Section title="General">
          {!file.isDirectory && (
            <InfoRow
              icon={<HardDrive className="size-4" />}
              label="Size"
              value={formatBytes(file.size)}
            />
          )}
          <InfoRow
            icon={<FileType className="size-4" />}
            label="Type"
            value={file.isDirectory ? "Folder" : file.type || "Unknown"}
          />
          <InfoRow
            icon={<Calendar className="size-4" />}
            label="Created"
            value={formatDate(file.createdAt)}
          />
          <InfoRow
            icon={<Clock className="size-4" />}
            label="Time"
            value={formatTime(file.createdAt)}
          />
        </Section>

        <Section title="Tags" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 py-1">
            {["Red", "Orange", "Yellow", "Green", "Blue", "Purple"].map((tag) => (
              <button
                key={tag}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs hover:bg-muted transition-colors"
              >
                <div
                  className={cn(
                    "size-2.5 rounded-full",
                    tag === "Red" && "bg-red-500",
                    tag === "Orange" && "bg-orange-500",
                    tag === "Yellow" && "bg-yellow-500",
                    tag === "Green" && "bg-green-500",
                    tag === "Blue" && "bg-blue-500",
                    tag === "Purple" && "bg-purple-500"
                  )}
                />
                {tag}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Actions */}
      <div className="p-3 border-t bg-card/50 space-y-2">
        {!file.isDirectory && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(file)}
              className="gap-1.5"
            >
              <Eye className="size-3.5" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(file.path)}
              className="gap-1.5"
            >
              <Download className="size-3.5" />
              Download
            </Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMove(file)}
            className="gap-1.5"
          >
            <FolderInput className="size-3.5" />
            Move
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
