# MindMap Application

A powerful, feature-rich visual mind mapping tool built with HTML, CSS, and JS. 

## Features

- **9 Layout Modes**: Horizontal, From Parent, Free Form, Vertical, Top Down, List, Linear, Radial, Matrix.
- **Color Themes**: 6 beautiful color themes (Curated, harmonious palettes, sleek dark mode).
- **Core UI**: Double-click edit, Context menu, Keyboard shortcuts (undo/redo, add child/sibling).
- **Smooth Zoom and Pan**: Mouse wheel or trackpad provides smooth zooming (capped at 15% per notch, scroll sensitivity based). Drag to pan.
- **Local Persistence & Database (IndexedDB)**:
  - **IndexedDB**: Replaces `localStorage` (5MB limit) with IndexedDB — capable of storing hundreds of MB.
  - **Multiple Maps**: My Maps Dashboard shows all saved maps as visual cards with a mini SVG preview, node count, and last edited time.
  - **Editable Map Name**: The name field in the toolbar is click-to-edit. Auto-saves 800ms after you stop typing.
  - **Live Save Indicator**:
    - **Saving…**: Amber pill with spinning clock.
    - **Saved**: Green pill with checkmark.
    - **Error**: Red pill.
  - **Auto-save**: Every action triggers auto-save with a 700ms debounce. Reopening the page automatically loads the most recently edited map.
  - **Export/Import**: Save maps as JSON and load them back later.

## Getting Started

1. Open `index.html` in your web browser.
2. Start adding topics using the `+ Add Topic` button or the `Tab`/`Enter` keys.
3. Edit topics by double-clicking on them or pressing `F2`.
4. Your progress will be saved automatically to your browser's local database!
