# Scrcpy Launcher

A cross-platform desktop GUI for [scrcpy](https://github.com/Genymobile/scrcpy) that acts as a PC-side app launcher for Android phones. Browse your phone's apps in a grid, configure scrcpy parameters visually, and click to launch any app in its own window via `scrcpy --start-app=<package>`.

Built with **Rust + Tauri v2 + Vue 3 + TypeScript + Tailwind CSS v4**.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Tech](https://img.shields.io/badge/stack-Tauri%202%20%2B%20Vue%203-green)

## Features

- 🔍 **App Discovery** — reads your phone's app list via `scrcpy --list-apps` and displays them in a responsive grid
- 🚀 **One-Click Launch** — click any app to open it in an independent scrcpy window
- ⚙️ **Visual Config** — toggle screen-off, keyboard/mouse UHID, codecs, bitrate, max FPS, new-display, and more
- ⭐ **Favorites** — star frequently used apps; filter to show only favorites
- 🔎 **Instant Search** — filter by app name or package name
- 🖼️ **Icon Loading** — fetches app icons from a remote API and caches them locally, with letter-avatar fallback
- 📱 **Multi-Device** — supports multiple connected devices with a dropdown selector
- 🌐 **Web Demo Mode** — same UI runs in the browser with mock data; explore the interface without installing anything
- 🌙 **Dark Theme** — designed for low-light environments

## Prerequisites

### 1. Install scrcpy

- **Windows**: `scoop install scrcpy` or download from [scrcpy releases](https://github.com/Genymobile/scrcpy/releases)
- **macOS**: `brew install scrcpy`
- **Linux**: `apt install scrcpy` (Debian/Ubuntu) or `pacman -S scrcpy` (Arch)

> **Important**: scrcpy v3.0+ is required for `--start-app` and `--list-apps` support.

### 2. Install ADB (Android Debug Bridge)

- **Windows**: `scoop install adb` or download [Platform Tools](https://developer.android.com/tools/releases/platform-tools)
- **macOS**: `brew install android-platform-tools`
- **Linux**: `apt install adb` or `pacman -S android-tools`

### 3. Add to PATH

Make sure both `scrcpy` and `adb` are in your system PATH:

```bash
# Verify installation
scrcpy --version
adb version
```

If they aren't in PATH, you can set custom paths in the app's **Settings** dialog.

### 4. Enable USB Debugging on Your Phone

1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times to enable Developer Options
3. Go to **Settings → Developer Options**
4. Enable **USB Debugging**
5. Connect your phone via USB cable
6. Accept the "Allow USB debugging?" prompt on your phone

Verify the connection:

```bash
adb devices
# Should show: <serial>   device
```

## Build & Run

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://rustup.rs/) ≥ 1.70
- [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/)

### Quick Start (Desktop)

```bash
# Clone the repo
git clone https://github.com/aoiyukizakura/scrcpy-launcher.git
cd scrcpy-launcher

# Install frontend dependencies
npm install

# Run in Tauri development mode
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

The built installer will be in `src-tauri/target/release/bundle/`.

### Web Demo / Deploy

The same codebase runs as a standalone SPA in any browser:

```bash
# Start web dev server
npm run dev:web

# Or build for static hosting
npm run build:web
```

In web mode:
- The full UI is functional (config, search, favorites, grid)
- 20 realistic demo apps are displayed for exploration
- Config is persisted to `localStorage`
- Launching apps is disabled (requires desktop)
- A banner clearly indicates "Web Demo Mode"

The `dist/` output can be deployed to any static host (Vercel, Netlify, GitHub Pages, etc.).

## Architecture

```
┌─────────────────────────────────────────┐
│            Vue 3 Frontend                │
│  DeviceWarning · AppGrid · ConfigPanel   │
│  Pinia stores · useIcons · useLauncher   │
│         @tauri-apps/plugin-shell         │
├─────────────────────────────────────────┤
│          Tauri v2 Rust Backend           │
│  Config persistence · Icon cache · Env   │
└─────────────────────────────────────────┘
```

### Key Design Decisions

- **Shell plugin**: All `scrcpy` and `adb` calls go through `@tauri-apps/plugin-shell` for cross-platform process management
- **No heavy UI libraries**: Tailwind CSS + custom components instead of Element Plus/Ant Design — keeps the bundle under 120KB JS
- **Icon strategy**: Browser `fetch()` → local PNG cache → CSS letter fallback. No Rust HTTP dependencies.
- **Non-blocking launch**: `Command.spawn()` detaches scrcpy processes so the launcher stays responsive

## Configuration Reference

| Parameter | Flag | Type | Default |
|-----------|------|------|---------|
| Turn screen off | `-S` / `--turn-screen-off` | Switch | Off |
| Keyboard (UHID) | `-K` / `--keyboard=uhid` | Switch | Off |
| Mouse (UHID) | `-G` / `--mouse=uhid` | Switch | Off |
| Stay awake | `-w` / `--stay-awake` | Switch | Off |
| Always on top | `--always-on-top` | Switch | Off |
| Max resolution | `-m` / `--max-size` | Number | (device default) |
| Max FPS | `--max-fps` | Number | (device default) |
| Video bitrate | `-b` / `--video-bit-rate` | Text | 24M |
| Video codec | `--video-codec` | Select | h264 |
| Audio codec | `--audio-codec` | Select | opus |
| New display | `--new-display` | Composite | (disabled) |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "scrcpy not found" | Install scrcpy or set the path in Settings |
| "No ADB devices" | Check USB cable, re-enable USB debugging, run `adb devices` |
| "App not installed" | The app was uninstalled from the phone since the last list refresh |
| Launch button disabled | Connect a phone with USB debugging authorized |
| Icons not loading | The ihnet API may be slow — icons will load progressively |

## License

MIT

---

Built with [Tauri](https://v2.tauri.app/), [Vue 3](https://vuejs.org/), and [scrcpy](https://github.com/Genymobile/scrcpy).
