import { join } from "node:path";
import { homedir, userInfo } from "node:os";

const USER_HOME = homedir();
const CONFIG_FILE = join(USER_HOME, ".filemanager-config.json");

function getDefaultLocations() {
  return [
    { name: "Home", path: USER_HOME },
    { name: "Documents", path: join(USER_HOME, "Documents") },
    { name: "Downloads", path: join(USER_HOME, "Downloads") },
  ];
}

export interface Location {
  name: string;
  path: string;
}

export interface Config {
  locations: Location[];
  activeLocationIndex: number;
}

let configCache: Config | null = null;

export async function loadConfig(): Promise<Config> {
  if (configCache) return configCache;

  try {
    const file = Bun.file(CONFIG_FILE);
    if (await file.exists()) {
      const data = await file.json();
      configCache = {
        locations: data.locations?.length ? data.locations : getDefaultLocations(),
        activeLocationIndex: data.activeLocationIndex ?? 0,
      };
    } else {
      configCache = { locations: getDefaultLocations(), activeLocationIndex: 0 };
      await Bun.write(CONFIG_FILE, JSON.stringify(configCache, null, 2));
    }
  } catch (e) {
    console.error("Failed to load config, using defaults:", e);
    configCache = { locations: getDefaultLocations(), activeLocationIndex: 0 };
  }

  return configCache;
}

export async function saveConfig(newConfig: Partial<Config>): Promise<Config> {
  const current = configCache ?? await loadConfig();
  const updated = { ...current, ...newConfig };
  await Bun.write(CONFIG_FILE, JSON.stringify(updated, null, 2));
  configCache = updated;
  return updated;
}

export function getDataDir(): string {
  if (configCache) {
    const loc = configCache.locations[configCache.activeLocationIndex];
    if (loc) return loc.path;
  }
  return USER_HOME;
}

export function getCurrentUser(): string {
  try {
    return userInfo().username;
  } catch {
    return process.env.USER || process.env.LOGNAME || "unknown";
  }
}
