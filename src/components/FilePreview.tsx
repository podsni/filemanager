import { useState, useEffect, useRef } from "react";
import { X, Download, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileIcon } from "./FileIcon";
import { CodeHighlight } from "./CodeHighlight";
import { EpubReader } from "./EpubReader";

interface FilePreviewProps {
  file: {
    name: string;
    path: string;
    type: string;
    size: number;
  } | null;
  onClose: () => void;
  onDownload: (path: string) => void;
}

export function FilePreview({ file, onClose, onDownload }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  // Check for dark mode
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  useEffect(() => {
    if (!file) {
      setContent(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const ext = getFileExtension(file.name);
    const url = `/api/files/${encodeURIComponent(file.path)}`;

    // Image files
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
      setContent(url);
      return;
    }

    // Video files
    if (["mp4", "webm", "ogg", "mov"].includes(ext)) {
      setContent(url);
      return;
    }

    // Audio files
    if (["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext)) {
      setContent(url);
      return;
    }

    // PDF files
    if (ext === "pdf") {
      setContent(url);
      return;
    }

    // EPUB files
    if (ext === "epub") {
      setContent(url);
      return;
    }

    // Text/code files
    if (["txt", "md", "json", "js", "ts", "tsx", "jsx", "css", "html", "xml", "yaml", "yml", "log", "sh", "py", "java", "c", "cpp", "h", "go", "rs", "sql", "env", "gitignore", "dockerfile", "makefile", "toml", "ini", "cfg", "conf", "properties", "gradle", "kt", "swift", "rb", "php", "pl", "r", "scala", "vue", "svelte"].includes(ext)) {
      setLoading(true);
      fetch(url)
        .then((res) => res.text())
        .then((text) => setContent(text))
        .catch(() => setContent("Failed to load preview"))
        .finally(() => setLoading(false));
      return;
    }

    setContent(null);
  }, [file]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Media controls
  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const formatTime = (time: number): string => {
    if (!isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFullscreen = () => {
    if (mediaRef.current && mediaRef.current instanceof HTMLVideoElement) {
      mediaRef.current.requestFullscreen();
    }
  };

  if (!file) return null;

  const ext = getFileExtension(file.name);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext);
  const isAudio = ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext);
  const isPdf = ext === "pdf";
  const isEpub = ext === "epub";
  const isCode = ["txt", "md", "json", "js", "ts", "tsx", "jsx", "css", "html", "xml", "yaml", "yml", "log", "sh", "py", "java", "c", "cpp", "h", "go", "rs", "sql", "env", "gitignore", "dockerfile", "makefile", "toml", "ini", "cfg", "conf", "properties", "gradle", "kt", "swift", "rb", "php", "pl", "r", "scala", "vue", "svelte"].includes(ext);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="surface-panel rounded-2xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col m-4 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <FileIcon type={file.type} className="size-5 shrink-0" />
            <span className="font-medium truncate text-sm">{file.name}</span>
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
              ({formatBytes(file.size)})
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDownload(file.path)}
              title="Download"
            >
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-black/5 dark:bg-black/20">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="h-10 w-10 rounded-xl bg-muted skeleton-shimmer" />
            </div>
          ) : isImage && content ? (
            <div className="flex items-center justify-center p-4 min-h-96">
              <img
                src={content}
                alt={file.name}
                className="max-w-full max-h-[75vh] rounded-lg object-contain shadow-lg"
              />
            </div>
          ) : isVideo && content ? (
            <div className="flex flex-col">
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={content}
                className="w-full max-h-[70vh] bg-black"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              {/* Video Controls */}
              <div className="p-4 bg-card border-t space-y-3">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => skip(-10)} title="Rewind 10s">
                      <SkipBack className="size-4" />
                    </Button>
                    <Button variant="default" size="icon" onClick={togglePlay}>
                      {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => skip(10)} title="Forward 10s">
                      <SkipForward className="size-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={handleFullscreen} title="Fullscreen">
                      <Maximize className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : isAudio && content ? (
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="size-32 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <FileIcon type="audio" className="size-16" />
                </div>
                <p className="font-medium text-lg text-center max-w-md truncate">{file.name}</p>
              </div>
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={content}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              {/* Audio Controls */}
              <div className="space-y-4 max-w-md mx-auto">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => skip(-10)} title="Rewind 10s">
                    <SkipBack className="size-5" />
                  </Button>
                  <Button variant="default" size="lg" className="size-16 rounded-full shadow-lg" onClick={togglePlay}>
                    {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 ml-1" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => skip(10)} title="Forward 10s">
                    <SkipForward className="size-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : isPdf && content ? (
            <iframe
              src={content}
              className="w-full h-[80vh] border-0"
              title={file.name}
            />
          ) : isEpub && content ? (
            <EpubReader url={content} fileName={file.name} />
          ) : isCode && content ? (
            <div className="p-4">
              <CodeHighlight code={content} language={ext} isDark={isDark} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 min-h-96 text-center">
              <FileIcon type={file.type} className="size-20 mb-6 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Preview not available</h3>
              <p className="text-muted-foreground mb-6">
                This file type cannot be previewed in the browser.
              </p>
              <Button onClick={() => onDownload(file.path)} className="gap-2">
                <Download className="size-4" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
