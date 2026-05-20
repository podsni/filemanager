# File Magnet 🧲

A fast, self-hosted file manager built with Bun, React, Tailwind CSS, and shadcn/ui. Runs on any Linux VPS or server with zero configuration — automatically detects the current user and home directory.

![File Magnet](https://img.shields.io/badge/Bun-1.3+-black?logo=bun) ![React](https://img.shields.io/badge/React-19-blue?logo=react) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 📁 **Multi-location support** — manage multiple root directories from the sidebar
- 🔍 **Search & filter** — real-time search with file type filtering
- 👁️ **Multiple views** — Icon, List, and Column (Finder-style) views
- 📤 **Drag & drop upload** — drop files anywhere on the window to upload
- 📥 **Download files** — single file download with correct filename
- 🗂️ **Folder management** — create, rename, move, and delete folders
- 🔄 **Move files** — move files between folders with a dialog
- 👀 **File preview** — preview images, PDFs, text, code, audio, video, and EPUB
- 🌙 **Dark/Light mode** — theme toggle with system preference detection
- ⌨️ **Command palette** — `Ctrl+K` to quickly navigate and run actions
- 📱 **Responsive** — works on mobile, tablet, and desktop
- 🌐 **Network accessible** — binds to `0.0.0.0`, accessible from any device on the network
- 💾 **Real disk usage** — sidebar shows actual disk usage of the active location
- 👤 **Auto user detection** — detects the current system user automatically

## Requirements

- [Bun](https://bun.sh) v1.3+
- Linux / macOS

## Installation

```bash
# Clone the repository
git clone https://github.com/podsni/filemanager.git
cd filemanager

# Install dependencies
bun install
```

## Usage

### Development

```bash
bun dev
```

### Production

```bash
bun start
```

The server starts on port **1945** and binds to `0.0.0.0`. On startup it prints all accessible URLs:

```
🚀 File Magnet running on port 1945
🌐 Accessible at:
   http://localhost:1945
   http://192.168.1.100:1945
👤 User: ubuntu
📁 Active location: Home → /home/ubuntu
🗂️  Total locations: 3
```

## Configuration

Configuration is stored at `~/.filemanager-config.json` (in the current user's home directory). It is created automatically on first run with sensible defaults based on the detected user.

Example config:

```json
{
  "locations": [
    { "name": "Home", "path": "/home/ubuntu" },
    { "name": "Documents", "path": "/home/ubuntu/Documents" },
    { "name": "Downloads", "path": "/home/ubuntu/Downloads" }
  ],
  "activeLocationIndex": 0
}
```

You can also manage locations from the **Settings** dialog (gear icon in the toolbar).

## Deploying on a VPS

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone and install
git clone https://github.com/podsni/filemanager.git
cd filemanager
bun install

# Run (keep alive with screen/tmux/pm2)
bun start
```

### With PM2

```bash
npm install -g pm2
pm2 start "bun start" --name filemanager
pm2 save
pm2 startup
```

### With systemd

```ini
# /etc/systemd/system/filemanager.service
[Unit]
Description=File Magnet
After=network.target

[Service]
User=YOUR_USER
WorkingDirectory=/path/to/filemanager
ExecStart=/home/YOUR_USER/.bun/bin/bun start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now filemanager
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Frontend | [React 19](https://react.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) |
| Icons | [Lucide React](https://lucide.dev) |
| EPUB reader | [epub.js](https://github.com/futurepress/epub.js) |
| Code highlight | [Prism React Renderer](https://github.com/FormidableLabs/prism-react-renderer) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/files?path=` | List files in a directory |
| `POST` | `/api/files?path=` | Upload files (multipart) |
| `GET` | `/api/files/:path` | Download a file |
| `DELETE` | `/api/files/:path` | Delete a file or folder |
| `POST` | `/api/folders` | Create a folder |
| `POST` | `/api/move` | Move a file |
| `GET` | `/api/config` | Get current config |
| `POST` | `/api/config` | Update config |
| `GET` | `/api/system` | Get user info and disk usage |

## License

MIT
