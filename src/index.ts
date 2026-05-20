import { serve } from "bun";
import index from "./index.html";
import { listFiles, saveFile, getFile, deleteFile, createFolder, moveFile } from "./utils/files";
import { loadConfig, saveConfig, getCurrentUser } from "./lib/config";
import { statfs } from "node:fs/promises";
import { networkInterfaces, homedir } from "node:os";

const server = serve({
  port: 1945,
  hostname: "0.0.0.0",
  routes: {
    "/*": index,

    "/api/system": {
      async GET() {
        const config = await loadConfig();
        const user = getCurrentUser();
        const activeLocation = config.locations[config.activeLocationIndex];
        const path = activeLocation?.path ?? homedir();

        let disk = { total: 0, used: 0, free: 0, percent: 0 };
        try {
          const fs = await statfs(path);
          const total = fs.blocks * fs.bsize;
          const free = fs.bfree * fs.bsize;
          const used = total - free;
          disk = { total, used, free, percent: total > 0 ? Math.round((used / total) * 100) : 0 };
        } catch {}

        return Response.json({ user, disk });
      }
    },

    "/api/check-dirs": {
      async POST(req) {
        const { paths } = await req.json() as { paths: string[] };
        const { stat } = await import("node:fs/promises");
        const results: Record<string, boolean> = {};
        await Promise.all(paths.map(async (p) => {
          try { const s = await stat(p); results[p] = s.isDirectory(); }
          catch { results[p] = false; }
        }));
        return Response.json(results);
      }
    },

    "/api/config": {
      async GET() {
        const config = await loadConfig();
        return Response.json(config);
      },
      async POST(req) {
        const body = await req.json();
        const config = await saveConfig(body);
        return Response.json(config);
      }
    },

    "/api/files": {
      async GET(req) {
        const url = new URL(req.url);
        const path = url.searchParams.get("path") || "";
        const files = await listFiles(path);
        return Response.json({ files, currentPath: path });
      },

      async POST(req) {
        const url = new URL(req.url);
        const path = url.searchParams.get("path") || "";
        const formData = await req.formData();
        const uploadedFiles: Array<{ name: string; size: number; type: string; path: string }> = [];

        for (const [_, value] of formData.entries()) {
          if (value && typeof value !== "string") {
            const file = value as File;
            const buffer = await file.arrayBuffer();
            const fileInfo = await saveFile(file.name, new Uint8Array(buffer), path);
            uploadedFiles.push(fileInfo);
          }
        }

        return Response.json({
          success: true,
          files: uploadedFiles,
          message: `${uploadedFiles.length} file(s) uploaded successfully`
        });
      },
    },

    "/api/files/:path": {
      async GET(req) {
        const filePath = decodeURIComponent(req.params.path);
        const file = await getFile(filePath);

        if (!file) {
          return Response.json({ error: "File not found" }, { status: 404 });
        }

        const filename = filePath.split('/').pop() || filePath;
        return new Response(file, {
          headers: {
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Type": file.type || "application/octet-stream",
          },
        });
      },

      async DELETE(req) {
        const filePath = decodeURIComponent(req.params.path);
        const deleted = await deleteFile(filePath);

        if (!deleted) {
          return Response.json({ error: "File not found" }, { status: 404 });
        }

        return Response.json({ success: true, message: "File deleted" });
      },
    },

    "/api/folders": {
      async POST(req) {
        const body = await req.json();
        const { name, path = "" } = body;

        if (!name) {
          return Response.json({ error: "Folder name is required" }, { status: 400 });
        }

        const folder = await createFolder(name, path);
        return Response.json({ success: true, folder });
      },
    },

    "/api/move": {
      async POST(req) {
        const body = await req.json();
        const { source, destination } = body;

        if (!source || !destination) {
          return Response.json({ error: "Source and destination are required" }, { status: 400 });
        }

        const success = await moveFile(source, destination);
        if (!success) {
          return Response.json({ error: "Move failed" }, { status: 500 });
        }

        return Response.json({ success: true, message: "File moved" });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 File Magnet running on port ${server.port}`);

// Print all accessible URLs
const nets = networkInterfaces();
const addresses: string[] = ["http://localhost:" + server.port];
for (const iface of Object.values(nets)) {
  for (const addr of iface ?? []) {
    if (addr.family === "IPv4" && !addr.internal) {
      addresses.push(`http://${addr.address}:${server.port}`);
    }
  }
}
console.log("🌐 Accessible at:");
for (const addr of addresses) console.log(`   ${addr}`);

// Print startup info
loadConfig().then(config => {
  const user = getCurrentUser();
  const activeLocation = config.locations[config.activeLocationIndex];
  console.log(`👤 User: ${user}`);
  console.log(`📁 Active location: ${activeLocation?.name ?? "none"} → ${activeLocation?.path ?? "not set"}`);
  console.log(`🗂️  Total locations: ${config.locations.length}`);
});
