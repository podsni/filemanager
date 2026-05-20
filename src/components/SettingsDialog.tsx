import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, GripVertical, Check, AlertTriangle, User, HardDrive } from "lucide-react";

interface Location {
  name: string;
  path: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export function SettingsDialog({ isOpen, onClose, onConfigChanged }: SettingsDialogProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [systemInfo, setSystemInfo] = useState<{ user: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaved(false);

    fetch("/api/config")
      .then(r => r.json())
      .then(cfg => {
        setLocations(cfg.locations ?? []);
        setActiveLocationIndex(cfg.activeLocationIndex ?? 0);
      })
      .catch(() => setError("Failed to load config"));

    fetch("/api/system")
      .then(r => r.json())
      .then(info => setSystemInfo(info))
      .catch(() => {});
  }, [isOpen]);

  const updateLocation = (index: number, field: keyof Location, value: string) => {
    setLocations(prev => prev.map((loc, i) => i === index ? { ...loc, [field]: value } : loc));
  };

  const addLocation = () => {
    setLocations(prev => [...prev, { name: "New Location", path: "" }]);
  };

  const removeLocation = (index: number) => {
    setLocations(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (activeLocationIndex >= next.length) {
        setActiveLocationIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setLocations(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    if (activeLocationIndex === index) setActiveLocationIndex(index - 1);
    else if (activeLocationIndex === index - 1) setActiveLocationIndex(index);
  };

  const handleSave = async () => {
    const invalid = locations.find(l => !l.path.trim());
    if (invalid) { setError("All locations must have a path"); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations, activeLocationIndex }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      onConfigChanged();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 animate-in fade-in-0 duration-150">
      <div className="surface-panel w-full max-w-lg rounded-2xl shadow-xl animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* System info */}
          {systemInfo && (
            <div className="px-6 pt-5 pb-3 flex items-center gap-3 text-sm text-muted-foreground">
              <User className="size-4 shrink-0" />
              <span>Running as <span className="font-semibold text-foreground">{systemInfo.user}</span></span>
            </div>
          )}

          {/* Locations */}
          <div className="px-6 pb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Storage Locations</p>
                <p className="text-xs text-muted-foreground mt-0.5">Folders accessible from the sidebar</p>
              </div>
              <Button variant="outline" size="sm" onClick={addLocation} className="gap-1.5 h-8">
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>

            {locations.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
                No locations. Add one to get started.
              </div>
            )}

            <div className="space-y-2">
              {locations.map((loc, index) => (
                <div
                  key={index}
                  className={`rounded-xl border p-3 space-y-2 transition-colors ${
                    activeLocationIndex === index
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 shrink-0"
                      title="Move up"
                    >
                      <GripVertical className="size-4" />
                    </button>
                    <Input
                      value={loc.name}
                      onChange={e => updateLocation(index, "name", e.target.value)}
                      placeholder="Location name"
                      className="h-8 text-sm font-medium flex-1"
                    />
                    <button
                      onClick={() => setActiveLocationIndex(index)}
                      title="Set as active"
                      className={`shrink-0 size-7 rounded-lg flex items-center justify-center transition-colors ${
                        activeLocationIndex === index
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-primary/20 text-muted-foreground"
                      }`}
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      onClick={() => removeLocation(index)}
                      className="shrink-0 size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <HardDrive className="size-3.5 text-muted-foreground shrink-0" />
                    <Input
                      value={loc.path}
                      onChange={e => updateLocation(index, "path", e.target.value)}
                      placeholder="/absolute/path/to/folder"
                      className="h-8 text-xs font-mono flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2 min-w-[100px]">
            {saved ? <><Check className="size-4" /> Saved!</> : loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
