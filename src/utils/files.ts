import { readdir, stat, mkdir, unlink, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { loadConfig, getDataDir } from "../lib/config";

export interface FileInfo {
  name: string;
  size: number;
  createdAt: string;
  type: string;
  isDirectory: boolean;
  path: string;
}

async function getRoot(): Promise<string> {
    await loadConfig();
    return getDataDir();
}

export async function ensureDataDir(): Promise<void> {
  const root = await getRoot();
  await mkdir(root, { recursive: true });
}

export async function listFiles(subPath: string = ""): Promise<FileInfo[]> {
  await ensureDataDir();
  const root = await getRoot();
  const targetDir = join(root, subPath);

  try {
    const entries = await readdir(targetDir);
    const files: FileInfo[] = [];

    for (const entry of entries) {
      if (entry === ".gitkeep") continue;
      const filePath = join(targetDir, entry);
      const stats = await stat(filePath);
      const relativePath = subPath ? `${subPath}/${entry}` : entry;

      files.push({
        name: entry,
        size: stats.isDirectory() ? 0 : stats.size,
        createdAt: stats.birthtime.toISOString(),
        type: stats.isDirectory() ? "folder" : getFileType(entry),
        isDirectory: stats.isDirectory(),
        path: relativePath,
      });
    }

    // Sort: folders first, then by name
    return files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function saveFile(name: string, data: Uint8Array, subPath: string = ""): Promise<FileInfo> {
  await ensureDataDir();
  const root = await getRoot();
  // Only strip truly dangerous characters: path separators and null bytes
  const safeName = name.replace(/[/\\\0]/g, "_").trim() || "unnamed";
  const targetDir = subPath ? join(root, subPath) : root;
  await mkdir(targetDir, { recursive: true });

  const filePath = join(targetDir, safeName);
  await Bun.write(filePath, data);
  const stats = await stat(filePath);
  const relativePath = subPath ? `${subPath}/${safeName}` : safeName;

  return {
    name: safeName,
    size: stats.size,
    createdAt: stats.birthtime.toISOString(),
    type: getFileType(safeName),
    isDirectory: false,
    path: relativePath,
  };
}

export async function createFolder(name: string, subPath: string = ""): Promise<FileInfo> {
  await ensureDataDir();
  const root = await getRoot();
  const safeName = name.replace(/[/\\\0]/g, "_").trim() || "unnamed";
  const targetDir = subPath ? join(root, subPath, safeName) : join(root, safeName);

  await mkdir(targetDir, { recursive: true });
  const stats = await stat(targetDir);
  const relativePath = subPath ? `${subPath}/${safeName}` : safeName;

  return {
    name: safeName,
    size: 0,
    createdAt: stats.birthtime.toISOString(),
    type: "folder",
    isDirectory: true,
    path: relativePath,
  };
}

export async function getFile(filePath: string): Promise<Bun.BunFile | null> {
  await ensureDataDir();
  const root = await getRoot();
  const safePath = filePath.split('/').map(p => p.replace(/[/\\\0]/g, "_")).join('/');
  const fullPath = join(root, safePath);
  const file = Bun.file(fullPath);
  if (await file.exists()) {
    return file;
  }
  return null;
}

export async function deleteFile(filePath: string): Promise<boolean> {
  await ensureDataDir();
  const root = await getRoot();
  const safePath = filePath.split('/').map(p => p.replace(/[/\\\0]/g, "_")).join('/');
  const fullPath = join(root, safePath);

  try {
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      await rm(fullPath, { recursive: true });
    } else {
      await unlink(fullPath);
    }
    return true;
  } catch {
    return false;
  }
}

export async function moveFile(sourcePath: string, destPath: string): Promise<boolean> {
  await ensureDataDir();
  const root = await getRoot();
  const safeSource = sourcePath.split('/').map(p => p.replace(/[/\\\0]/g, "_")).join('/');
  const safeDest = destPath.split('/').map(p => p.replace(/[/\\\0]/g, "_")).join('/');

  const fullSource = join(root, safeSource);
  const fullDest = join(root, safeDest);

  try {
    const file = Bun.file(fullSource);
    if (await file.exists()) {
      await mkdir(dirname(fullDest), { recursive: true });
      const content = await file.arrayBuffer();
      await Bun.write(fullDest, content);
      await unlink(fullSource);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const types: Record<string, string> = {
    pdf: "document",
    doc: "document",
    docx: "document",
    txt: "document",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
    mp4: "video",
    webm: "video",
    mov: "video",
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    tar: "archive",
    gz: "archive",
    "iso": "archive",
  };
  return types[ext] || "file";
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
