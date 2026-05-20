import { useEffect, useMemo, useRef, useState } from "react";
import {
  Command,
  CornerDownLeft,
  FileText,
  Folder,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandPaletteAction {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  run: () => void;
}

export interface CommandPaletteFile {
  name: string;
  type: string;
  isDirectory: boolean;
  path: string;
}

export type CommandPaletteItem =
  | {
      id: string;
      kind: "action";
      label: string;
      description?: string;
      action: CommandPaletteAction;
    }
  | {
      id: string;
      kind: "file";
      label: string;
      description: string;
      file: CommandPaletteFile;
    };

interface BuildCommandPaletteItemsOptions {
  query: string;
  actions: CommandPaletteAction[];
  files: CommandPaletteFile[];
  maxItems?: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandPaletteAction[];
  files: CommandPaletteFile[];
  onOpenFile: (file: CommandPaletteFile) => void;
  onOpenFolder: (path: string) => void;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(values: string[], query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return values.some((value) => normalize(value).includes(normalizedQuery));
}

export function buildCommandPaletteItems({
  query,
  actions,
  files,
  maxItems,
}: BuildCommandPaletteItemsOptions): CommandPaletteItem[] {
  const actionItems = actions
    .filter((action) =>
      matchesQuery([action.label, action.description ?? "", ...(action.keywords ?? [])], query),
    )
    .map<CommandPaletteItem>((action) => ({
      id: `action:${action.id}`,
      kind: "action",
      label: action.label,
      description: action.description,
      action,
    }));

  const fileItems = files
    .filter((file) => matchesQuery([file.name, file.path, file.type], query))
    .map<CommandPaletteItem>((file) => ({
      id: `file:${file.path}`,
      kind: "file",
      label: file.name,
      description: file.isDirectory ? "Open folder" : file.path,
      file,
    }));

  const items = [...actionItems, ...fileItems];
  return typeof maxItems === "number" ? items.slice(0, maxItems) : items;
}

export function getNextCommandIndex(currentIndex: number, delta: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return (currentIndex + delta + itemCount) % itemCount;
}

export function CommandPalette({
  isOpen,
  onClose,
  actions,
  files,
  onOpenFile,
  onOpenFolder,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () => buildCommandPaletteItems({ query, actions, files, maxItems: 12 }),
    [actions, files, query],
  );

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const runItem = (item: CommandPaletteItem | undefined) => {
    if (!item) return;
    if (item.kind === "action") {
      item.action.run();
    } else if (item.file.isDirectory) {
      onOpenFolder(item.file.path);
    } else {
      onOpenFile(item.file);
    }
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => getNextCommandIndex(current, 1, items.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => getNextCommandIndex(current, -1, items.length));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      runItem(items[activeIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 px-4 pt-[12dvh]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="surface-panel relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files or run a command"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
          />
          <div className="hidden items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-1 text-[10px] font-semibold text-muted-foreground sm:flex">
            <Command className="size-3" />
            <span>K</span>
          </div>
        </div>

        <div className="max-h-[52dvh] overflow-y-auto p-2 custom-scrollbar">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-muted">
                <Search className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No matches</p>
              <p className="mt-1 text-xs text-muted-foreground">Try another file name or command.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runItem(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    index === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {item.kind === "action" ? (
                      <Command className="size-4" />
                    ) : item.file.isDirectory ? (
                      <Folder className="size-4 text-amber-500" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{item.label}</span>
                    {item.description && (
                      <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </span>
                  {index === activeIndex && (
                    <CornerDownLeft className="size-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
