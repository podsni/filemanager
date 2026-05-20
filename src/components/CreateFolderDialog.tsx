import { useState, useEffect } from "react";
import { FolderPlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => Promise<void>;
}

export function CreateFolderDialog({ isOpen, onClose, onCreateFolder }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onCreateFolder(name.trim());
      setName("");
      onClose();
    } catch (err) {
      setError("Failed to create folder");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 animate-in fade-in-0 duration-150"
      onClick={handleClose}
    >
      <div
        className="surface-panel rounded-2xl shadow-xl w-full max-w-md m-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-muted/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <FolderPlus className="size-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Create Folder</h2>
              <p className="text-xs text-muted-foreground">Enter a name for your new folder</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={handleClose} className="rounded-lg">
            <X className="size-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter folder name..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              disabled={loading}
              className="h-12 rounded-xl text-base"
            />
            {error && (
              <p className="text-destructive text-sm flex items-center gap-1.5 animate-in slide-in-from-top-1">
                <span className="size-1.5 rounded-full bg-destructive" />
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-xl gap-2 min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="size-4" />
                  Create
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
