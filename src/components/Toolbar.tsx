import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  List,
  Columns,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderPlus,
  Trash2,
  SidebarClose,
  SidebarOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SortField, SortOrder } from "@/hooks/useFiles";

export type ViewMode = "icon" | "list" | "column";

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  showHidden: boolean;
  onToggleHidden: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onToggleSort: (field: SortField) => void;
  onSettings: () => void;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "name", label: "Name" },
  { field: "size", label: "Size" },
  { field: "createdAt", label: "Date" },
  { field: "type", label: "Type" },
];

export function Toolbar({
  viewMode,
  onViewModeChange,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onRefresh,
  onNewFolder,
  onDeleteSelected,
  selectedCount,
  showSidebar,
  onToggleSidebar,
  showPreview,
  onTogglePreview,
  showHidden,
  onToggleHidden,
  searchQuery,
  onSearchChange,
  loading,
  sortField,
  sortOrder,
  onToggleSort,
  onSettings,
}: ToolbarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.field === sortField)?.label || "Name";

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-transparent">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        title={showSidebar ? "Hide sidebar" : "Show sidebar"}
        className="shrink-0 hover:bg-muted/50 rounded-xl"
      >
        {showSidebar ? (
          <SidebarClose className="size-4.5" />
        ) : (
          <SidebarOpen className="size-4.5" />
        )}
      </Button>

      <div className="w-px h-5 bg-border/40 mx-1" />

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack}
          title="Go back"
          className="hover:bg-muted/50 rounded-xl"
        >
          <ChevronLeft className="size-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onForward}
          disabled={!canGoForward}
          title="Go forward"
          className="hover:bg-muted/50 rounded-xl"
        >
          <ChevronRight className="size-4.5" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border/40 mx-1" />

      {/* View mode toggle */}
      <div className="flex items-center bg-muted/30 rounded-xl p-1 shadow-inner border border-border/20">
        <ViewModeButton
          active={viewMode === "icon"}
          onClick={() => onViewModeChange("icon")}
          title="Icon view"
        >
          <LayoutGrid className="size-4" />
        </ViewModeButton>
        <ViewModeButton
          active={viewMode === "list"}
          onClick={() => onViewModeChange("list")}
          title="List view"
        >
          <List className="size-4" />
        </ViewModeButton>
        <ViewModeButton
          active={viewMode === "column"}
          onClick={() => onViewModeChange("column")}
          title="Column view"
        >
          <Columns className="size-4" />
        </ViewModeButton>
      </div>

      <div className="w-px h-5 bg-border/40 mx-1" />

      {/* Sort dropdown */}
      <div className="relative" ref={sortMenuRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3"
          title="Sort files"
        >
          <ArrowUpDown className="size-3.5" />
          <span className="hidden sm:inline font-medium text-xs tracking-tight">{currentSortLabel}</span>
          {sortOrder === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}
        </Button>

        {/* Sort dropdown menu */}
        {showSortMenu && (
          <div className="absolute top-full left-0 mt-2 w-48 glass rounded-xl py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="px-3 py-1 mb-1 border-b border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort by</span>
            </div>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.field}
                onClick={() => {
                  onToggleSort(option.field);
                  if (option.field !== sortField) {
                    setShowSortMenu(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-primary/5 transition-colors",
                  option.field === sortField && "text-primary font-semibold"
                )}
              >
                <span>{option.label}</span>
                {option.field === sortField && (
                  <span className="flex items-center gap-1">
                    {sortOrder === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )}
                    <Check className="size-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-border/40 mx-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewFolder}
          title="New folder"
          className="hover:bg-muted/50 rounded-xl"
        >
          <FolderPlus className="size-4.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
          className="hover:bg-muted/50 rounded-xl"
        >
          <RefreshCw className={cn("size-4.5", loading && "animate-spin")} />
        </Button>
      </div>

      {selectedCount > 0 && (
        <>
          <div className="w-px h-5 bg-border/40 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteSelected}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl font-medium"
          >
            <Trash2 className="size-4.5" />
            <span className="hidden sm:inline">Delete ({selectedCount})</span>
          </Button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative group hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items..."
          className="w-56 h-9 pl-10 pr-8 text-xs font-medium bg-muted/40 border border-transparent rounded-xl placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background/80 focus:border-border/50 transition-colors duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-5 rounded-lg bg-muted-foreground/10 hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-border/40 mx-1 hidden sm:block" />

      {/* Settings, Hidden & Preview */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleHidden}
          title={showHidden ? "Hide hidden files" : "Show hidden files"}
          className={cn(
            "shrink-0 hover:bg-muted/50 rounded-xl",
            showHidden && "text-primary bg-primary/5"
          )}
        >
          {showHidden ? (
            <Eye className="size-4.5" />
          ) : (
            <EyeOff className="size-4.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          title="Settings"
          className="shrink-0 hover:bg-muted/50 rounded-xl"
        >
          <Settings className="size-4.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePreview}
          title={showPreview ? "Hide preview" : "Show preview"}
          className="shrink-0 hover:bg-muted/50 rounded-xl"
        >
          {showPreview ? (
            <PanelRightClose className="size-4.5" />
          ) : (
            <PanelRightOpen className="size-4.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function ViewModeButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "size-7 rounded-lg flex items-center justify-center transition-all duration-300",
        active
          ? "bg-background shadow-sm text-primary"
          : "text-muted-foreground/70 hover:text-foreground hover:bg-background/30"
      )}
    >
      {children}
    </button>
  );
}
