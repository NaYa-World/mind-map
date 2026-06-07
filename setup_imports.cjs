const fs = require('fs');

const appCode = fs.readFileSync('app.js', 'utf8');
const lines = appCode.split('\n');

// 1. Extract globals (lines 1-174)
const globals = lines.slice(0, 174).join('\n');
const utilsCode = globals + '\nexport { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl };\n';
fs.writeFileSync('src/core/utils.js', utilsCode);

// 2. Remove globals from app.js and add import
const appRemainder = lines.slice(174).join('\n');
const newAppCode = `import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from './src/core/utils.js';\n` + appRemainder;

// Wait, app.js exports MindMapApp, but the class is named `MindMapApp`.
// We should also export it as default at the very end of app.js.
// Also we need `window.app = new MindMapApp()` or similar to be updated.
fs.writeFileSync('app.js', newAppCode);

// 3. Add import to all mixins
const mixins = [
  'src/core/layout.js',
  'src/core/storage.js',
  'src/core/history.js',
  'src/core/crud.js',
  'src/ui/render.js',
  'src/ui/events.js',
  'src/ui/modals.js'
];

const importStmt = `import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from './utils.js';\n`;

mixins.forEach(m => {
  let content = fs.readFileSync(m, 'utf8');
  // Need to adjust the path depending on where the mixin is.
  let mImport = importStmt;
  if (m.startsWith('src/ui/')) {
    mImport = `import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from '../core/utils.js';\n`;
  }
  fs.writeFileSync(m, mImport + content);
});

console.log('Imports configured successfully!');
