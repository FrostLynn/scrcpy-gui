# scrcpy-gui

Web control deck and session launcher for [scrcpy](https://github.com/Genymobile/scrcpy) and Android Debug Bridge (ADB).

Built with zero external npm dependencies using native Node.js ESM (`node:http`, `node:child_process`, `node:events`), Vanilla JavaScript, Semantic HTML5, and CSS Custom Properties.

---

## Features

- **Device Discovery & Management**: Scans USB and wireless ADB devices with instant connection status, model details, and transport IDs.
- **TCP/IP Wireless Link**: One-click connect and disconnect for Wi-Fi debugging (port 5555), plus one-click USB-to-wireless mode switching.
- **Configurable scrcpy Launcher**:
  - Video controls: Max resolution (720p to 2K/native), bitrate (4M to 24M), FPS capping (30 to 120), and codec selection (H.264, H.265, AV1).
  - Audio forwarding controls: Codec options (Opus, AAC, FLAC, RAW), bitrate, or full audio mute.
  - Display and window behavior: Screen off, stay awake, fullscreen, always on top, borderless, show touches, read-only mode, and clipboard sync toggle.
  - Video source selection: Display mirroring or camera capture.
  - Pure OTG mode: Control Android device via physical keyboard and mouse simulation without USB debugging.
  - Session recording: Direct video capture to local MP4 files.
- **Profiles**: Quick presets for Default, High Quality, Low Latency, Presentation, and Audio Only modes.
- **Live Command Preview**: Visual preview of the exact `scrcpy` command-line flags being dispatched.
- **Active Session Manager**: Track running scrcpy processes, inspect PIDs, and terminate active sessions safely.
- **Real-Time Process Console**: Server-Sent Events (SSE) stream for live stdout/stderr output from scrcpy processes.
- **Quick ADB Controls & Telemetry**:
  - Hardware buttons: Power, Home, Back, Recent Apps, Volume Up, Volume Down.
  - Device telemetry: Battery level, charging state, display resolution, Android OS version, and local Wi-Fi IP.
  - Direct screenshot capture: Takes device screenshot via ADB and displays preview with one-click download.
  - Device reboot trigger.
- **High Contrast Industrial Theme**: Fully functional Dark and Light modes with WCAG AA compliant contrast ratios and visible keyboard focus rings.

---

## Prerequisites

Before running `scrcpy-gui`, verify that the following tools are installed and available in your system `PATH`:

1. **Node.js** (v18.0.0 or higher)
   ```bash
   node --version
   ```

2. **Android Debug Bridge (`adb`)**
   - Linux: `sudo apt install adb` or `sudo pacman -S android-tools`
   - macOS: `brew install android-platform-tools`
   - Windows: Included with Android SDK Platform-Tools

3. **scrcpy** (v2.0 or higher recommended, tested on scrcpy v4.1)
   - Linux: `sudo apt install scrcpy` or `sudo pacman -S scrcpy`
   - macOS: `brew install scrcpy`
   - Windows: Download from the official [scrcpy releases](https://github.com/Genymobile/scrcpy/releases)

---

## Installation & Running

Clone the repository and start the server:

```bash
# Clone the repository
git clone https://github.com/akhdanrn/scrcpy-gui.git
cd scrcpy-gui

# Start the web console (Default port: 5050)
npm start
```

Open your browser and navigate to:
```
http://localhost:5050
```

To run on a custom port, set the `PORT` environment variable:
```bash
PORT=8080 npm start
```

---

## Running Automated Tests

Run the built-in test suite (no third-party test framework required):

```bash
npm test
```

The test runner verifies:
- ADB device list output parsing across various states (connected, unauthorized, offline, wireless).
- `scrcpy` command line argument builder and flag validation.
- HTTP server endpoints, static file delivery, and API responses.

---

## Architecture & Codebase Structure

The project avoids heavy frameworks, bundlers, and npm package trees in favor of native platform primitives.

```
scrcpy-gui/
├── src/
│   ├── adb.js          # ADB process runner, parser, and hardware controls
│   ├── scrcpy.js       # scrcpy argument builder, process spawner, and session registry
│   ├── server.js       # Native node:http server, API router, and SSE log broadcaster
│   └── public/
│       ├── index.html  # Semantic accessible HTML5 console layout
│       ├── style.css   # Dark/Light theme custom properties, layout grid, WCAG AA styles
│       └── app.js      # Vanilla client, event listeners, SSE receiver, and DOM updates
├── test/
│   └── check.js        # Assertion-based test suite using node:assert
├── CLAUDE.md           # Project developer notes and design constraints
├── DESIGN.md           # Visual design tokens, color palette, and accessibility criteria
├── package.json        # Project metadata and npm scripts
└── README.md           # Documentation
```

---

## Keyboard Shortcuts

- `R`: Refresh attached device list (when not focused on a text input).
- `Escape`: Close active modal dialog (Device Details or Screenshot preview).
- `Tab` / `Shift+Tab`: Navigate all interactive controls with visible focus ring.

---

## Troubleshooting

### 1. Device shows as "Unauthorized"
- Unlock your Android device screen.
- Look for the prompt: "Allow USB debugging?".
- Check "Always allow from this computer" and tap "Allow".
- Click "Refresh" in the web console.

### 2. Wi-Fi connection fails
- Connect your device via USB first.
- Click "Enable Wi-Fi" on the device card (or open "Device Info" and click "Enable Wi-Fi Mode").
- Note the device IP shown in "Device Info" (e.g., `192.168.1.50`).
- Enter the IP in the "TCP/IP Network Link" bar and click "Connect Device".
- Disconnect the USB cable.

### 3. scrcpy fails to launch
- Verify that `scrcpy` is accessible from your terminal: `scrcpy --version`.
- Check the "Process Activity Log" at the bottom of the console for error output.
- If using Wayland on Linux and encountering display errors, test with software rendering by adding `--render-driver=software` in the "Additional scrcpy flags" field.

---

## License

MIT License. See repository for full terms.
scrcpy is developed by [Romain Vimont and Genymobile](https://github.com/Genymobile/scrcpy).
