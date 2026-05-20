import { useState, useEffect, useCallback, useMemo } from "react";

interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
  type: string;
  isDirectory: boolean;
  path: string;
}

export type SortField = "name" | "size" | "createdAt" | "type";
export type SortOrder = "asc" | "desc";

interface Location {
  name: string;
  path: string;
}

interface UseFilesReturn {
  files: FileInfo[];
  filteredFiles: FileInfo[];
  loading: boolean;
  error: string | null;
  currentPath: string;
  searchQuery: string;
  showHidden: boolean;
  filterType: string;
  selectedFiles: Set<string>;
  canGoBack: boolean;
  canGoForward: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  locations: Location[];
  activeLocationIndex: number;
  setCurrentPath: (path: string) => void;
  setSearchQuery: (query: string) => void;
  toggleShowHidden: () => void;
  setFilterType: (type: string) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSort: (field: SortField) => void;
  refresh: () => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  deleteSelected: () => Promise<void>;
  downloadFile: (path: string) => void;
  createFolder: (name: string) => Promise<void>;
  moveFile: (source: string, destination: string) => Promise<void>;
  toggleSelect: (path: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  navigateToFolder: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
  switchLocation: (index: number) => Promise<void>;
  navigateToLocation: (index: number, subPath?: string) => Promise<void>;
}

export function useFiles(): UseFilesReturn {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const toggleShowHidden = useCallback(() => {
    setShowHidden(prev => !prev);
  }, []);

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config");
        if (response.ok) {
          const config = await response.json();
          setLocations(config.locations);
          setActiveLocationIndex(config.activeLocationIndex);
        }
      } catch (err) {
        console.error("Failed to fetch config", err);
      }
    };
    fetchConfig();
  }, []);

  const switchLocation = useCallback(async (index: number) => {
    try {
      setLoading(true);
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeLocationIndex: index }),
      });
      if (response.ok) {
        const config = await response.json();
        setActiveLocationIndex(config.activeLocationIndex);
        setCurrentPath("");
        setHistory([""]);
        setHistoryIndex(0);
      }
    } catch (err) {
      setError("Failed to switch location");
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateToLocation = useCallback(async (index: number, subPath = "") => {
    try {
      setLoading(true);
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeLocationIndex: index }),
      });
      if (response.ok) {
        const config = await response.json();
        setActiveLocationIndex(config.activeLocationIndex);
        setCurrentPath(subPath);
        setHistory([subPath]);
        setHistoryIndex(0);
        setSearchQuery("");
        setFilterType("");
      }
    } catch {
      setError("Failed to navigate");
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle sort - if same field, toggle order; if different field, set new field with asc
  const toggleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    // Filter
    let result = files.filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || file.type === filterType;
      const isHidden = file.name.startsWith(".");
      const matchesHidden = showHidden || !isHidden;
      return matchesSearch && matchesType && matchesHidden;
    });

    // Sort - folders first, then by selected field
    result.sort((a, b) => {
      // Folders always come first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      // Compare based on sort field
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, filterType, sortField, sortOrder, showHidden]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      setFiles(data.files);
      setSelectedFiles(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [currentPath, activeLocationIndex]);

  const uploadFiles = useCallback(async (filesToUpload: File[]) => {
    const formData = new FormData();
    for (const file of filesToUpload) {
      formData.append("files", file);
    }

    const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    await refresh();
  }, [currentPath, refresh]);

  const deleteFile = useCallback(async (filePath: string) => {
    const response = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    await refresh();
  }, [refresh]);

  const deleteSelected = useCallback(async () => {
    for (const path of selectedFiles) {
      await fetch(`/api/files/${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
    }
    await refresh();
  }, [selectedFiles, refresh]);

  const downloadFile = useCallback((filePath: string) => {
    const link = document.createElement("a");
    link.href = `/api/files/${encodeURIComponent(filePath)}`;
    link.download = filePath.split("/").pop() || filePath;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const createFolder = useCallback(async (name: string) => {
    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, path: currentPath }),
    });

    if (!response.ok) {
      throw new Error("Failed to create folder");
    }

    await refresh();
  }, [currentPath, refresh]);

  const moveFile = useCallback(async (source: string, destination: string) => {
    const response = await fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, destination }),
    });

    if (!response.ok) {
      throw new Error("Move failed");
    }

    await refresh();
  }, [refresh]);

  const toggleSelect = useCallback((path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFiles(new Set(files.map((f) => f.path)));
  }, [files]);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const navigateToFolder = useCallback((path: string) => {
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
    setSearchQuery("");
    setFilterType("");
  }, [history, historyIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex] || "");
      setSearchQuery("");
      setFilterType("");
    }
  }, [canGoBack, historyIndex, history]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex] || "");
      setSearchQuery("");
      setFilterType("");
    }
  }, [canGoForward, historyIndex, history]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    files,
    filteredFiles,
    loading,
    error,
    currentPath,
    searchQuery,
    showHidden,
    filterType,
    selectedFiles,
    canGoBack,
    canGoForward,
    sortField,
    sortOrder,
    locations,
    activeLocationIndex,
    setCurrentPath,
    setSearchQuery,
    toggleShowHidden,
    setFilterType,
    setSortField,
    setSortOrder,
    toggleSort,
    refresh,
    uploadFiles,
    deleteFile,
    deleteSelected,
    downloadFile,
    createFolder,
    moveFile,
    toggleSelect,
    selectAll,
    clearSelection,
    navigateToFolder,
    goBack,
    goForward,
    switchLocation,
    navigateToLocation,
  };
}
