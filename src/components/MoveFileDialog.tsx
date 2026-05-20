import { useState, useEffect } from "react";
import { FolderInput, X, Loader2, Folder, FolderOpen, ChevronRight, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface MoveFileDialogProps {
  isOpen: boolean;
  file: FileInfo | null;
  currentPath: string;
  onClose: () => void;
  onMove: (source: string, destination: string) => Promise<void>;
}

export function MoveFileDialog({ isOpen, file, currentPath, onClose, onMove }: MoveFileDialogProps) {
  const [folders, setFolders] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [selectedPath, setSelectedPath] = useState("");
  const [browsePath, setBrowsePath] = useState("");
  const [error, setError] = useState("");

  // Fetch folders when dialog opens or browse path changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchFolders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/files?path=${encodeURIComponent(browsePath)}`);
        const data = await res.json();
        const folderList = (data.files || []).filter((f: FileInfo) => f.isDirectory);
        setFolders(folderList);
      } catch (err) {
        setFolders([]);
      }
      setLoading(false);
    };

    fetchFolders();
  }, [isOpen, browsePath]);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPath("");
      setBrowsePath(currentPath);
      setError("");
    }
  }, [isOpen, currentPath]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setSelectedPath("");
    setBrowsePath("");
    setError("");
    onClose();
  };

  const handleMove = async () => {
    if (!file) return;

    // Prevent moving to the same location
    const fileName = file.path.split("/").pop() || file.name;
    const newPath = selectedPath ? `${selectedPath}/${fileName}` : fileName;

    if (newPath === file.path) {
      setError("File is already in this location");
      return;
    }

    // Prevent moving a folder into itself
    if (file.isDirectory && selectedPath.startsWith(file.path)) {
      setError("Cannot move a folder into itself");
      return;
    }

    setMoving(true);
    setError("");
    try {
      await onMove(file.path, newPath);
      handleClose();
    } catch (err) {
      setError("Failed to move file");
    }
    setMoving(false);
  };

  const navigateToFolder = (path: string) => {
    setBrowsePath(path);
  };

  const selectFolder = (path: string) => {
    setSelectedPath(path);
    setError("");
  };

  const goUp = () => {
    const parts = browsePath.split("/").filter(Boolean);
    parts.pop();
    setBrowsePath(parts.join("/"));
  };

  if (!isOpen || !file) return null;

  const browsePathParts = browsePath ? browsePath.split("/").filter(Boolean) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 animate-in fade-in-0 duration-150"
      onClick={handleClose}
    >
      <div
        className="surface-panel rounded-2xl shadow-xl w-full max-w-lg m-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-muted/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderInput className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Move to Folder</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                Moving: {file.name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={handleClose} className="rounded-lg">
            <X className="size-4" />
          </Button>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="p-3 border-b bg-muted/20">
          <div className="flex items-center gap-1 text-sm overflow-x-auto">
            <button
              onClick={() => navigateToFolder("")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md shrink-0 transition-colors",
                browsePath === "" ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              <Home className="size-3.5" />
              <span>Root</span>
            </button>
            {browsePathParts.map((part, index) => (
              <div key={index} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="size-3.5 text-muted-foreground/50" />
                <button
                  onClick={() => navigateToFolder(browsePathParts.slice(0, index + 1).join("/"))}
                  className={cn(
                    "px-2 py-1 rounded-md transition-colors truncate max-w-[100px]",
                    index === browsePathParts.length - 1 ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  {part}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Folder List */}
        <div className="p-3 max-h-[300px] overflow-auto">
          {/* Select Current Directory Option */}
          <button
            onClick={() => selectFolder(browsePath)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all mb-2",
              selectedPath === browsePath
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="size-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Move here</p>
              <p className="text-xs text-muted-foreground">
                {browsePath || "Root directory"}
              </p>
            </div>
            {selectedPath === browsePath && (
              <div className="ml-auto size-5 rounded-full bg-primary flex items-center justify-center">
                <ArrowRight className="size-3 text-primary-foreground" />
              </div>
            )}
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No subfolders in this directory
            </div>
          ) : (
            <div className="space-y-1">
              {folders
                .filter(f => f.path !== file.path) // Don't show the file being moved if it's a folder
                .map((folder) => (
                <button
                  key={folder.path}
                  onClick={() => selectFolder(folder.path)}
                  onDoubleClick={() => navigateToFolder(folder.path)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                    selectedPath === folder.path
                      ? "bg-primary/10 border border-primary/50"
                      : "hover:bg-muted border border-transparent"
                  )}
                >
                  <div className={cn(
                    "size-10 rounded-lg flex items-center justify-center transition-colors",
                    selectedPath === folder.path ? "bg-amber-500/20" : "bg-muted"
                  )}>
                    <Folder className="size-5 text-amber-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">Double-click to open</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 pb-3">
            <p className="text-destructive text-sm flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-destructive" />
              {error}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-muted/20 rounded-b-2xl">
          <p className="text-xs text-muted-foreground">
            {selectedPath ? `Move to: ${selectedPath || "Root"}` : "Select a destination"}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={moving} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={moving || selectedPath === undefined}
              className="rounded-xl gap-2 min-w-[100px]"
            >
              {moving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <FolderInput className="size-4" />
                  Move
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
