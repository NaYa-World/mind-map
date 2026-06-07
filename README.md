# Naya MindMap 🧠

> The Ultimate Zero-Cloud Privacy Canvas

Naya MindMap is a blazing-fast, strictly local, and highly secure Mind Mapping application designed for individuals and teams who demand total privacy. Built with a modern web stack and seamlessly wrapped into a native Android app using Capacitor, Naya MindMap guarantees that your thoughts remain entirely yours.

![Naya MindMap Preview](public/icon.png)

## ✨ Premium Features

- **Zero-Cloud Architecture:** We do not have a database. We do not have servers. Every single keystroke is stored exclusively on your local device.
- **Proprietary AES Encryption:** All exported files (`.naya` format) and Google Drive backups are locked with military-grade AES encryption. Your mindmaps cannot be read by third-party text editors or competitor applications.
- **Cross-Platform:** Available as a lightning-fast Web Application and a native Android App.
- **Dynamic Layouts:** Seamlessly switch between Free-Form dragging and Auto-Arrange snapping.
- **Infinite Canvas:** Drag, zoom, and pan across a limitless workspace.

## 🛠 Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Zero heavy frameworks for maximum performance)
- **Bundler:** Vite
- **Mobile Wrapper:** Capacitor.js (Android)
- **Security:** `crypto-js` for AES file encryption
- **Testing:** Jest (Unit) & Playwright (E2E)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Android Studio](https://developer.android.com/studio) (If you wish to build the Android APK)

### Installation

1. Clone the repository and navigate into the directory:
   ```bash
   cd mindmap
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   *Your app will be live at `http://localhost:5500`.*

## 📦 Building for Production

### Web Version
To generate the highly optimized, minified static files for web hosting:
```bash
npm run build
```
The output will be placed in the `dist/` folder, ready to be deployed to Vercel, Netlify, or GitHub Pages.

### Android Version (Google Play Store)
To sync your latest web build to the native Android environment:
```bash
npm run build && npm run sync
```
Then, open the project in Android Studio:
```bash
npx cap open android
```
From Android Studio, you can generate your signed `.aab` (Android App Bundle) via **Build > Generate Signed Bundle / APK...** and upload it to the Google Play Store!

## 📄 Legal & Privacy

Naya MindMap strictly adheres to a Zero-Cloud privacy model. For full details, please refer to our integrated Privacy Policy and Terms of Service located in `legal.html`.

---
*Built with ❤️ by Naya Solutions*
