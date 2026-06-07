const fs = require('fs');

const lines = fs.readFileSync('app.js', 'utf8').split('\n');

function extract(start, end) {
  // start and end are 1-based inclusive
  return lines.slice(start - 1, end).join('\n');
}

const preamble = extract(1, 222); // globals, constructor
// INIT and measurer: 224 to 288
// NODE CRUD: 345 to 536
// VISIBLE CHILREN & SUBTREE: 538 to 554
// LAYOUT ALGORITHMS: 556 to 815
// RENDER (SVG): 817 to 1276
// MODALS: 1278 to 1428
// CANVAS SETUP (pan/zoom/drag): 1453 to 1758
// KEYBOARD & SHORTCUTS: 1760 to 1815
// CONTEXT MENU: 1817 to 1893
// TOOLBAR SETUP: 1895 to 2041
// PANELS: 2043 to 2100
// SEARCH: 2102 to 2160
// IMPORT / EXPORT: 2162 to 2231
// UNDO / REDO: 2233 to 2314
// PERSISTENCE (IndexedDB): 2316 to 2826
// GOOGLE DRIVE SYNC: 2828 to 2988
// MISC HELPER (toast): 2990 to 3053
// Sample data: 290 to 343

const layoutLines = extract(538, 815);
const renderLines = extract(817, 1276) + '\n' + extract(240, 288); // measurer
const eventsLines = extract(1453, 2160); // canvas, keyboard, ctxmenu, toolbar, panels, search
const storageLines = extract(2162, 2231) + '\n' + extract(2316, 2988); // import/export, idb, gdrive
const historyLines = extract(2233, 2314); 

// The rest goes to app_core.js or similar
const crudLines = extract(290, 343) + '\n' + extract(345, 536); // sample data + node crud
const modalLines = extract(1278, 1428);
const miscLines = extract(2990, 3053);

const makeMixin = (name, code) => `export const ${name} = class {\n${code}\n}.prototype;\n`;

fs.writeFileSync('src/core/layout.js', makeMixin('LayoutMixin', layoutLines));
fs.writeFileSync('src/core/storage.js', makeMixin('StorageMixin', storageLines));
fs.writeFileSync('src/core/history.js', makeMixin('HistoryMixin', historyLines));
fs.writeFileSync('src/ui/render.js', makeMixin('RenderMixin', renderLines));
fs.writeFileSync('src/ui/events.js', makeMixin('EventsMixin', eventsLines));
fs.writeFileSync('src/core/crud.js', makeMixin('CrudMixin', crudLines));
fs.writeFileSync('src/ui/modals.js', makeMixin('ModalsMixin', modalLines + '\n' + miscLines));

// Now construct the new app.js
const newApp = `
${extract(1, 222)} 
${extract(224, 238)} 
}

import { LayoutMixin } from './src/core/layout.js';
import { StorageMixin } from './src/core/storage.js';
import { HistoryMixin } from './src/core/history.js';
import { RenderMixin } from './src/ui/render.js';
import { EventsMixin } from './src/ui/events.js';
import { CrudMixin } from './src/core/crud.js';
import { ModalsMixin } from './src/ui/modals.js';

Object.assign(MindMap.prototype, LayoutMixin, StorageMixin, HistoryMixin, RenderMixin, EventsMixin, CrudMixin, ModalsMixin);

${extract(3055, lines.length)}
`;

fs.writeFileSync('app_new.js', newApp);
console.log('Splitting complete!');
