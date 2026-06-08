# Naya MindMap 🧠

> **The Ultimate Zero-Cloud Privacy Canvas**

Naya MindMap is a blazing-fast, strictly local, and highly secure Mind Mapping application designed for individuals and teams who demand total privacy. Built with a modern web stack and seamlessly wrapped into a native Android app using Capacitor, Naya MindMap guarantees that your thoughts remain entirely yours.

---

## 🛠 Project Structure

The project follows a modular, mixin-based architecture that separates core state logic, rendering, event listeners, and storage interfaces:

```
mindmap/
├── dist/                   # Bundled production builds (emitted by Vite)
├── public/                 # Static assets (logo, etc.)
├── tests/                  # Test suites
│   ├── e2e/                # Playwright End-to-End browser tests
│   └── unit/               # Jest Unit tests (mocking app context)
├── src/                    # Source files
│   ├── core/               # Application state, layout engine, and model managers
│   │   ├── EventBus.ts     # Pub/Sub system for reactive cross-module communications
│   │   ├── crud.ts         # Node CRUD actions (add, delete, node properties) & cycle checks
│   │   ├── crypto.ts       # Zero-knowledge military-grade AES-256-GCM file encryption
│   │   ├── history.ts      # Undo & Redo state snapshots manager
│   │   ├── layout.ts       # 9 auto-arrange layout algorithms
│   │   ├── storage.ts      # IndexedDB database manager & Capacitor file sharing exports
│   │   └── utils.ts        # Shared constants, theme palettes, and SVG builders
│   ├── ui/                 # UI controllers and views
│   │   ├── events.ts       # Desktop & mobile interaction handlers (drag-and-drop, touch gestures)
│   │   ├── modals.ts       # Modal popup configurations, search, GDrive integrations, and map lists
│   │   └── render.ts       # Scalable vector graphics (SVG) renderer for node shapes
│   └── types.ts            # Core TypeScript interfaces (NodeData, MindMapApp, etc.)
├── app.ts                  # Main entry point bootstrapping modules & Google Drive manager
├── app.html                # Mindmap core canvas interface view
├── index.html              # Marketing landing page (highly optimized for SEO)
├── legal.html              # Integrated Zero-Cloud Privacy Policy & Terms of Service
├── service-worker.js       # (Obsolete) Manual SW script (replaced by VitePWA's sw.js)
├── tsconfig.json           # TypeScript configuration
├── package.json            # Scripts, dependencies, and build requirements
├── vite.config.ts          # Vite configuration utilizing vite-plugin-pwa plugin
├── babel.config.cjs        # Babel configurations for Jest testing
└── jest.config.cjs         # Jest unit test configuration ignoring E2E
```

---

## 🏗 Architectural Mixin Design

Instead of relying on heavy frameworks, Naya MindMap uses a **Mixin-based architectural pattern** to keep a clean separation of concerns without sacrificing performance. 

The main class `MindMapApp` (defined in `app.ts`) is composed of modules in the prototype using the `applyMixins` helper:
```typescript
applyMixins(MindMapApp, [
  LayoutMixin, 
  StorageMixin, 
  HistoryMixin, 
  RenderMixin, 
  EventsMixin, 
  CrudMixin, 
  ModalsMixin
]);
```
This merges all modular prototypes together, allowing methods inside `events.ts` or `modals.ts` to call helpers defined in `crud.ts` or `storage.ts` dynamically via `this`.

---

## ⚡ Recent V2 Launch Changes

We implemented several features to transition the application into a premium V2 release:

1. **TypeScript Infrastructure:** Migrated the entire codebase from Vanilla JS to TypeScript. Created a custom declaration file `src/types.ts` to enforce data types across node models.
2. **PWA Offline Support:** Integrated `vite-plugin-pwa` with Workbox to cache all resources (`html`, `css`, `js`, `svg`, `png`, and Google Fonts) locally. The app is fully installable and runs offline with instant launch capability.
3. **Editor Lock Toggle:** Added an **Edit / Locked Mode** badge to the toolbar. When toggled to **Locked**, it restricts editing capabilities (creating, dragging, deleting, altering links, changing themes) to prevent accidental canvas modifications while reading.
4. **Capacitor Android wrapper:** Configured mobile native sharing APIs for local storage exports.

---

## 🐛 Bug Fixes & Optimizations

During our senior-level code review, we resolved **11 bugs** across the app to guarantee stability:

### 1. Model & Tree Integrity
* **Infinite Cycle Protection:** Added `_isDescendantOf` cycle checking inside `src/core/crud.ts`. In `_reparentNode` (`src/ui/modals.ts`), we guard against dragging a parent node and dropping it inside its own subtree, preventing browser tab freezes due to infinite recursions.
* **Orphaned Cross-Links Cleanup:** Updated `deleteNode` to track recursively deleted node IDs and filter them out from `this.crossLinks`, preventing dead cross-links from corrupting the document data model.
* **Cross-Links Import Recovery:** Fixed an issue where `_importJSON` inside `src/ui/modals.ts` ignored the `crossLinks` array, making imported or Google-Drive-opened maps lose all cross-branch links.

### 2. State & Locked Mode Safety
* **Undo/Redo Save Persistence:** Added auto-save triggers (`this._schedSave()`) inside the Undo and Redo methods in `src/core/history.ts`. Restored state changes are now instantly persisted to IndexedDB.
* **Lock Bypass Exclusions:** Added `isLocked` guards to `setNodeImage`, `toggleWrap`, and `_newMap` / `_createNewMap` in `src/ui/modals.ts` to prevent map alterations when Locked Mode is active.
* **Lock State Leakage:** Fixed global lock state leakage. When a new map is loaded or created, `this.isLocked` is reset to `false` and the UI indicator is updated.

### 3. Mobile PWA & Export Fixes
* **Mobile Touch scrolling:** Added `e.preventDefault()` inside the document `touchmove` event handler in `src/ui/events.ts` when panning or dragging nodes on mobile devices, preventing pages from jumping.
* **Duplicate `exportSVG()` conflict:** Removed the duplicate, uncropped `exportSVG()` method in `src/ui/modals.ts` that was overriding the robust, bounding-box-cropped version in `src/core/storage.ts` (restoring high-resolution downloads and Capacitor mobile sharing support).
* **Double SW Registrations:** Removed the manual `service-worker.js` registration script from `app.html` which was causing 404 console errors in production due to hashed assets.
* **GDrive Token Expiration:** Implemented token timestamp checks in `GoogleDriveManager` (`app.ts`) to clear expired Google OAuth access tokens (after 50 minutes) and prompt transparent re-authentication before uploads fail.

### 4. Code Quality & Testing
* **Dead Code Removal:** Cleared double assignments of `this.crossLinkFrom` in the `app.ts` constructor and removed the invalid layout case `case 'addImage'` inside `src/core/layout.ts`.
* **Jest Testing Environment Setup:** Resolved test runner conflicts by renaming `jest.config.js` to `jest.config.cjs`, setting Jest to only scan `tests/unit/`, and adding `@babel/preset-typescript` with module mappings to compile TypeScript files under Node.

---

## 🚀 Getting Started

### Installation
1. Clone the repository and install the dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Run the unit test suite:
   ```bash
   npm test
   ```

### Building for Web & Mobile
* **Compile Web distribution:**
  ```bash
  npm run build
  ```
* **Sync Web assets to Android Capacitor project:**
  ```bash
  npm run sync
  ```
* **Open in Android Studio to build APK/AAB:**
  ```bash
  npx cap open android
  ```

---
*Built with ❤️ by Naya Solutions*
