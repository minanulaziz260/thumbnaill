# Video Frame Studio

Offline-capable precision browser tool for capturing high-resolution snapshots, thumbnails, and frame sequences from video files or direct URLs.

Redesigned according to Anti-Slop principles with a studio workbench interface, WCAG AA high-contrast palettes, responsive layouts, and zero external tracking or runtime dependencies.

## Key Capabilities

- **Video Ingestion**: Drag-and-drop local video files (MP4, WebM, OGG, QuickTime) or load direct CORS-enabled URLs.
- **Precision Transport**: Scrub bar with accurate timecodes, jump shortcuts (-1m, -5s, -1s, -1 frame at 25fps, +1 frame, +1s, +5s, +1m).
- **Snapshot Studio**:
  - Single frame capture at custom resolution or native video size.
  - Automatic batch sequence capture by percentage interval or time step.
  - Interactive filmstrip gallery with timestamp badges and deletion controls.
- **Export Options**: Download individual PNG frames or export all captured frames into a single `.zip` archive via JSZip.
- **Studio Theming**: Seamless Dark Studio and Light Studio modes with persistent preferences.
- **Keyboard Navigation**: Full keyboard shortcut suite for transport, snapping, and exporting.

## Usage

Simply open `index.html` in any modern web browser. No web server or internet connection is required.
