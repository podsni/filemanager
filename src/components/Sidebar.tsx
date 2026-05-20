import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  HardDrive,
  Folder,
  Download,
  FileText,
  Image,
  Music,
  Video,
  Home,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  folders: { name: string; path: string }[];
  locations?: { name: string; path: string }[];
  activeLocationIndex?: number;
  onSwitchLocation?: (index: number) => void;
  onNavigateToLocation?: (index: number, subPath: string) => void;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        {title}
      </button>
      {isOpen && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  color?: string;
}

function SidebarItem({ icon, label, isActive, onClick, color }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 group relative overflow-hidden",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full animate-in slide-in-from-left-full duration-300" />
      )}
      <span className={cn("transition-transform duration-200 group-hover:scale-110", color)}>{icon}</span>
      <span className="truncate tracking-tight">{label}</span>
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function Sidebar({ 
  currentPath, 
  onNavigate, 
  folders,
  locations = [],
  activeLocationIndex = 0,
  onSwitchLocation,
  onNavigateToLocation,
}: SidebarProps) {
  const [disk, setDisk] = useState<{ total: number; used: number; free: number; percent: number } | null>(null);

  useEffect(() => {
    fetch("/api/system")
      .then(r => r.json())
      .then(info => { if (info.disk) setDisk(info.disk); })
      .catch(() => {});
  }, [activeLocationIndex]);

  // Find the "home" location index — prefer one named "Home" or the first location
  const homeLocationIndex = locations.findIndex(l =>
    l.name.toLowerCase() === "home" || l.path.match(/^\/home\/[^/]+$/) || l.path === "/root"
  );
  const effectiveHomeIndex = homeLocationIndex >= 0 ? homeLocationIndex : 0;
  const homePath = locations[effectiveHomeIndex]?.path ?? "";

  // Quick Access candidates — check which actually exist
  const quickAccessCandidates = [
    { icon: <Home className="size-4.5" />, label: "Home", subPath: "", absPath: homePath },
    { icon: <FileText className="size-4.5" />, label: "Documents", subPath: "Documents", absPath: homePath ? `${homePath}/Documents` : "" },
    { icon: <Download className="size-4.5" />, label: "Downloads", subPath: "Downloads", absPath: homePath ? `${homePath}/Downloads` : "" },
    { icon: <Image className="size-4.5" />, label: "Pictures", subPath: "Pictures", absPath: homePath ? `${homePath}/Pictures` : "" },
    { icon: <Music className="size-4.5" />, label: "Music", subPath: "Music", absPath: homePath ? `${homePath}/Music` : "" },
    { icon: <Video className="size-4.5" />, label: "Videos", subPath: "Videos", absPath: homePath ? `${homePath}/Videos` : "" },
  ];

  const [existingQuickAccess, setExistingQuickAccess] = useState(quickAccessCandidates.slice(0, 1));

  useEffect(() => {
    if (!homePath) return;
    const paths = quickAccessCandidates.filter(c => c.absPath).map(c => c.absPath);
    fetch("/api/check-dirs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    })
      .then(r => r.json())
      .then((result: Record<string, boolean>) => {
        setExistingQuickAccess(
          quickAccessCandidates.filter(c => c.subPath === "" || result[c.absPath])
        );
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homePath]);

  const handleQuickAccess = (subPath: string) => {
    if (subPath === "") {
      if (onNavigateToLocation) {
        onNavigateToLocation(effectiveHomeIndex, "");
      } else {
        onNavigate("");
      }
    } else if (onNavigateToLocation) {
      onNavigateToLocation(effectiveHomeIndex, subPath);
    } else {
      onNavigate(subPath);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* App Logo/Name - Desktop only */}
      <div className="hidden lg:flex items-center gap-3 px-6 py-6">
        <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Database className="size-5 text-primary-foreground" />
        </div>
        <h1 className="font-semibold text-xl tracking-tight">Magnet</h1>
      </div>

      <div className="lg:hidden flex items-center gap-3 px-6 py-4 border-b">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <Database className="size-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">Magnet</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 custom-scrollbar pb-6">
        {/* Locations / Devices */}
        <Section title="Locations" defaultOpen={true}>
          <div className="space-y-0.5">
            {locations.map((loc, index) => (
              <SidebarItem
                key={loc.path + index}
                icon={<HardDrive className="size-4.5" />}
                label={loc.name}
                isActive={activeLocationIndex === index}
                onClick={() => onSwitchLocation?.(index)}
                color={activeLocationIndex === index ? "text-primary" : "text-muted-foreground"}
              />
            ))}
          </div>
        </Section>

        {/* Quick Access — only shows folders that exist */}
        <Section title="Quick Access" defaultOpen={true}>
          <div className="space-y-0.5">
            {existingQuickAccess.map((item) => (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                isActive={
                  item.subPath === ""
                    ? currentPath === "" && activeLocationIndex === effectiveHomeIndex
                    : currentPath === item.subPath && activeLocationIndex === effectiveHomeIndex
                }
                onClick={() => handleQuickAccess(item.subPath)}
                color="text-primary/70"
              />
            ))}
          </div>
        </Section>

        {/* Folders in current path */}
        {folders.length > 0 && (
          <Section title="Folders" defaultOpen={true}>
            <div className="space-y-0.5">
              {folders.map((folder) => (
                <SidebarItem
                  key={folder.path}
                  icon={<Folder className="size-4.5" />}
                  label={folder.name}
                  isActive={currentPath === folder.path}
                  onClick={() => onNavigate(folder.path)}
                  color="text-amber-500/80"
                />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Storage info */}
      <div className="p-4 mx-3 mb-6 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="size-3.5 text-primary" />
            <span>Storage</span>
          </div>
          <span className="text-primary">{disk ? `${disk.percent}%` : "—"}</span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500 origin-left" 
            style={{ width: disk ? `${disk.percent}%` : "0%" }} 
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-medium">
          {disk ? (
            <>
              <span>Used: {formatBytes(disk.used)}</span>
              <span>Free: {formatBytes(disk.free)}</span>
            </>
          ) : (
            <span className="opacity-50">Loading...</span>
          )}
        </div>
      </div>
    </div>
  );
}
