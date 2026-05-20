import { useState, useEffect, useMemo, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import type { ViewMode } from "./Toolbar";
import { IconView } from "./IconView";
import { ColumnView } from "./ColumnView";
import { FileList } from "./FileList";
import { PreviewPanel } from "./PreviewPanel";
import { DropZone } from "./DropZone";
import { Breadcrumb } from "./Breadcrumb";
import { FilePreview } from "./FilePreview";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { MoveFileDialog } from "./MoveFileDialog";
import { SettingsDialog } from "./SettingsDialog";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette, type CommandPaletteAction, type CommandPaletteFile } from "./CommandPalette";
import { ConfirmDialog } from "./ConfirmDialog";
import { useFiles } from "@/hooks/useFiles";
import { cn } from "@/lib/utils";
import { Menu, X, Settings, ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
  type: string;
  isDirectory: boolean;
  path: string;
}

// Custom hook for responsive breakpoints
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export function FileManager() {
  const {
    files,
    filteredFiles,
    loading,
    error,
    currentPath,
    searchQuery,
    showHidden,
    toggleShowHidden,
    selectedFiles,
    canGoBack,
    canGoForward,
    sortField,
    sortOrder,
    setSearchQuery,
    toggleSort,
    refresh,
    uploadFiles,
    deleteFile,
    deleteSelected,
    downloadFile,
    createFolder,
    moveFile,
    toggleSelect,
    clearSelection,
    navigateToFolder,
    goBack,
    goForward,
    locations,
    activeLocationIndex,
    switchLocation,
  } = useFiles();

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // UI state - responsive defaults
  const [viewMode, setViewMode] = useState<ViewMode>("icon");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [focusedFile, setFocusedFile] = useState<FileInfo | null>(null);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [moveFileTarget, setMoveFileTarget] = useState<FileInfo | null>(null);
  const [draggedFile, setDraggedFile] = useState<FileInfo | null>(null);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "selected"; count: number }
    | { type: "file"; path: string; name: string }
    | null
  >(null);
  const windowDragCounter = useRef(0);
  const sidebarUserControlled = useRef(false);
  const previewUserControlled = useRef(false);

  // Adjust UI based on screen size
  useEffect(() => {
    if (!sidebarUserControlled.current) {
      setShowSidebar(isDesktop || isTablet);
    }
    if (!previewUserControlled.current) {
      setShowPreview(isDesktop);
    }
  }, [isDesktop, isTablet]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Global drag handling
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      windowDragCounter.current++;
      
      // Only show overlay if dragging actual files from outside the window
      const items = e.dataTransfer?.items;
      if (items && items.length > 0 && items[0]?.kind === "file") {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      windowDragCounter.current--;
      if (windowDragCounter.current === 0) {
        setIsWindowDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsWindowDragging(false);
      windowDragCounter.current = 0;
      
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        uploadFiles(files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [uploadFiles]);

  // Get folders for sidebar
  const folders = files.filter((f) => f.isDirectory);

  const handleDrop = async (targetPath: string) => {
    if (draggedFile && draggedFile.path !== targetPath) {
      const fileName = draggedFile.path.split("/").pop();
      const newPath = targetPath ? `${targetPath}/${fileName}` : fileName;
      if (newPath) {
        await moveFile(draggedFile.path, newPath);
      }
    }
    setDraggedFile(null);
  };

  const handleMoveFile = async (source: string, destination: string) => {
    await moveFile(source, destination);
  };

  const handleSelectFile = (file: FileInfo) => {
    setFocusedFile(file);
    clearSelection();
    toggleSelect(file.path);
    // On mobile, show preview panel when file is selected
    if (isMobile && !file.isDirectory) {
      setShowPreview(true);
    }
  };

  const handleToggleSidebar = () => {
    sidebarUserControlled.current = true;
    setShowSidebar((value) => !value);
  };

  const handleCloseSidebar = () => {
    sidebarUserControlled.current = true;
    setShowSidebar(false);
  };

  const handleTogglePreview = () => {
    previewUserControlled.current = true;
    setShowPreview((value) => !value);
  };

  const handleClosePreview = () => {
    previewUserControlled.current = true;
    setShowPreview(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size > 0) {
      setPendingDelete({ type: "selected", count: selectedFiles.size });
    }
  };

  const handleDeleteFile = async (path: string) => {
    const file = files.find((item) => item.path === path);
    setPendingDelete({
      type: "file",
      path,
      name: file?.name ?? path.split("/").pop() ?? path,
    });
  };

  const handleConfirmDelete = () => {
    const request = pendingDelete;
    setPendingDelete(null);

    void (async () => {
      if (!request) return;
      if (request.type === "selected") {
        await deleteSelected();
        setFocusedFile(null);
        return;
      }

      await deleteFile(request.path);
      if (focusedFile?.path === request.path) {
        setFocusedFile(null);
      }
      if (previewFile?.path === request.path) {
        setPreviewFile(null);
      }
    })();
  };

  const commandActions = useMemo<CommandPaletteAction[]>(() => {
    return [
      {
        id: "refresh",
        label: "Refresh files",
        description: "Reload the current folder",
        keywords: ["reload", "sync"],
        run: () => void refresh(),
      },
      {
        id: "new-folder",
        label: "New folder",
        description: "Create a folder in the current location",
        keywords: ["create", "directory"],
        run: () => setShowCreateFolder(true),
      },
      {
        id: "toggle-sidebar",
        label: showSidebar ? "Hide sidebar" : "Show sidebar",
        description: "Toggle the locations panel",
        keywords: ["locations", "panel"],
        run: handleToggleSidebar,
      },
      {
        id: "toggle-preview",
        label: showPreview ? "Hide preview" : "Show preview",
        description: "Toggle the details panel",
        keywords: ["info", "details", "panel"],
        run: handleTogglePreview,
      },
      {
        id: "toggle-hidden",
        label: showHidden ? "Hide hidden files" : "Show hidden files",
        description: "Toggle dotfiles in the file list",
        keywords: ["dotfiles", "visibility"],
        run: toggleShowHidden,
      },
      {
        id: "view-icon",
        label: "Icon view",
        description: "Show files as a grid",
        keywords: ["grid"],
        run: () => setViewMode("icon"),
      },
      {
        id: "view-list",
        label: "List view",
        description: "Show files as rows",
        keywords: ["rows", "table"],
        run: () => setViewMode("list"),
      },
      {
        id: "view-column",
        label: "Column view",
        description: "Show files in columns",
        keywords: ["finder"],
        run: () => setViewMode("column"),
      },
      {
        id: "clear-search",
        label: "Clear search",
        description: "Reset the current search query",
        keywords: ["reset", "filter"],
        run: () => setSearchQuery(""),
      },
    ];
  }, [refresh, showHidden, showPreview, showSidebar, toggleShowHidden]);

  const commandFiles = useMemo<CommandPaletteFile[]>(
    () => filteredFiles.map((file) => ({
      name: file.name,
      type: file.type,
      isDirectory: file.isDirectory,
      path: file.path,
    })),
    [filteredFiles],
  );

  const handleCommandOpenFile = (file: CommandPaletteFile) => {
    const target = files.find((item) => item.path === file.path);
    if (!target || target.isDirectory) return;
    setFocusedFile(target);
    clearSelection();
    toggleSelect(target.path);
    setPreviewFile(target);
  };

  const handleCommandOpenFolder = (path: string) => {
    navigateToFolder(path);
    closeMobileOverlays();
  };

  const getDeleteDialogCopy = () => {
    if (!pendingDelete) {
      return { title: "", description: "" };
    }
    if (pendingDelete.type === "selected") {
      return {
        title: `Delete ${pendingDelete.count} items?`,
        description: "This will remove the selected files and folders from the current storage location.",
      };
    }
    return {
      title: `Delete "${pendingDelete.name}"?`,
      description: "This item will be removed from the current storage location.",
    };
  };

  const closeMobileOverlays = () => {
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-background overflow-hidden relative app-shell">
      {/* Global Drop Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-[100] bg-background/85 flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl aspect-video border-2 border-dashed border-primary/70 rounded-3xl bg-card/95 flex flex-col items-center justify-center gap-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="size-24 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ArrowUpFromLine className="size-12 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Drop to Upload</h2>
              <p className="text-muted-foreground font-medium">Your files will be uploaded to the current folder</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/95 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="hover:bg-primary/10"
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="font-semibold text-lg tracking-tight">File Magnet</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="hover:bg-primary/10"
          >
            <Settings className="size-5" />
          </Button>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Mobile Sidebar Overlay */}
        {isMobile && showSidebar && (
          <div
            className="fixed inset-0 bg-foreground/25 z-40 animate-in fade-in duration-200"
            onClick={handleCloseSidebar}
          />
        )}

        {/* Sidebar */}
        {(showSidebar || !isMobile) && showSidebar && (
          <div className={cn(
            "shrink-0 transition-all duration-300 ease-in-out",
            isMobile
              ? "fixed inset-y-0 left-0 z-50 w-[280px] shadow-xl bg-card border-r"
              : "w-[240px] border-r bg-sidebar"
          )}>
            {isMobile && (
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseSidebar}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-5" />
                </Button>
              </div>
            )}
            <Sidebar
              currentPath={currentPath}
              onNavigate={(path) => {
                navigateToFolder(path);
                closeMobileOverlays();
              }}
              folders={folders}
              locations={locations}
              activeLocationIndex={activeLocationIndex}
              onSwitchLocation={switchLocation}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Toolbar */}
          {!isMobile && (
            <div className="surface-panel mx-4 mt-4 rounded-xl">
              <Toolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={goForward}
                onRefresh={refresh}
                onNewFolder={() => setShowCreateFolder(true)}
                onDeleteSelected={handleDeleteSelected}
                selectedCount={selectedFiles.size}
                showSidebar={showSidebar}
                onToggleSidebar={handleToggleSidebar}
                showPreview={showPreview}
                onTogglePreview={handleTogglePreview}
                showHidden={showHidden}
                onToggleHidden={toggleShowHidden}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                loading={loading}
                sortField={sortField}
                sortOrder={sortOrder}
                onToggleSort={toggleSort}
                onSettings={() => setShowSettings(true)}
              />
            </div>
          )}

          {/* Header with breadcrumb and theme toggle */}
          <div className={cn(
            "flex items-center justify-between mx-4 mt-4 mb-2",
            isMobile ? "px-0" : ""
          )}>
            <div className="surface-panel px-4 py-2 rounded-xl flex-1 mr-4 overflow-hidden">
              <Breadcrumb path={currentPath} onNavigate={navigateToFolder} />
            </div>
            {!isMobile && (
              <div className="surface-panel p-1 rounded-xl">
                <ThemeToggle />
              </div>
            )}
          </div>

          {/* Mobile Actions Bar */}
          {isMobile && (
            <div className="flex items-center gap-2 px-4 py-2 mb-2 overflow-x-auto no-scrollbar">
              <Button
                variant="secondary"
                size="sm"
                onClick={goBack}
                disabled={!canGoBack}
                className="shrink-0 rounded-xl bg-card"
              >
                Back
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateFolder(true)}
                className="shrink-0 rounded-xl bg-card"
              >
                New Folder
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="shrink-0 rounded-xl bg-card"
              >
                Refresh
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex overflow-hidden px-4 pb-4">
            <div className="surface-panel flex-1 flex flex-col min-w-0 overflow-hidden rounded-xl relative">
              {/* Drop zone */}
              <div className={cn(
                "border-b border-border/40",
                isMobile ? "px-3 py-2" : "px-4 py-3"
              )}>
                <DropZone
                  onUpload={uploadFiles}
                  disabled={loading}
                  compact={isMobile || isTablet}
                />
              </div>

              {/* Mobile Search */}
              {isMobile && (
                <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search files..."
                      className="w-full h-10 px-4 py-2 text-sm bg-background/50 border border-border/40 rounded-xl placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="m-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                  <span className="size-2 rounded-full bg-destructive animate-pulse" />
                  {error}
                </div>
              )}

              {/* Files content */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                {loading ? (
                  <div className="p-4 sm:p-6 space-y-3" aria-label="Loading files">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-14 rounded-xl bg-muted/60 skeleton-shimmer"
                        style={{ animationDelay: `${index * 55}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-1">
                    {viewMode === "icon" || isMobile ? (
                      <IconView
                        files={filteredFiles}
                        selectedFiles={selectedFiles}
                        focusedFile={focusedFile}
                        onSelect={handleSelectFile}
                        onToggleSelect={toggleSelect}
                        onNavigate={navigateToFolder}
                        onPreview={setPreviewFile}
                        onDownload={downloadFile}
                        onDelete={handleDeleteFile}
                        onMove={setMoveFileTarget}
                        onDragStart={setDraggedFile}
                        onDrop={handleDrop}
                      />
                    ) : viewMode === "column" ? (
                      <ColumnView
                        files={filteredFiles}
                        selectedFiles={selectedFiles}
                        focusedFile={focusedFile}
                        currentPath={currentPath}
                        onSelect={handleSelectFile}
                        onToggleSelect={toggleSelect}
                        onNavigate={navigateToFolder}
                        onPreview={setPreviewFile}
                      />
                    ) : (
                      <FileList
                        files={filteredFiles}
                        loading={false}
                        selectedFiles={selectedFiles}
                        onDownload={downloadFile}
                        onDelete={handleDeleteFile}
                        onNavigate={navigateToFolder}
                        onPreview={setPreviewFile}
                        onToggleSelect={toggleSelect}
                        onMoveFile={setMoveFileTarget}
                        onDragStart={setDraggedFile}
                        onDrop={handleDrop}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className={cn(
                "py-2.5 border-t border-border/40 bg-muted/10 text-[11px] font-medium text-muted-foreground flex items-center justify-between",
                isMobile ? "px-4" : "px-6"
              )}>
                <div className="flex items-center gap-4">
                  <span>{filteredFiles.length} {filteredFiles.length === 1 ? "item" : "items"}</span>
                  {selectedFiles.size > 0 && <span className="text-primary">{selectedFiles.size} selected</span>}
                </div>
                {searchQuery && <span className="hidden sm:inline opacity-70">Searching: "{searchQuery}"</span>}
              </div>
            </div>

            {/* Preview Panel - Desktop only or mobile overlay */}
            {showPreview && !isMobile && (
              <div className="w-[300px] shrink-0 ml-4 animate-in slide-in-from-right duration-300 ease-out">
                <div className="surface-panel h-full rounded-xl overflow-hidden">
                  <PreviewPanel
                    file={focusedFile}
                    onClose={handleClosePreview}
                    onDownload={downloadFile}
                    onDelete={handleDeleteFile}
                    onMove={setMoveFileTarget}
                    onPreview={setPreviewFile}
                  />
                </div>
              </div>
            )}

            {/* Mobile Preview Overlay */}
            {isMobile && showPreview && focusedFile && (
              <>
                <div
                  className="fixed inset-0 bg-foreground/35 z-40 animate-in fade-in duration-200"
                  onClick={handleClosePreview}
                />
                <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] animate-in slide-in-from-bottom duration-500 ease-out overflow-hidden">
                  <div className="bg-background rounded-t-3xl border-t border-border/50 h-full">
                    <div className="w-12 h-1.5 bg-muted rounded-full mx-auto my-3" />
                    <PreviewPanel
                      file={focusedFile}
                      onClose={handleClosePreview}
                      onDownload={downloadFile}
                      onDelete={handleDeleteFile}
                      onMove={setMoveFileTarget}
                      onPreview={setPreviewFile}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <FilePreview
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={downloadFile}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        actions={commandActions}
        files={commandFiles}
        onOpenFile={handleCommandOpenFile}
        onOpenFolder={handleCommandOpenFolder}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={getDeleteDialogCopy().title}
        description={getDeleteDialogCopy().description}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <CreateFolderDialog
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreateFolder={createFolder}
      />

      <MoveFileDialog
        isOpen={moveFileTarget !== null}
        file={moveFileTarget}
        currentPath={currentPath}
        onClose={() => setMoveFileTarget(null)}
        onMove={handleMoveFile}
      />
      
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onConfigChanged={refresh}
      />
    </div>
  );
}
