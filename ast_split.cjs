const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('app_recovered.js', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: []
});

let classStart, classEnd;
const methods = {};

traverse(ast, {
  ClassDeclaration(path) {
    if (path.node.id && path.node.id.name === 'MindMapApp') {
      classStart = path.node.body.start;
      classEnd = path.node.body.end;
      
      for (let method of path.node.body.body) {
        if (method.type === 'ClassMethod' && method.key.name !== 'constructor') {
          let methodCode = code.slice(method.start, method.end);
          methods[method.key.name] = methodCode;
        }
      }
    }
  }
});

// Group methods:
const groups = {
  layout: ['_applyLayout', '_layHorizontal', '_layFromParent', '_layFreeForm', '_layVertical', '_layTopDown', '_layList', '_layLinear', '_layRadial', '_layMatrix', '_subH', '_subtreeRect', '_placeChildren'],
  render: ['_setupMeasurer', '_measureW', '_wrapText', '_nodeDims', '_renderNode', '_renderEdges', '_renderCrossLinks', 'render'],
  events: ['_setupCanvas', '_setupToolbar', '_setupPanels', '_setupSearch', '_setupKeyboard', '_setupContextMenu', '_attachNodeEvents', 'toggleCollapse', 'toggleWrap', '_getBranchNodes', '_selectBranch', 'selectNode', 'panToNode'],
  storage: ['_saveDB', '_loadDB', '_saveSettings', '_loadSettings', 'exportJSON', 'importJSON', 'exportPNG', 'btn-drive-save', '_initGsi', '_handleCredentialResponse', '_showDrivePicker', '_saveToDrivePicker', '_doSaveToDrive', '_fetchDriveFile'],
  history: ['undo', 'redo', '_pushUndo', '_snap', '_restore', '_buildPayload', '_applyPayload'],
  crud: ['init', '_createSampleData', '_addNode', 'deleteNode', 'editNode', 'setNodeUrl', '_rebuildAncestry'],
  modals: ['_setupModals', '_showModal', '_hideModal', '_updateOutline', '_renderOutline', '_updateCommentList']
};

const assigned = new Set(Object.values(groups).flat());
const allMethods = Object.keys(methods);
const missing = allMethods.filter(m => !assigned.has(m) && m !== 'constructor');
if (missing.length > 0) {
  // Let's just put all missing methods into modals/misc for now
  groups.modals.push(...missing);
}

for (const [groupName, methodNames] of Object.entries(groups)) {
  let groupCode = methodNames.map(m => methods[m] || '').filter(Boolean).join('\n\n');
  let finalCode = `import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from '${groupName === 'layout' || groupName === 'storage' || groupName === 'history' || groupName === 'crud' ? '.' : '..'}/core/utils.js';\n\n`;
  // Fix utils path
  finalCode = finalCode.replace("'./core/utils.js'", "'./utils.js'");
  
  finalCode += `export const ${groupName.charAt(0).toUpperCase() + groupName.slice(1)}Mixin = class {\n${groupCode}\n}.prototype;\n`;
  
  if (['layout', 'storage', 'history', 'crud'].includes(groupName)) {
    fs.writeFileSync(`src/core/${groupName}.js`, finalCode);
  } else {
    fs.writeFileSync(`src/ui/${groupName}.js`, finalCode);
  }
}

// Now write the new app.js
let preamble = code.slice(0, classStart + 1); // up to `{`
let constructorCode = methods['constructor'] ? code.slice(methods['constructor'].start, methods['constructor'].end) : '';
// wait, constructor wasn't in `methods` because I skipped it. Let's just find it.
let constructorStr = '';
traverse(ast, {
  ClassDeclaration(path) {
    if (path.node.id && path.node.id.name === 'MindMapApp') {
      for (let method of path.node.body.body) {
        if (method.type === 'ClassMethod' && method.key.name === 'constructor') {
          constructorStr = code.slice(method.start, method.end);
        }
      }
    }
  }
});

let postamble = code.slice(classEnd); // `}` and beyond

let newApp = `
import * as Sentry from '@sentry/browser';

try {
  Sentry.init({
    dsn: "https://ae88499efe5421bfc61b1718689c5ad4@o4511514561085440.ingest.us.sentry.io/4511514576683008",
    integrations: [],
    tracesSampleRate: 1.0,
  });
} catch(e) {}

${preamble}
${constructorStr}
}

import { LayoutMixin } from './src/core/layout.js';
import { StorageMixin } from './src/core/storage.js';
import { HistoryMixin } from './src/core/history.js';
import { RenderMixin } from './src/ui/render.js';
import { EventsMixin } from './src/ui/events.js';
import { CrudMixin } from './src/core/crud.js';
import { ModalsMixin } from './src/ui/modals.js';

function applyMixins(targetClass, baseClasses) {
  baseClasses.forEach(baseClass => {
    Object.getOwnPropertyNames(baseClass).forEach(name => {
      if (name !== 'constructor') {
        Object.defineProperty(
          targetClass.prototype,
          name,
          Object.getOwnPropertyDescriptor(baseClass, name)
        );
      }
    });
  });
}

applyMixins(MindMapApp, [LayoutMixin, StorageMixin, HistoryMixin, RenderMixin, EventsMixin, CrudMixin, ModalsMixin]);

${postamble}

/* ============================================================
   BOOT (async — waits for DB)
   ============================================================ */
let app;
let driveManager;
document.addEventListener('DOMContentLoaded', async () => {
  app = new MindMapApp();
  if (typeof GoogleDriveManager !== 'undefined') {
    driveManager = new GoogleDriveManager(app);
  }

  /* 1. Open IndexedDB */
  try {
    if (typeof DBManager !== 'undefined') {
      app._db = new DBManager();
      await app._db.open();
    }
  } catch(e) {
    console.warn('IndexedDB unavailable, using localStorage fallback', e);
    app._db = null;
  }

  /* 2. Wire map-name input → auto-save on rename */
  const mapNameInput = document.getElementById('map-name-input');
  if (mapNameInput) {
    let nameTimer;
    mapNameInput.addEventListener('input', () => {
      clearTimeout(nameTimer);
      app._setSaveState('saving');
      nameTimer = setTimeout(() => app._saveDB(), 800);
    });
    mapNameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); mapNameInput.blur(); }
    });
  }

  /* 3. Wire Maps modal */
  document.getElementById('btn-maps')?.addEventListener('click', () => app._openMapsModal());
  document.getElementById('btn-new-map')?.addEventListener('click', async () => {
    app._hideModal('modal-maps');
    await app._createNewMap();
  });
  document.getElementById('btn-new-map-menu')?.addEventListener('click', async () => {
    await app._createNewMap();
  });
  document.querySelector('[data-close="modal-maps"]')?.addEventListener('click', () =>
    app._hideModal('modal-maps'));

  /* 4. Init main app UI */
  app.init();

  /* 5. Load last used map */
  const loaded = await app._loadLastMap();
  if (!loaded) {
    /* fresh start */
    const c = document.getElementById('canvas-container');
    app.panX = (c?.clientWidth  || 800) / 2;
    app.panY = (c?.clientHeight || 600) / 2;
    app._createSampleData();
  }

  app.render();
  app._updateZoomLabel();
  app._updateUndoBtns();
  app._setSaveState('ok');

  /* 6. Override _schedSave to also mark dirty */
  const origSchedule = app._schedSave.bind(app);
  app._schedSave = function() {
    app._setSaveState('saving');
    origSchedule();
  };

  window.mindmap = app;
});
`;

fs.writeFileSync('app.js', newApp);
console.log('AST Refactor Complete!');
