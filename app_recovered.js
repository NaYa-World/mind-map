'use strict';

/* ============================================================
   CONSTANTS & CONFIG
   ============================================================ */

const CFG = {
  NODE_H:      40,
  NODE_MIN_W:  88,
  NODE_PAD_X:  20,
  NODE_MAX_W:  220,  // max node width before text wraps
  LINE_H:      20,   // line height for wrapped text
  ROOT_H:      54,
  ROOT_MIN_W:  130,
  H_GAP:       170,
  V_GAP:       22,
  ZOOM_MIN:    0.05,
  ZOOM_MAX:    5.0,
  ZOOM_BTN:    1.25,
  ZOOM_SCROLL: 0.002,
  ZOOM_CAP:    0.15,
  MAX_UNDO:    60,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ---- THEMES ---- */
const THEMES = {
  bright: {
    name: 'Bright Colors',
    root: '#4DD0E1',
    palette: ['#66BB6A','#EF5350','#FFA726','#AB47BC','#26C6DA','#EC407A','#26A69A','#7E57C2'],
  },
  soft: {
    name: 'Soft Colors',
    root: '#80CBC4',
    palette: ['#A5D6A7','#F48FB1','#FFE082','#CE93D8','#80DEEA','#FFCC80','#B0BEC5','#EF9A9A'],
  },
  blueSteel: {
    name: 'Blue Steel',
    root: '#42A5F5',
    palette: ['#1565C0','#1976D2','#2196F3','#42A5F5','#64B5F6','#90CAF9','#1E88E5','#0D47A1'],
  },
  spring: {
    name: 'Spring Levels',
    root: '#00BCD4',
    palette: ['#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#FF5722','#009688','#3F51B5'],
  },
  pastel: {
    name: 'Pastel Colors',
    root: '#CE93D8',
    palette: ['#FFCDD2','#C8E6C9','#BBDEFB','#FFF9C4','#E1BEE7','#B2EBF2','#FFE0B2','#D7CCC8'],
  },
  bw: {
    name: 'Black & White',
    root: '#EEEEEE',
    palette: ['#BDBDBD','#9E9E9E','#757575','#616161','#E0E0E0','#F5F5F5','#424242','#FAFAFA'],
  },
};

/* ---- LAYOUTS ---- */
const LAYOUTS = [
  { id:'horizontal', name:'Horizontal Layout' },
  { id:'fromParent', name:'From Parent' },
  { id:'freeForm',   name:'Free Form Layout' },
  { id:'vertical',   name:'Vertical Layout' },
  { id:'topDown',    name:'Top Down Layout' },
  { id:'list',       name:'List Layout' },
  { id:'linear',     name:'Linear Layout' },
  { id:'radial',     name:'Radial Layout' },
  { id:'matrix',     name:'Matrix Layout' },
];

/* ---- LAYOUT PREVIEW SVGs ---- */
const LAYOUT_PREVIEWS = {
  horizontal:`<ellipse cx="0" cy="0" rx="18" ry="10" fill="#4DD0E1"/>
    <rect x="32" y="-18" width="32" height="12" rx="6" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="32" y="6" width="32" height="12" rx="6" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="-64" y="-18" width="32" height="12" rx="6" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="-64" y="6" width="32" height="12" rx="6" fill="none" stroke="#AB47BC" stroke-width="2"/>
    <path d="M18,-4 C25,-4 25,-12 32,-12" stroke="#66BB6A" fill="none" stroke-width="2"/>
    <path d="M18,4 C25,4 25,12 32,12" stroke="#EF5350" fill="none" stroke-width="2"/>
    <path d="M-18,-4 C-25,-4 -25,-12 -32,-12" stroke="#FFA726" fill="none" stroke-width="2"/>
    <path d="M-18,4 C-25,4 -25,12 -32,12" stroke="#AB47BC" fill="none" stroke-width="2"/>`,
  fromParent:`<ellipse cx="-50" cy="0" rx="14" ry="9" fill="#4DD0E1"/>
    <rect x="-26" y="-18" width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-26" y="-4"  width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-26" y="10"  width="26" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="10"  y="-22" width="24" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="10"  y="-9"  width="24" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <path d="M-36,0 C-30,0 -30,-13 -26,-13" stroke="#66BB6A" fill="none" stroke-width="1.8"/>
    <path d="M-36,0 C-30,0 -30,1 -26,1" stroke="#66BB6A" fill="none" stroke-width="1.8"/>
    <path d="M-36,0 C-30,0 -30,15 -26,15" stroke="#EF5350" fill="none" stroke-width="1.8"/>`,
  freeForm:`<ellipse cx="0" cy="-4" rx="15" ry="9" fill="#4DD0E1"/>
    <rect x="28" y="-26" width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-56" y="10"  width="26" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="22"  y="14"  width="26" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="1.8"/>
    <rect x="-50" y="-24" width="26" height="10" rx="5" fill="none" stroke="#AB47BC" stroke-width="1.8"/>
    <line x1="15" y1="-4"  x2="28"  y2="-21" stroke="#66BB6A" stroke-width="1.8"/>
    <line x1="-15" y1="-4" x2="-43" y2="15" stroke="#EF5350" stroke-width="1.8"/>
    <line x1="15" y1="-4"  x2="35"  y2="19"  stroke="#FFA726" stroke-width="1.8"/>
    <line x1="-15" y1="-4" x2="-37" y2="-19" stroke="#AB47BC" stroke-width="1.8"/>`,
  vertical:`<rect x="-14" y="-28" width="28" height="12" rx="6" fill="#4DD0E1"/>
    <rect x="-38" y="-8"  width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="12"  y="-8"  width="26" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="-52" y="10"  width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="-26" y="10"  width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="8"   y="10"  width="22" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="1.5"/>
    <path d="M-14,-16 C-25,-16 -25,-3 -25,-3" stroke="#66BB6A" fill="none" stroke-width="2"/>
    <path d="M14,-16 C25,-16 25,-3 25,-3"  stroke="#EF5350" fill="none" stroke-width="2"/>`,
  topDown:`<ellipse cx="0" cy="-22" rx="22" ry="10" fill="#4DD0E1"/>
    <rect x="-62" y="-4" width="30" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="-27" y="-4" width="30" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="10"  y="-4" width="30" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="-62" y="14" width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="-36" y="14" width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <line x1="0" y1="-12" x2="-47" y2="-4" stroke="#66BB6A" stroke-width="2"/>
    <line x1="0" y1="-12" x2="-12" y2="-4" stroke="#EF5350" stroke-width="2"/>
    <line x1="0" y1="-12" x2="25"  y2="-4" stroke="#FFA726" stroke-width="2"/>`,
  list:`<rect x="-70" y="-27" width="38" height="10" rx="4" fill="#4DD0E1"/>
    <rect x="-56" y="-13" width="32" height="9" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-42" y="-1"  width="28" height="9" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="-56" y="11"  width="32" height="9" rx="4" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="-42" y="23"  width="28" height="9" rx="4" fill="none" stroke="#EF5350" stroke-width="1.5"/>
    <line x1="-52" y1="-22" x2="-52" y2="-9" stroke="#66BB6A" stroke-width="1.2"/>
    <line x1="-52" y1="-9" x2="-56" y2="-9" stroke="#66BB6A" stroke-width="1.2"/>
    <line x1="-52" y1="-22" x2="-52" y2="15" stroke="#EF5350" stroke-width="1.2"/>
    <line x1="-52" y1="15" x2="-56" y2="15" stroke="#EF5350" stroke-width="1.2"/>`,
  linear:`<ellipse cx="-62" cy="0" rx="12" ry="8" fill="#4DD0E1"/>
    <rect x="-44" y="-5" width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="-16" y="-5" width="22" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="12"  y="-5" width="22" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="40"  y="-5" width="22" height="10" rx="5" fill="none" stroke="#AB47BC" stroke-width="2"/>
    <line x1="-50" y1="0" x2="-44" y2="0" stroke="#66BB6A" stroke-width="2"/>
    <line x1="-22" y1="0" x2="-16" y2="0" stroke="#EF5350" stroke-width="2"/>
    <line x1="6"   y1="0" x2="12"  y2="0" stroke="#FFA726" stroke-width="2"/>
    <line x1="34"  y1="0" x2="40"  y2="0" stroke="#AB47BC" stroke-width="2"/>`,
  radial:`<ellipse cx="0" cy="0" rx="14" ry="9" fill="#4DD0E1"/>
    <rect x="22"  y="-5"  width="24" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="-46" y="-5"  width="24" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="-9"  y="-28" width="24" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="-9"  y="18"  width="24" height="10" rx="5" fill="none" stroke="#AB47BC" stroke-width="2"/>
    <rect x="18"  y="-22" width="22" height="10" rx="5" fill="none" stroke="#26C6DA" stroke-width="1.5"/>
    <line x1="14" y1="0"   x2="22"  y2="0"   stroke="#66BB6A" stroke-width="2"/>
    <line x1="-14" y1="0"  x2="-22" y2="0"   stroke="#EF5350" stroke-width="2"/>
    <line x1="0"  y1="-9"  x2="3"   y2="-18" stroke="#FFA726" stroke-width="2"/>
    <line x1="0"  y1="9"   x2="3"   y2="18"  stroke="#AB47BC" stroke-width="2"/>`,
  matrix:`<rect x="-64" y="-24" width="20" height="12" rx="4" fill="#4DD0E1"/>
    <rect x="-40" y="-24" width="20" height="12" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-16" y="-24" width="20" height="12" rx="4" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="8"   y="-24" width="20" height="12" rx="4" fill="none" stroke="#FFA726" stroke-width="1.8"/>
    <rect x="32"  y="-24" width="20" height="12" rx="4" fill="none" stroke="#AB47BC" stroke-width="1.8"/>
    <rect x="-64" y="-8"  width="20" height="12" rx="4" fill="none" stroke="#26C6DA" stroke-width="1.5"/>
    <rect x="-40" y="-8"  width="20" height="12" rx="4" fill="none" stroke="#EC407A" stroke-width="1.5"/>
    <rect x="-16" y="-8"  width="20" height="12" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="8"   y="-8"  width="20" height="12" rx="4" fill="none" stroke="#EF5350" stroke-width="1.5"/>
    <rect x="32"  y="-8"  width="20" height="12" rx="4" fill="none" stroke="#FFA726" stroke-width="1.5"/>
    <rect x="-64" y="8"   width="20" height="12" rx="4" fill="none" stroke="#AB47BC" stroke-width="1.5"/>
    <rect x="-40" y="8"   width="20" height="12" rx="4" fill="none" stroke="#26C6DA" stroke-width="1.5"/>`,
};

/* ============================================================
   UTILITY HELPERS
   ============================================================ */
let _idCtr = 1;
const genId = () => `n${Date.now()}_${_idCtr++}`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function svgEl(tag, attrs={}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/* ============================================================
   MINDMAP APPLICATION CLASS
   ============================================================ */
class MindMapApp {
  constructor() {
    /* ---- state ---- */
    this.nodes    = new Map();  // id -> NodeData
    this.rootId   = null;
    this.selected = null;       // selected node id
    this.theme    = 'spring';
    this.layout   = 'horizontal';
    this.zoom     = 1;
    this.panX     = 0;
    this.panY     = 0;

    /* per-node side for horizontal layout ('left'|'right') */
    this.sides    = new Map();
    /* color index counter for branches */
    this.colorIdx = 0;

    /* ---- ui state ---- */
    this.isPanning   = false;
    this.panSX=0; this.panSY=0;
    this.isDragging  = false;
    this.dragId      = null;
    this.dragSX=0; this.dragSY=0;
    this.dragNX=0; this.dragNY=0;
    this.isEditing   = false;
    this.editId      = null;
    this.activePanel = 'outline';
    this.panelOpen   = true;
    this.searchOpen  = false;
    this.searchQ     = '';
    this.searchHits  = [];
    this.searchIdx   = 0;

    /* ---- undo/redo ---- */
    this.undoStack = [];
    this.redoStack = [];

    /* ---- misc ---- */
    this.saveTimer      = null;
    this._measurer      = null;
    this._ctxNodeId     = null;    // right-click target
    this.crossLinks     = [];      // [{id, from, to}]  cross-branch links
    this.crossLinkMode  = false;   // true when waiting for 2nd node click
    this.crossLinkFrom  = null;    // source node id during cross-link mode
  } 

  /* ============================================================
     INIT
     ============================================================ */
  init() {
    this._setupMeasurer();
    this._setupCanvas();
    this._setupToolbar();
    this._setupPanels();
    this._setupModals();
    this._setupKeyboard();
    this._setupContextMenu();
    this._setupSearch();
    /* NOTE: data loading is done in the async boot sequence after init() */
  }
 

  _setupMeasurer() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    Object.assign(svg.style, {
      position:'absolute', visibility:'hidden',
      pointerEvents:'none', top:'-9999px', left:'-9999px'
    });
    document.body.appendChild(svg);
    this._measurer = svgEl('text');
    this._measurer.style.font = '500 14px Inter, sans-serif';
    svg.appendChild(this._measurer);
  }

  _measureW(text) {
    this._measurer.textContent = text || ' ';
    return this._measurer.getBBox().width;
  }

  /* Split text into lines that fit within maxW */
  _wrapText(text, maxW) {
    const words = (text || '').split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (this._measureW(test) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  _nodeDims(node) {
    const isRoot = node.id === this.rootId;
    const px     = isRoot ? 28 : CFG.NODE_PAD_X;
    const baseMaxW = isRoot ? CFG.NODE_MAX_W + 60 : CFG.NODE_MAX_W;
    const maxW   = node.nowrap ? Infinity : baseMaxW;
    const mw     = isRoot ? CFG.ROOT_MIN_W : CFG.NODE_MIN_W;
    const linkW  = node.url ? 18 : 0;  /* extra space for link icon */

    /* Wrap text to get line count */
    const lines  = this._wrapText(node.label, maxW - px * 2 - linkW);
    const lw     = Math.max(...lines.map(l => this._measureW(l)));
    const w      = node.nowrap ? Math.max(mw, lw + px * 2 + linkW) : Math.min(maxW, Math.max(mw, lw + px * 2 + linkW));

    const baseH  = isRoot ? CFG.ROOT_H : CFG.NODE_H;

    const imgH   = node.imageUrl ? 80 : 0;
    return { w, h: baseH + extraH + imgH, lines };
  }

  /* ---- sample data ---- */
  _createSampleData() {
    const root = this._addNode(null, 'Welcome');
    
    /* Top / Left Side */
    this._addNode(root, 'More features and help on website →', { url: 'https://example.com' });
    this._addNode(root, 'Saving Mind Maps', { url: 'https://example.com' });
    const local = this._addNode(root, 'Local');
    this._addNode(local, 'Stored on device only');
    
    const style = this._addNode(root, 'Style', { url: 'https://example.com' });
    this._addNode(style, 'Select a style sheet for the entire mind map', { url: 'https://example.com' });
    const cust = this._addNode(style, 'Customize topics and lines', { url: 'https://example.com' });

    const toolbar = this._addNode(root, 'Topic toolbar', { url: 'https://example.com' });
    this._addNode(toolbar, 'Add images', { url: 'https://example.com' });
    this._addNode(toolbar, 'Add icon', { url: 'https://example.com' });
    this._addNode(toolbar, 'Add navigation link', { url: 'https://example.com' });
    
    const layout = this._addNode(toolbar, 'Layout', { url: 'https://example.com' });
    this._addNode(layout, 'Free form');
    this._addNode(layout, 'Auto arrange');
    
    const cross = this._addNode(toolbar, 'Add cross link', { url: 'https://example.com' });
    this._addNode(cross, 'Drag ⊕ also adds cross link');

    /* Right Side */
    this._addNode(root, 'What is Mind Mapping', { url: 'https://example.com' });
    
    const adding = this._addNode(root, 'Adding topics', { url: 'https://example.com' });
    this._addNode(adding, 'Drag or tap adds child topic');
    this._addNode(adding, 'Drag or tap adds sibling topic');
    
    const editing = this._addNode(root, 'Editing text', { url: 'https://example.com' });
    this._addNode(editing, 'Double tap edits text');
    const wrap = this._addNode(editing, 'Word Wrap tool', { url: 'https://example.com' });
    this._addNode(wrap, 'Adjust line breaks and width');
    
    const sel = this._addNode(root, 'Selecting', { url: 'https://example.com' });
    this._addNode(sel, 'Tap to select');
    this._addNode(sel, 'Long press topic to select topics in branch', { nowrap: false });

    /* Add some sample cross-links similar to screenshot */
    this.crossLinks.push({ id: 'cl_1', from: cross, to: layout });
    this.crossLinks.push({ id: 'cl_2', from: layout, to: cust });
    this.crossLinks.push({ id: 'cl_3', from: toolbar, to: cust });

    this.undoStack = [];
    this.redoStack = [];
  }

  /* ============================================================
     NODE CRUD
     ============================================================ */
  _addNode(parentId, label='New Topic', opts={}) {
    const id = genId();
    const node = {
      id, label,
      parentId: parentId || null,
      children: [],
      comment: '',
      collapsed: false,
      nowrap: opts.nowrap !== undefined ? opts.nowrap : false,
      url: opts.url || null,
      freeX: 0, freeY: 0,
      x: 0, y: 0, w: 0, h: 0,
      color: '#4DD0E1',
    };

    /* assign color */
    if (!parentId) {
      node.color = THEMES[this.theme].root;
    } else if (parentId === this.rootId) {
      const pal = THEMES[this.theme].palette;
      if (opts.color) {
        node.color = opts.color;
      } else {
        node.color = pal[this.colorIdx % pal.length];
        this.colorIdx++;
      }
    } else {
      const par = this.nodes.get(parentId);
      if (opts.diffColor) {
        const pal = THEMES[this.theme].palette;
        const ci  = pal.indexOf(par?.color);
        node.color = pal[(ci + 1 + Math.floor(Math.random()*3)) % pal.length];
      } else {
        node.color = par?.color || THEMES[this.theme].palette[0];
      }
    }

    this.nodes.set(id, node);
    if (parentId) {
      const par = this.nodes.get(parentId);
      if (par) par.children.push(id);
    } else {
      this.rootId = id;
    }
    return id;
  }

  addChildNode(parentId, opts={}) {
    const par = this.nodes.get(parentId);
    if (!par) return null;
    this._pushUndo();
    const id = this._addNode(parentId, 'New Topic', opts);
    if (par.collapsed) par.collapsed = false;
    this._applyLayout();
    this.selected = id;
    this.render();
    this._schedSave();
    this._startEdit(id);
    return id;
  }

  addSiblingNode(sibId) {
    const sib = this.nodes.get(sibId);
    if (!sib || !sib.parentId) return null;
    this._pushUndo();
    const id = this._addNode(sib.parentId, 'New Topic', { color: sib.color });
    this._applyLayout();
    this.selected = id;
    this.render();
    this._schedSave();
    this._startEdit(id);
    return id;
  }

  insertParentNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node || !node.parentId || nodeId === this.rootId) return;
    this._pushUndo();

    const parId  = node.parentId;
    const par    = this.nodes.get(parId);
    const newId  = genId();
    const newNode = {
      id: newId, label: 'New Topic',
      parentId: parId, children: [nodeId],
      comment: '', collapsed: false,
      freeX:0, freeY:0, x:0, y:0, w:0, h:0,
      color: node.color,
    };
    const idx = par.children.indexOf(nodeId);
    par.children[idx] = newId;
    node.parentId = newId;
    this.nodes.set(newId, newNode);

    this._applyLayout();
    this.selected = newId;
    this.render();
    this._schedSave();
    this._startEdit(newId);
  }

  deleteNode(id) {
    if (!id || id === this.rootId) {
      this.toast('Cannot delete the root node', 'warn'); return;
    }
    const node = this.nodes.get(id);
    if (!node) return;
    this._pushUndo();

    /* remove from parent */
    if (node.parentId) {
      const par = this.nodes.get(node.parentId);
      if (par) par.children = par.children.filter(c => c !== id);
    }
    /* recurse */
    const del = nid => {
      const n = this.nodes.get(nid); if (!n) return;
      n.children.forEach(del);
      this.nodes.delete(nid);
      this.sides.delete(nid);
    };
    del(id);
    if (this.selected === id) this.selected = null;
    this._applyLayout();
    this.render();
    this._schedSave();
  }

  renameNode(id, label) {
    const node = this.nodes.get(id);
    if (!node || node.label === label) return;
    this._pushUndo();
    node.label = label;
    const d = this._nodeDims(node);
    node.w = d.w; node.h = d.h;
    this.render();
    this._schedSave();
  }

  toggleCollapse(id) {
    const node = this.nodes.get(id);
    if (!node || node.children.length === 0) return;
    node.collapsed = !node.collapsed;
    this._applyLayout();
    this.render();
    this._schedSave();
  }

  toggleWrap(id) {
    const node = this.nodes.get(id);
    if (!node) return;
    this._pushUndo();
    node.nowrap = !node.nowrap;
    const d = this._nodeDims(node);
    node.w = d.w; node.h = d.h;
    this._applyLayout();
    this.render();
    this._schedSave();
    this.toast(node.nowrap ? 'Text wrapping disabled' : 'Text wrapping enabled', 'info');
  }

  setComment(id, text) {
    const node = this.nodes.get(id);
    if (!node) return;
    node.comment = text.trim();
    this.render();
    this._renderCommentPanel();
    this._schedSave();
  }

  cloneNode(id) {
    const node = this.nodes.get(id);
    if (!node || !node.parentId) return;
    this._pushUndo();

    const cloneRec = (srcId, parId) => {
      const src  = this.nodes.get(srcId); if (!src) return;
      const nid  = genId();
      const copy = { ...src, id: nid, parentId: parId, children: [] };
      this.nodes.set(nid, copy);
      const par  = this.nodes.get(parId);
      if (par) par.children.push(nid);
      src.children.forEach(cid => cloneRec(cid, nid));
    };
    cloneRec(id, node.parentId);
    this._applyLayout();
    this.render();
    this._schedSave();
  }

  /* ============================================================
     VISIBLE CHILDREN & SUBTREE HEIGHT
     ============================================================ */
  _visChildren(id) {
    const n = this.nodes.get(id);
    if (!n || n.collapsed) return [];
    return n.children.filter(c => this.nodes.has(c));
  }

  _subH(id, vg = CFG.V_GAP + 14) {
    const n = this.nodes.get(id);
    if (!n) return CFG.NODE_H + 8;
    const ch = this._visChildren(id);
    if (ch.length === 0) return (n.h || CFG.NODE_H) + 8;
    const tot = ch.reduce((s,c) => s + this._subH(c, vg), 0) + vg * (ch.length - 1);
    return Math.max((n.h || CFG.NODE_H) + 8, tot);
  }

  /* ============================================================
     LAYOUT ALGORITHMS
     ============================================================ */
  _applyLayout(type) {
    const lt = type || this.layout;
    /* compute dims for all nodes */
    this.nodes.forEach(n => {
      const d = this._nodeDims(n); n.w = d.w; n.h = d.h;
    });
    switch (lt) {
      case 'horizontal': this._layHorizontal();  break;
      case 'fromParent': this._layFromParent();   break;
      case 'freeForm':   this._layFreeForm();     break;
      case 'vertical':   this._layVertical();     break;
      case 'topDown':    this._layTopDown();      break;
      case 'list':       this._layList();         break;
      case 'linear':     this._layLinear();       break;
      case 'radial':     this._layRadial();       break;
      case 'matrix':     this._layMatrix();       break;
      case 'addImage': {
          this._showModal('modal-image');
          const inp = document.getElementById('image-url-input');
          if (inp) inp.value = this.nodes.get(id)?.imageUrl || '';
          document.getElementById('modal-image').dataset.nodeId = id;
          break;
        }
      default:           this._layHorizontal();
    }
    
    /* Apply manual drag offsets recursively */
    if (lt !== 'freeForm') {
      const applyOffset = (id, parentDx, parentDy) => {
        const n = this.nodes.get(id);
        if (!n) return;
        const netDx = parentDx + (n.offsetX || 0);
        const netDy = parentDy + (n.offsetY || 0);
        n.x += netDx;
        n.y += netDy;
        if (!n.collapsed) {
          n.children.forEach(cid => applyOffset(cid, netDx, netDy));
        }
      };
      if (this.rootId) {
        applyOffset(this.rootId, 0, 0);
      }
    }
  }

  /* ---- 1. HORIZONTAL (balanced, root center) ---- */
  _layHorizontal() {
    if (!this.rootId) return;
    const root = this.nodes.get(this.rootId);
    root.x = 0; root.y = 0;
    const ch = this._visChildren(this.rootId);
    if (!ch.length) return;

    /* assign sides if not set */
    ch.forEach((cid, i) => {
      if (!this.sides.has(cid)) this.sides.set(cid, i % 2 === 0 ? 'right' : 'left');
    });

    const right = ch.filter(c => this.sides.get(c) === 'right');
    const left  = ch.filter(c => this.sides.get(c) === 'left');

    this._placeSide(right, root, 'right');
    this._placeSide(left,  root, 'left');
  }

  _placeSide(children, parent, dir) {
    if (!children.length) return;
    const vg = CFG.V_GAP + 14;
    const tot = children.reduce((s, c) => s + this._subH(c, vg), 0) + vg * (children.length - 1);
    const xd  = dir === 'right' ? 1 : -1;
    let y = parent.y - tot / 2;

    children.forEach(cid => {
      const child = this.nodes.get(cid);
      const sh    = this._subH(cid, vg);
      child.y = y + sh / 2;
      child.x = parent.x + xd * (parent.w / 2 + CFG.H_GAP + child.w / 2);
      this.sides.set(cid, dir);
      this._placeChildren(cid, dir, vg);
      y += sh + vg;
    });
  }

  _placeChildren(id, dir, vg) {
    const node = this.nodes.get(id);
    const ch   = this._visChildren(id);
    if (!ch.length) return;
    const xd  = dir === 'right' ? 1 : -1;
    const tot = ch.reduce((s, c) => s + this._subH(c, vg), 0) + vg * (ch.length - 1);
    let y = node.y - tot / 2;
    ch.forEach(cid => {
      const child = this.nodes.get(cid);
      const sh    = this._subH(cid, vg);
      child.y = y + sh / 2;
      child.x = node.x + xd * (node.w / 2 + CFG.H_GAP + child.w / 2);
      this.sides.set(cid, dir);
      this._placeChildren(cid, dir, vg);
      y += sh + vg;
    });
  }

  /* ---- 2. FROM PARENT ---- */
  _layFromParent() {
    if (!this.rootId) return;
    const root = this.nodes.get(this.rootId);
    root.x = 0; root.y = 0;
    const place = (pid, dir) => {
      const par = this.nodes.get(pid);
      const ch  = this._visChildren(pid);
      if (!ch.length) return;
      const vg  = CFG.V_GAP + 14;
      const tot = ch.reduce((s, c) => s + this._subH(c, vg), 0) + vg * (ch.length - 1);
      const xd  = dir === 'left' ? -1 : 1;
      let y = par.y - tot / 2;
      ch.forEach(cid => {
        const child = this.nodes.get(cid);
        const sh    = this._subH(cid, vg);
        child.y = y + sh / 2;
        child.x = par.x + xd * (par.w / 2 + CFG.H_GAP + child.w / 2);
        this.sides.set(cid, dir);
        place(cid, dir);
        y += sh + vg;
      });
    };
    place(this.rootId, 'right');
  }

  /* ---- 3. FREE FORM ---- */
  _layFreeForm() {
    if (!this.rootId) return;
    const visit = (id, fx, fy) => {
      const n = this.nodes.get(id); if (!n) return;
      if (n.freeX === 0 && n.freeY === 0) { n.freeX = fx; n.freeY = fy; }
      n.x = n.freeX; n.y = n.freeY;
      n.children.forEach((cid, i) => {
        const ang = (i / Math.max(n.children.length, 1)) * Math.PI * 2;
        visit(cid, fx + Math.cos(ang)*200, fy + Math.sin(ang)*150);
      });
    };
    visit(this.rootId, 0, 0);
  }

  /* ---- 4. VERTICAL (top-left tree) ---- */
  _layVertical() {
    if (!this.rootId) return;
    const hg = 36;
    const vg = CFG.H_GAP * 0.65;

    const subW = id => {
      const n  = this.nodes.get(id); if (!n) return CFG.NODE_MIN_W;
      const ch = this._visChildren(id);
      if (!ch.length) return n.w;
      return Math.max(n.w, ch.reduce((s, c) => s + subW(c), 0) + hg * (ch.length - 1));
    };

    const place = (id, x, depth) => {
      const n  = this.nodes.get(id); if (!n) return 0;
      n.y = depth * (CFG.NODE_H + vg / 2.5);
      const ch = this._visChildren(id);
      if (!ch.length) { n.x = x; return n.w; }
      let cx = x;
      const ws = ch.map(c => { const w = place(c, cx, depth+1); cx += w + hg; return w; });
      const tw = ws.reduce((a,b)=>a+b,0) + hg*(ch.length-1);
      n.x = x + tw/2;
      return Math.max(tw, n.w);
    };

    const tw = subW(this.rootId);
    place(this.rootId, -tw/2, 0);
  }

  /* ---- 5. TOP DOWN ---- */
  _layTopDown() {
    this._layVertical();
    const root = this.nodes.get(this.rootId);
    if (root) {
      /* shift everything down so root is at y=0 */
      let minY = Infinity;
      this.nodes.forEach(n => { minY = Math.min(minY, n.y); });
      this.nodes.forEach(n => { n.y -= minY; });
    }
  }

  /* ---- 6. LIST ---- */
  _layList() {
    if (!this.rootId) return;
    const indX = 130, vg = 52;
    let cy = 0;
    const place = (id, depth) => {
      const n = this.nodes.get(id); if (!n) return;
      n.x = depth * indX;
      n.y = cy; cy += vg;
      if (!n.collapsed) this._visChildren(id).forEach(c => place(c, depth+1));
    };
    place(this.rootId, 0);
  }

  /* ---- 7. LINEAR ---- */
  _layLinear() {
    if (!this.rootId) return;
    const gap  = CFG.H_GAP * 0.6;
    const all  = [];
    const collect = id => {
      all.push(id);
      this._visChildren(id).forEach(collect);
    };
    collect(this.rootId);
    const totW = all.reduce((s, id) => s + (this.nodes.get(id)?.w || CFG.NODE_MIN_W) + gap, 0);
    let x = -totW/2;
    all.forEach(id => {
      const n = this.nodes.get(id); if (!n) return;
      n.x = x + n.w/2; n.y = 0;
      x += n.w + gap;
    });
  }

  /* ---- 8. RADIAL ---- */
  _layRadial() {
    if (!this.rootId) return;
    const root = this.nodes.get(this.rootId);
    root.x = 0; root.y = 0;
    const R_STEP = 210;
    const placeLevel = (ids, radius, startA, endA) => {
      if (!ids.length) return;
      const span = endA - startA;
      ids.forEach((id, i) => {
        const n   = this.nodes.get(id); if (!n) return;
        const ang = startA + (i + 0.5) * span / ids.length;
        n.x = Math.cos(ang) * radius;
        n.y = Math.sin(ang) * radius;
        this.sides.set(id, n.x >= 0 ? 'right' : 'left');
        const ch = this._visChildren(id);
        const aStart = startA + i * span / ids.length;
        const aEnd   = startA + (i+1) * span / ids.length;
        placeLevel(ch, radius + R_STEP, aStart, aEnd);
      });
    };
    placeLevel(this._visChildren(this.rootId), R_STEP, 0, Math.PI*2);
  }

  /* ---- 9. MATRIX ---- */
  _layMatrix() {
    if (!this.rootId) return;
    const all  = [];
    const collect = id => { all.push(id); this._visChildren(id).forEach(collect); };
    collect(this.rootId);
    const cols  = Math.ceil(Math.sqrt(all.length));
    const cellW = 210, cellH = 90;
    const root  = this.nodes.get(this.rootId);
    root.x = 0; root.y = -(Math.ceil(all.length / cols) * cellH + cellH);
    all.slice(1).forEach((id, i) => {
      const n = this.nodes.get(id); if (!n) return;
      const col = i % cols, row = Math.floor(i / cols);
      n.x = (col - (cols-1)/2) * cellW;
      n.y = row * cellH;
    });
  }

  /* ============================================================
     RENDER
     ============================================================ */
  render() {
    this._applyLayout();
    this._renderEdges();
    this._renderCrossLinks();
    this._renderNodes();
    this._renderOutline();
    this._updateTransform();
  }

  _updateTransform() {
    const g = document.getElementById('canvas-root');
    if (g) g.setAttribute('transform', `translate(${this.panX},${this.panY}) scale(${this.zoom})`);
  }

  /* ---- VISIBILITY ---- */
  _getVisibleIds() {
    const visibleIds = new Set();
    const markVisible = (id) => {
      visibleIds.add(id);
      const n = this.nodes.get(id);
      if (!n || n.collapsed) return;
      n.children.forEach(cid => markVisible(cid));
    };
    if (this.rootId) markVisible(this.rootId);
    return visibleIds;
  }

  /* ---- EDGES ---- */
  _renderEdges() {
    const layer = document.getElementById('edges-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const visibleIds = this._getVisibleIds();

    this.nodes.forEach(node => {
      if (!node.parentId) return;
      if (!visibleIds.has(node.id)) return; /* child hidden means edge hidden */
      const par = this.nodes.get(node.parentId);
      if (!par) return;
      layer.appendChild(this._makeEdge(par, node));
    });
  }

  _makeEdge(par, child) {
    const side = this.sides.get(child.id);
    let x1, y1, x2, y2;

    if (this.layout === 'topDown' || this.layout === 'vertical') {
      x1 = par.x;   y1 = par.y  + par.h / 2;
      x2 = child.x; y2 = child.y - child.h / 2;
    } else if (this.layout === 'radial') {
      x1 = par.x; y1 = par.y; x2 = child.x; y2 = child.y;
    } else if (this.layout === 'list') {
      x1 = par.x  + par.w  / 2;
      y1 = par.y;
      x2 = child.x - child.w / 2;
      y2 = child.y;
    } else if (this.layout === 'linear' || this.layout === 'matrix') {
      x1 = par.x  + par.w  / 2; y1 = par.y;
      x2 = child.x - child.w / 2; y2 = child.y;
    } else {
      /* horizontal / fromParent / freeForm */
      const goLeft = side === 'left' || (par.x > child.x);
      if (goLeft) {
        x1 = par.x   - par.w   / 2;
        x2 = child.x + child.w / 2;
      } else {
        x1 = par.x   + par.w   / 2;
        x2 = child.x - child.w / 2;
      }
      y1 = par.y; y2 = child.y;
    }

    let d;
    if (this.layout === 'topDown' || this.layout === 'vertical') {
      const cy = (y1 + y2) / 2;
      d = `M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`;
    } else if (this.layout === 'radial' || this.layout === 'linear' || this.layout === 'matrix') {
      d = `M${x1},${y1} L${x2},${y2}`;
    } else if (this.layout === 'list') {
      d = `M${x1},${y1} L${x1},${y2} L${x2},${y2}`;
    } else {
      const cx = (x1 + x2) / 2;
      d = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }

    const isRootChild = child.parentId === this.rootId;
    return svgEl('path', {
      d, stroke: child.color,
      'stroke-width': isRootChild ? 3 : 2,
      fill: 'none',
      'stroke-linecap': 'round',
      class: 'edge',
    });
  }

  /* ---- NODES ---- */
  /* ---- CROSS LINKS ---- */
  _renderCrossLinks() {
    const layer = document.getElementById('cross-links-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const visibleIds = this._getVisibleIds();

    this.crossLinks.forEach(cl => {
      if (!visibleIds.has(cl.from) || !visibleIds.has(cl.to)) return;

      const a = this.nodes.get(cl.from);
      const b = this.nodes.get(cl.to);
      if (!a || !b) return;

      /* Control point: midpoint offset perpendicularly for a nice curve */
      const mx  = (a.x + b.x) / 2;
      const my  = (a.y + b.y) / 2;
      const dx  = b.x - a.x;
      const dy  = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const curve = Math.min(80, len * 0.35);
      const cx  = mx - (dy / len) * curve;
      const cy  = my + (dx / len) * curve;

      const path = svgEl('path', {
        d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`,
        fill: 'none',
        stroke: '#a0a0c0',
        'stroke-width': '1.8',
        'stroke-dasharray': '6 4',
        'marker-end': 'url(#arrow-cross)',
        opacity: '0.8',
        cursor: 'pointer',
        'data-cl-id': cl.id,
      });

      /* click to delete cross-link */
      path.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('Remove this cross link?')) {
          this.deleteCrossLink(cl.id);
        }
      });

      /* tooltip */
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = `Cross link: ${a.label} → ${b.label}  (click to delete)`;
      path.appendChild(title);

      layer.appendChild(path);
    });
  }

  startCrossLink(fromId) {
    this.crossLinkMode = true;
    this.crossLinkFrom = fromId;
    /* Show banner */
    let banner = document.getElementById('crosslink-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'crosslink-banner';
      banner.style.cssText = [
        'position:fixed','bottom:72px','left:50%','transform:translateX(-50%)',
        'background:#4fc3f7','color:#0a0a0f','padding:10px 22px','border-radius:50px',
        'font-size:13px','font-weight:600','z-index:9999','box-shadow:0 4px 20px rgba(0,0,0,0.4)',
        'pointer-events:none','animation:fadeIn 0.2s ease',
      ].join(';');
      document.body.appendChild(banner);
    }
    const srcLabel = this.nodes.get(fromId)?.label || 'node';
    banner.textContent = `🔗 Cross Link from "${srcLabel}" — now click the target node  (Esc to cancel)`;
    banner.style.display = 'block';
  }

  _finishCrossLink(toId) {
    const banner = document.getElementById('crosslink-banner');
    if (banner) banner.style.display = 'none';
    if (!this.crossLinkFrom || this.crossLinkFrom === toId) {
      this.crossLinkMode = false; this.crossLinkFrom = null; return;
    }
    /* check not already linked */
    const exists = this.crossLinks.some(
      cl => (cl.from === this.crossLinkFrom && cl.to === toId) ||
            (cl.from === toId && cl.to === this.crossLinkFrom));
    if (exists) { this.toast('Cross link already exists', 'warn'); }
    else {
      this._pushUndo();
      this.crossLinks.push({ id: `cl_${Date.now()}`, from: this.crossLinkFrom, to: toId });
      this._renderCrossLinks();
      this._schedSave();
      this.toast('Cross link added!', 'success');
    }
    this.crossLinkMode = false; this.crossLinkFrom = null;
  }

  deleteCrossLink(id) {
    this._pushUndo();
    this.crossLinks = this.crossLinks.filter(cl => cl.id !== id);
    this._renderCrossLinks();
    this._schedSave();
    this.toast('Cross link removed', 'info');
  }

  _renderNodes() {
    const layer = document.getElementById('nodes-layer');
    if (!layer) return;

    /* remove orphaned groups */
    layer.querySelectorAll('.node-group').forEach(el => {
      if (!this.nodes.has(el.dataset.id)) el.remove();
    });

    /* compute the set of nodes that are VISIBLE */
    const visibleIds = this._getVisibleIds();

    /* render each node and show/hide its group */
    this.nodes.forEach(n => {
      this._renderNode(n);
      const g = layer.querySelector(`[data-id="${n.id}"]`);
      if (g) g.style.display = visibleIds.has(n.id) ? '' : 'none';
    });
  }

  _renderNode(node) {
    const layer  = document.getElementById('nodes-layer');
    const isRoot = node.id === this.rootId;
    const isSel  = node.id === this.selected;
    const dim    = this._nodeDims(node);
    node.w = dim.w; node.h = dim.h;

    let g = layer.querySelector(`[data-id="${node.id}"]`);

    if (!g) {
      g = svgEl('g', { class:'node-group', 'data-id': node.id, cursor:'pointer' });

      /* hover bridge to prevent losing hover when moving to buttons */
      g.appendChild(svgEl('rect', { class:'node-hover-bridge', fill:'transparent' }));

      /* body */
      g.appendChild(svgEl('rect', { class:'node-body' }));
      /* border */
      g.appendChild(svgEl('rect', { class:'node-border' }));
      /* label */
      const lbl = svgEl('text', { class:'node-label' });
      g.appendChild(lbl);
      /* link icon (clickable ↗) */
      const linkIcon = svgEl('text', { class:'node-link-icon', cursor:'pointer',
        'text-anchor':'middle', 'dominant-baseline':'middle',
        'font-size':'13', 'font-family':'Inter, sans-serif',
        fill:'#4fc3f7', 'pointer-events':'all' });
      linkIcon.textContent = '↗';
      const linkTitle = document.createElementNS(SVG_NS, 'title');
      linkTitle.textContent = 'Open link';
      linkIcon.appendChild(linkTitle);
      g.appendChild(linkIcon);
      /* comment circle */
      g.appendChild(svgEl('circle', { class:'node-comment-dot', r:6 }));

      /* collapse btn */
      const cb = svgEl('g', { class:'node-collapse-btn' });
      cb.appendChild(svgEl('circle', { r:9 }));
      const ca = svgEl('text', { class:'collapse-arrow' });
      cb.appendChild(ca);
      g.appendChild(cb);

      /* wrap btn */
      const wb = svgEl('g', { class:'node-wrap-btn', cursor:'pointer' });
      wb.appendChild(svgEl('circle', { r:9 }));
      const wa = svgEl('text', { class:'wrap-arrow' });
      wb.appendChild(wa);
      const wt = document.createElementNS(SVG_NS, 'title');
      wt.textContent = 'Toggle text wrapping';
      wb.appendChild(wt);
      g.appendChild(wb);

      /* image element for rich media */
      g.appendChild(svgEl('image', { class:'node-image', preserveAspectRatio:'xMidYMid meet' }));

      /* actions group */
      const ag = svgEl('g', { class:'node-actions' });

      const mkBtn = (cls, sym, tip) => {
        const btn = svgEl('g', { class:`action-btn ${cls}` });
        btn.appendChild(svgEl('circle', { r:10 }));
        const t = svgEl('text', { class:'action-sym' });
        t.textContent = sym;
        btn.appendChild(t);
        /* tooltip */
        const title = document.createElementNS(SVG_NS, 'title');
        title.textContent = tip;
        btn.appendChild(title);
        return btn;
      };
      ag.appendChild(mkBtn('btn-add-child',   '+',  'Add child topic'));
      ag.appendChild(mkBtn('btn-add-sibling', '⬡', 'Add sibling topic'));
      ag.appendChild(mkBtn('btn-comment',     'T',  'Add / edit note'));
      g.appendChild(ag);

      layer.appendChild(g);
      this._attachNodeEvents(g, node.id);
    }

    /* ---- update visuals ---- */
    const x = node.x - node.w / 2;
    const y = node.y - node.h / 2;
    const rx = node.h / 2;

    /* body */
    const body = g.querySelector('.node-body');
    body.setAttribute('x', x); body.setAttribute('y', y);
    body.setAttribute('width', node.w); body.setAttribute('height', node.h);
    body.setAttribute('rx', rx); body.setAttribute('ry', rx);
    body.setAttribute('fill', isRoot ? node.color : '#1c1c28');
    body.setAttribute('filter', isRoot ? 'url(#f-shadow)' : 'none');

    /* border */
    const border = g.querySelector('.node-border');
    border.setAttribute('x', x); border.setAttribute('y', y);
    border.setAttribute('width', node.w); border.setAttribute('height', node.h);
    border.setAttribute('rx', rx); border.setAttribute('ry', rx);
    border.setAttribute('fill', 'none');
    if (isSel) {
      border.setAttribute('stroke', '#fff');
      border.setAttribute('stroke-width', '2.5');
      border.setAttribute('filter', 'url(#f-selected)');
    } else {
      border.setAttribute('stroke', isRoot ? 'none' : node.color);
      border.setAttribute('stroke-width', '2');
      border.removeAttribute('filter');
    }

    /* label — multi-line with tspan wrapping */
    const lbl = g.querySelector('.node-label');
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('fill', isRoot ? '#0a0a0f' : '#eeeef5');
    lbl.setAttribute('font-size', isRoot ? 17 : 14);
    lbl.setAttribute('font-weight', isRoot ? 700 : 500);
    lbl.setAttribute('font-family', 'Inter, sans-serif');
    lbl.setAttribute('pointer-events', 'none');
    /* Rebuild tspan lines */
    while (lbl.firstChild) lbl.removeChild(lbl.firstChild);
    const dim2   = this._nodeDims(node);
    const lines  = dim2.lines || [node.label];
    const lineH  = CFG.LINE_H;
    const totalH = (lines.length - 1) * lineH;
    const labelY = node.imageUrl
      ? node.y - node.h / 2 + (node.h - (node.imageUrl ? 80 : 0)) / 2
      : node.y;
    lines.forEach((line, i) => {
      const ts = svgEl('tspan', { x: node.x, dy: i === 0 ? (-totalH / 2) : lineH });
      ts.textContent = line;
      lbl.appendChild(ts);
    });
    lbl.setAttribute('y', labelY + 5);

    /* link icon */
    const linkIcon = g.querySelector('.node-link-icon');
    if (linkIcon) {
      if (node.url) {
        linkIcon.setAttribute('x', node.x + node.w / 2 - 12);
        linkIcon.setAttribute('y', node.y - node.h / 2 + 14);
        linkIcon.style.display = 'block';
      } else {
        linkIcon.style.display = 'none';
      }
    }

    /* comment dot */
    const dot = g.querySelector('.node-comment-dot');
    if (node.comment) {
      dot.setAttribute('cx', x + node.w - 4);
      dot.setAttribute('cy', y - 4);
      dot.setAttribute('fill', '#aaaaaa');
      dot.setAttribute('stroke', '#13131a');
      dot.setAttribute('stroke-width', '1.5');
      dot.style.display = 'block';
    } else {
      dot.style.display = 'none';
    }

    /* collapse btn */
    const cb   = g.querySelector('.node-collapse-btn');
    const hasCh = node.children.length > 0;
    if (hasCh && !isRoot) {
      const side = this.sides.get(node.id);
      let cbx;
      if (this.layout === 'horizontal' || this.layout === 'fromParent') {
        cbx = side === 'left' ? x + node.w + 13 : x - 13;
      } else if (this.layout === 'topDown' || this.layout === 'vertical') {
        cbx = node.x;
      } else {
        cbx = x - 13;
      }
      const cby = this.layout === 'topDown' || this.layout === 'vertical'
                  ? y + node.h + 12 : node.y;
      cb.setAttribute('transform', `translate(${cbx},${cby})`);
      const cbc = cb.querySelector('circle');
      cbc.setAttribute('fill', '#252530');
      cbc.setAttribute('stroke', node.color);
      cbc.setAttribute('stroke-width', '1.8');
      const cba = cb.querySelector('.collapse-arrow');
      cba.setAttribute('text-anchor', 'middle');
      cba.setAttribute('dominant-baseline', 'middle');
      cba.setAttribute('fill', '#eeeef5');
      cba.setAttribute('font-size', '10');
      cba.setAttribute('font-family', 'Inter, sans-serif');
      cba.textContent = node.collapsed ? '▶' : '▼';
      cb.style.display = 'block';
    } else {
      cb.style.display = 'none';
    }

    /* action buttons */
    const side = this.sides.get(node.id);
                 
    /* update hover bridge */
    const bridge = g.querySelector('.node-hover-bridge');
    if (bridge) {
      const bX = x - 30;
      const bW = node.w + 60;
      bridge.setAttribute('x', bX);
      bridge.setAttribute('y', y - 30);
      bridge.setAttribute('width', bW);
      bridge.setAttribute('height', node.h + 60);
    }
    const btnAddCh  = g.querySelector('.btn-add-child');
    const btnAddSib = g.querySelector('.btn-add-sibling');
    const btnCmt    = g.querySelector('.btn-comment');

    /* style buttons */
    const styleBtn = (b, bx, by, strokeCol) => {
      if (!b) return;
      b.setAttribute('transform', `translate(${bx},${by})`);
      const c = b.querySelector('circle');
      c.setAttribute('fill', '#252530');
      c.setAttribute('stroke', strokeCol);
      c.setAttribute('stroke-width', '1.5');
      const t = b.querySelector('.action-sym');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'middle');
      t.setAttribute('fill', '#eeeef5');
      t.setAttribute('font-size', '14');
      t.setAttribute('font-family', 'Inter, sans-serif');
      t.setAttribute('font-weight', '600');
    };

    const goLeft = (side === 'left' && !isRoot);
    const actX = goLeft ? x - 13 : x + node.w + 13;
    styleBtn(btnAddCh,  actX, node.y, node.color);
    styleBtn(btnAddSib, actX, node.y + 28, node.color);
    
    // Top corner for comment
    const cmtX = goLeft ? x + 10 : x + node.w - 10;
    const cmtY = y;
    styleBtn(btnCmt, cmtX, cmtY, '#888');

    /* wrap btn styling */
    const wb = g.querySelector('.node-wrap-btn');
    if (wb) {
      // Bottom-right corner placement
      const wbx = x + node.w - 18;
      const wby = y + node.h;
      wb.setAttribute('transform', `translate(${wbx},${wby})`);
      const wbc = wb.querySelector('circle');
      wbc.setAttribute('fill', '#4f4f5f'); // distinct gray bg to differentiate from collapse
      wbc.setAttribute('stroke', '#1c1c28'); // border to blend with node border
      wbc.setAttribute('stroke-width', '1.5');
      const wba = wb.querySelector('.wrap-arrow');
      wba.setAttribute('text-anchor', 'middle');
      wba.setAttribute('dominant-baseline', 'middle');
      wba.setAttribute('fill', '#fff');
      wba.setAttribute('font-size', '11');
      wba.setAttribute('font-family', 'Inter, sans-serif');
      wba.textContent = node.nowrap ? '◂▸' : '▴▾';
    }

    /* search highlight */
    if (this.searchHits.includes(node.id)) {
      g.classList.add('node-search-match');
    } else {
      g.classList.remove('node-search-match');
    }

    g.classList.toggle('node-selected', isSel);
    g.dataset.x = node.x; g.dataset.y = node.y;

    /* rich media: image */
    const imgEl = g.querySelector('.node-image');
    if (imgEl) {
      if (node.imageUrl) {
        const imgW = node.w - 8;
        const imgH = 76;
        const imgY = node.y - node.h / 2 + (node.h - imgH) - 2;
        imgEl.setAttribute('href', node.imageUrl);
        imgEl.setAttribute('x', node.x - imgW / 2);
        imgEl.setAttribute('y', imgY);
        imgEl.setAttribute('width', imgW);
        imgEl.setAttribute('height', imgH);
        imgEl.style.display = 'block';
        /* clip rounded corners */
        imgEl.setAttribute('clip-path', `inset(0 round 6px)`);
      } else {
        imgEl.style.display = 'none';
      }
    }
  }

  _attachNodeEvents(g, id) {
    /* select + start drag (or cross link) */
    g.addEventListener('mousedown', e => {
      if (e.target.closest('.action-btn') || e.target.closest('.node-collapse-btn') || e.target.closest('.node-wrap-btn')) return;
      e.stopPropagation();
      if (this.crossLinkMode) {
        this._finishCrossLink(id);
        return;
      }
      this.selected = id;
      this._renderNodes();
      this._renderOutline();
      this._startDrag(e, id);
    });

    g.addEventListener('touchstart', e => {
      if (e.target.closest('.action-btn') || e.target.closest('.node-collapse-btn') || e.target.closest('.node-wrap-btn')) return;
      e.stopPropagation();
      this.selected = id;
      this._renderNodes();
      this._renderOutline();
      
      const touch = e.touches[0];
      const n = this.nodes.get(id);
      if (!n) return;
      this.isDragging = true;
      this.dragId  = id;
      this.dragSX  = touch.clientX;
      this.dragSY  = touch.clientY;
      this.dragNX  = n.x;
      this.dragNY  = n.y;
    }, { passive: true });

    /* dbl-click = inline edit */
    g.addEventListener('dblclick', e => {
      e.stopPropagation();
      this._startEdit(id);
    });

    /* right-click = context menu */
    g.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      this.selected = id;
      this._renderNodes();
      this._showCtxMenu(id, e.clientX, e.clientY);
    });

    /* collapse btn */
    g.querySelector('.node-collapse-btn').addEventListener('click', e => {
      e.stopPropagation();
      this.toggleCollapse(id);
    });

    /* add child (+) */
    g.querySelector('.btn-add-child').addEventListener('click', e => {
      e.stopPropagation();
      this.addChildNode(id, { diffColor: true });
    });

    /* add sibling (⬡) */
    g.querySelector('.btn-add-sibling').addEventListener('click', e => {
      e.stopPropagation();
      const node = this.nodes.get(id);
      if (node?.parentId) this.addSiblingNode(id);
      else this.addChildNode(id, { diffColor: false });
    });

    /* comment (T) */
    g.querySelector('.btn-comment').addEventListener('click', e => {
      e.stopPropagation();
      this._showCommentPopover(id, e.clientX, e.clientY);
    });

    /* toggle wrap button click */
    g.querySelector('.node-wrap-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleWrap(id);
    });

    /* link icon click → open URL */
    g.querySelector('.node-link-icon')?.addEventListener('click', e => {
      e.stopPropagation();
      const node = this.nodes.get(id);
      if (node?.url) window.open(node.url, '_blank', 'noopener');
    });
  }

  /* ---- OUTLINE ---- */
  _renderOutline() {
    const tree = document.getElementById('outline-tree');
    if (!tree) return;
    tree.innerHTML = '';
    if (!this.rootId) return;

    const rec = (id, depth) => {
      const n = this.nodes.get(id); if (!n) return;
      const row = document.createElement('div');
      row.className = 'outline-item' + (id === this.selected ? ' oi-selected' : '');
      row.dataset.id = id;
      row.style.paddingLeft = (8 + depth * 16) + 'px';

      const tog = document.createElement('span');
      tog.className = 'oi-toggle';
      
      if (n.children && n.children.length > 0) {
        tog.textContent = n.collapsed ? '▶' : '▼';
        tog.onclick = (e) => {
          e.stopPropagation();
          this.toggleCollapse(id);
        };
      } else {
        tog.innerHTML = '&nbsp;';
      }
      row.appendChild(tog);
      
      const txt = document.createElement('span');
      txt.textContent = n.label;
      row.appendChild(txt);
      
      row.onclick = () => { this.selectNode(id); this.panToNode(id); };
      tree.appendChild(row);
      
      if (!n.collapsed) n.children.forEach(c => rec(c, depth + 1));
    };
    rec(this.rootId, 0);
  }

  /* ---- COMMENT LIST ---- */
  _updateCommentList() {
    const list = document.getElementById('comment-list');
    if (!list) return;
    list.innerHTML = '';

    let any = false;
    this.nodes.forEach(n => {
      if (!n.comment) return;
      any = true;
      const entry = document.createElement('div');
      entry.className = 'comment-entry';
      const lbl = document.createElement('div');
      lbl.className = 'comment-entry-label';
      lbl.textContent = n.label;
      const txt = document.createElement('div');
      txt.className = 'comment-entry-text';
      txt.textContent = n.comment;
      entry.appendChild(lbl); entry.appendChild(txt);
      list.appendChild(entry);
    });
    if (!any) list.innerHTML = '<p class="panel-empty">Click <strong>T</strong> on any node to add a comment.</p>';
  }

  /* ============================================================
     CANVAS SETUP (pan / zoom / drag)
     ============================================================ */
  _setupCanvas() {
    const cont = document.getElementById('canvas-container');
    const svg  = document.getElementById('canvas');
    if (!cont || !svg) return;

    /* pan start on background */
    svg.addEventListener('mousedown', e => {
      if (e.target.closest('.node-group')) return;
      if (e.button !== 0) return;
      this.isPanning = true;
      this.panSX = e.clientX - this.panX;
      this.panSY = e.clientY - this.panY;
      svg.style.cursor = 'grabbing';
      this.selected = null;
      this._renderNodes();
      this._renderOutline();
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panSX;
        this.panY = e.clientY - this.panSY;
        this._updateTransform();
      }
      if (this.isDragging && this.dragId) {
        const dx = (e.clientX - this.dragSX) / this.zoom;
        const dy = (e.clientY - this.dragSY) / this.zoom;
        const n  = this.nodes.get(this.dragId);
        if (n) {
          n.x = this.dragNX + dx;
          n.y = this.dragNY + dy;
          if (this.layout === 'freeForm') { n.freeX = n.x; n.freeY = n.y; }
          this._renderEdges();
          this._renderNode(n);
          /* Reparent ghost: highlight nearest valid drop target */
          this._updateDropTarget(e.clientX, e.clientY);
        }
      }
    });

    document.addEventListener('mouseup', e => {
      if (this.isPanning) { this.isPanning = false; svg.style.cursor = 'default'; }
      if (this.isDragging) {
        this.isDragging = false;
        /* Attempt reparent if there's a valid drop target */
        if (this._dropTargetId && this._dropTargetId !== this.dragId) {
          this._reparentNode(this.dragId, this._dropTargetId);
        } else if (this.layout !== 'freeForm') {
          const n = this.nodes.get(this.dragId);
          if (n && (n.x !== this.dragNX || n.y !== this.dragNY)) {
            n.offsetX = (n.offsetX || 0) + (n.x - this.dragNX);
            n.offsetY = (n.offsetY || 0) + (n.y - this.dragNY);
          }
          this._applyLayout(); this.render();
          this._schedSave();
        } else {
          this._schedSave();
        }
        this._clearDropTarget();
        this.dragId = null;
      }
    });

    /* zoom on wheel — smooth multiplicative, capped per event */
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      // Normalize deltaY: mice give ~100/notch, trackpads give fractional values.
      // Cap the per-event change to ±ZOOM_CAP so a single fast flick can't overshoot.
      const raw     = clamp(e.deltaY * CFG.ZOOM_SCROLL, -CFG.ZOOM_CAP, CFG.ZOOM_CAP);
      const factor  = 1 - raw;                          // 0.92 … 1.08
      const newZ    = clamp(this.zoom * factor, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
      const rect    = svg.getBoundingClientRect();
      const mx      = e.clientX - rect.left;
      const my      = e.clientY - rect.top;
      const wx      = (mx - this.panX) / this.zoom;
      const wy      = (my - this.panY) / this.zoom;
      this.zoom     = newZ;
      this.panX     = mx - wx * this.zoom;
      this.panY     = my - wy * this.zoom;
      this._updateTransform();
      this._updateZoomLabel();
    }, { passive: false });

    // --- Touch Support for Mobile ---
    this.isPinchZooming = false;
    this.pinchStartDist = 0;
    this.pinchStartZoom = 1;
    this.svgRect = null;

    svg.addEventListener('touchstart', e => {
      if (e.target.closest('.node-group')) return;
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.isPanning = true;
        this.panSX = touch.clientX - this.panX;
        this.panSY = touch.clientY - this.panY;
        this.selected = null;
        this._renderNodes();
        this._renderOutline();
      } else if (e.touches.length === 2) {
        this.isPanning = false;
        this.isPinchZooming = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.pinchStartDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        this.pinchStartZoom = this.zoom;
        this.svgRect = svg.getBoundingClientRect();
      }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      const touch = e.touches[0];
      if (this.isPanning && touch) {
        this.panX = touch.clientX - this.panSX;
        this.panY = touch.clientY - this.panY;
        this._updateTransform();
      }
      if (this.isDragging && this.dragId && touch) {
        const dx = (touch.clientX - this.dragSX) / this.zoom;
        const dy = (touch.clientY - this.dragSY) / this.zoom;
        const n  = this.nodes.get(this.dragId);
        if (n) {
          n.x = this.dragNX + dx;
          n.y = this.dragNY + dy;
          if (this.layout === 'freeForm') { n.freeX = n.x; n.freeY = n.y; }
          this._renderEdges();
          this._renderNode(n);
        }
      }
      
      if (e.touches.length === 2 && this.isPinchZooming) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        if (this.pinchStartDist > 0) {
          const scale = dist / this.pinchStartDist;
          const newZ = clamp(this.pinchStartZoom * scale, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
          
          const rect = this.svgRect || svg.getBoundingClientRect();
          const mx = (touch1.clientX + touch2.clientX) / 2 - rect.left;
          const my = (touch1.clientY + touch2.clientY) / 2 - rect.top;
          const wx = (mx - this.panX) / this.zoom;
          const wy = (my - this.panY) / this.zoom;
          
          this.zoom = newZ;
          this.panX = mx - wx * this.zoom;
          this.panY = my - wy * this.zoom;
          
          this._updateTransform();
          this._updateZoomLabel();
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (this.isPanning) {
        this.isPanning = false;
        svg.style.cursor = 'default';
      }
      this.isPinchZooming = false;
      if (this.isDragging) {
        this.isDragging = false;
        if (this.layout !== 'freeForm') {
          const n = this.nodes.get(this.dragId);
          if (n && (n.x !== this.dragNX || n.y !== this.dragNY)) {
            n.offsetX = (n.offsetX || 0) + (n.x - this.dragNX);
            n.offsetY = (n.offsetY || 0) + (n.y - this.dragNY);
          }
          this._applyLayout(); this.render();
        } else {
          this._schedSave();
        }
        this.dragId = null;
      }
    });
  }

  _startDrag(e, id) {
    const n = this.nodes.get(id);
    if (!n) return;
    this.isDragging = true;
    this.dragId  = id;
    this.dragSX  = e.clientX;
    this.dragSY  = e.clientY;
    this.dragNX  = n.x;
    this.dragNY  = n.y;
    this._dropTargetId = null;
  }

  /* Find closest node to mouse (in canvas coords) excluding drag subtree, highlight it */
  _updateDropTarget(clientX, clientY) {
    const svg  = document.getElementById('canvas');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const wx   = (clientX - rect.left - this.panX) / this.zoom;
    const wy   = (clientY - rect.top  - this.panY) / this.zoom;

    /* collect subtree of dragged node to exclude */
    const dragSubtree = new Set();
    const collect = id => { dragSubtree.add(id); (this.nodes.get(id)?.children||[]).forEach(collect); };
    collect(this.dragId);

    let bestId = null, bestDist = 90; /* snap radius in canvas px */
    this.nodes.forEach((n, id) => {
      if (dragSubtree.has(id)) return;
      const dist = Math.hypot(n.x - wx, n.y - wy);
      if (dist < bestDist) { bestDist = dist; bestId = id; }
    });

    if (bestId !== this._dropTargetId) {
      this._clearDropTarget();
      this._dropTargetId = bestId;
      if (bestId) {
        const el = document.querySelector(`[data-id="${bestId}"] .node-body`);
        if (el) el.setAttribute('stroke', '#FFD700');
        if (el) el.setAttribute('stroke-width', '4');
      }
    }
  }

  _clearDropTarget() {
    if (this._dropTargetId) {
      const n  = this.nodes.get(this._dropTargetId);
      const el = document.querySelector(`[data-id="${this._dropTargetId}"] .node-body`);
      if (el && n) {
        el.setAttribute('stroke', n.color);
        el.setAttribute('stroke-width', '2');
      }
    }
    this._dropTargetId = null;
  }

  /* Reparent dragId under newParentId */
  _reparentNode(dragId, newParentId) {
    if (!dragId || !newParentId || dragId === newParentId) return;
    const node      = this.nodes.get(dragId);
    const newParent = this.nodes.get(newParentId);
    if (!node || !newParent) return;

    /* can't reparent root */
    if (dragId === this.rootId) { this.toast('Cannot reparent root', 'warn'); return; }

    this._pushUndo();

    /* remove from old parent */
    if (node.parentId) {
      const oldPar = this.nodes.get(node.parentId);
      if (oldPar) oldPar.children = oldPar.children.filter(c => c !== dragId);
    }

    /* attach to new parent */
    node.parentId = newParentId;
    if (!newParent.children.includes(dragId)) newParent.children.push(dragId);

    this._applyLayout();
    this.render();
    this._schedSave();
    this.toast('Node moved!', 'success');
  }

  _centerOn(id) {
    const n    = this.nodes.get(id); if (!n) return;
    const cont = document.getElementById('canvas-container'); if (!cont) return;
    this.panX = cont.clientWidth  / 2 - n.x * this.zoom;
    this.panY = cont.clientHeight / 2 - n.y * this.zoom;
    this._updateTransform();
  }

  fitToScreen() {
    const cont = document.getElementById('canvas-container'); if (!cont) return;
    let minX=1e9, minY=1e9, maxX=-1e9, maxY=-1e9;
    this.nodes.forEach(n => {
      minX = Math.min(minX, n.x - n.w/2); maxX = Math.max(maxX, n.x + n.w/2);
      minY = Math.min(minY, n.y - n.h/2); maxY = Math.max(maxY, n.y + n.h/2);
    });
    const mw = maxX - minX + 120, mh = maxY - minY + 120;
    this.zoom = clamp(Math.min(cont.clientWidth/mw, cont.clientHeight/mh)*0.9, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
    this.panX = cont.clientWidth  / 2 - ((minX+maxX)/2) * this.zoom;
    this.panY = cont.clientHeight / 2 - ((minY+maxY)/2) * this.zoom;
    this._updateTransform();
    this._updateZoomLabel();
  }

  /* ============================================================
     INLINE EDIT
     ============================================================ */
  _startEdit(id) {
    const node = this.nodes.get(id); if (!node) return;
    this.isEditing = true; this.editId = id;

    const cont    = document.getElementById('canvas-container');
    const overlay = document.getElementById('edit-overlay');
    const input   = document.getElementById('edit-input');
    if (!overlay || !input || !cont) return;

    const cr = cont.getBoundingClientRect();
    const sx = node.x * this.zoom + this.panX;
    const sy = node.y * this.zoom + this.panY;
    const sw = node.w * this.zoom;
    const sh = node.h * this.zoom;
    const isRoot = id === this.rootId;

    input.value       = node.label;
    input.style.left  = (cr.left + sx - sw/2) + 'px';
    input.style.top   = (cr.top  + sy - sh/2) + 'px';
    input.style.width = Math.max(sw, 100) + 'px';
    input.style.height= sh + 'px';
    input.style.fontSize     = (isRoot ? 17 : 14) * this.zoom + 'px';
    input.style.fontWeight   = isRoot ? '700' : '500';
    input.style.color        = isRoot ? '#0a0a0f' : '#eeeef5';
    input.style.background   = isRoot ? node.color : '#1c1c28';
    input.style.borderColor  = node.color;
    input.style.borderRadius = (sh / 2) + 'px';

    overlay.classList.remove('hidden');
    input.focus(); input.select();

    const lbl = document.querySelector(`[data-id="${id}"] .node-label`);
    if (lbl) lbl.style.opacity = '0';
  }

  _commitEdit() {
    if (!this.isEditing) return;
    const input   = document.getElementById('edit-input');
    const overlay = document.getElementById('edit-overlay');
    if (input?.value.trim()) this.renameNode(this.editId, input.value.trim());
    overlay?.classList.add('hidden');
    const lbl = document.querySelector(`[data-id="${this.editId}"] .node-label`);
    if (lbl) lbl.style.opacity = '1';
    this.isEditing = false; this.editId = null;
  }

  _cancelEdit() {
    if (!this.isEditing) return;
    document.getElementById('edit-overlay')?.classList.add('hidden');
    const lbl = document.querySelector(`[data-id="${this.editId}"] .node-label`);
    if (lbl) lbl.style.opacity = '1';
    this.isEditing = false; this.editId = null;
  }

  /* ============================================================
     COMMENT POPOVER
     ============================================================ */
  _showCommentPopover(id, cx, cy) {
    const node  = this.nodes.get(id); if (!node) return;
    const pop   = document.getElementById('comment-popover');
    const ta    = document.getElementById('comment-textarea');
    if (!pop || !ta) return;
    ta.value = node.comment || '';
    pop.style.left = Math.min(cx + 10, window.innerWidth  - 280) + 'px';
    pop.style.top  = Math.min(cy + 10, window.innerHeight - 180) + 'px';
    pop.dataset.nodeId = id;
    pop.classList.remove('hidden');
    ta.focus();
  }

  _hideCommentPopover() {
    document.getElementById('comment-popover')?.classList.add('hidden');
  }

  /* ============================================================
     CONTEXT MENU
     ============================================================ */
  _setupContextMenu() {
    const menu = document.getElementById('ctx-menu');
    if (!menu) return;

    menu.querySelectorAll('[data-ctx]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const act  = btn.dataset.ctx;
        const nid  = this._ctxNodeId;
        menu.classList.add('hidden');
        switch (act) {
          case 'addChild':    this.addChildNode(nid, { diffColor: true }); break;
          case 'addSibling':  this.addSiblingNode(nid); break;
          case 'insertParent':this.insertParentNode(nid); break;
          case 'rename':      this._startEdit(nid); break;
          case 'clone':       this.cloneNode(nid); break;
          case 'collapse':    this.toggleCollapse(nid); break;
          case 'toggleWrap':  this.toggleWrap(nid); break;
          case 'startCrossLink': this.startCrossLink(nid); break;
          case 'delete':      this.deleteNode(nid); break;
          case 'addLink': {
            this._showModal('modal-link');
            const inp2 = document.getElementById('link-url-input');
            if (inp2) inp2.value = this.nodes.get(nid)?.url || '';
            const lmod = document.getElementById('modal-link');
            if (lmod) lmod.dataset.nodeId = nid;
            break;
          }
          case 'addImage': {
            this._showModal('modal-image');
            const inp = document.getElementById('image-url-input');
            if (inp) inp.value = this.nodes.get(nid)?.imageUrl || '';
            const modal = document.getElementById('modal-image');
            if (modal) modal.dataset.nodeId = nid;
            break;
          }
        }
      });
    });

    document.addEventListener('click', () => menu.classList.add('hidden'));
    document.addEventListener('contextmenu', e => {
      if (!e.target.closest('.node-group')) menu.classList.add('hidden');
    });
  }

  _showCtxMenu(id, x, y) {
    this._ctxNodeId = id;
    const menu = document.getElementById('ctx-menu');
    if (!menu) return;
    menu.style.left = Math.min(x, window.innerWidth  - 210) + 'px';
    menu.style.top  = Math.min(y, window.innerHeight - 260) + 'px';
    menu.classList.remove('hidden');
  }

  /* ============================================================
     TOOLBAR SETUP
     ============================================================ */
  _setupToolbar() {
    /* Handle Web vs PWA Toolbar layout */
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (!isPWA) {
      const toolbar = document.getElementById('toolbar');
      const addGroup = document.getElementById('btn-add')?.closest('.toolbar-group');
      if (toolbar && addGroup) {
        const webGroup = document.createElement('div');
        webGroup.className = 'toolbar-group web-options-group';
        
        // Move common options to toolbar
        const optionsToMove = [
          'btn-undo', 'btn-redo', 'btn-import', 'btn-export', 
          'btn-search', 'btn-zoom-in', 'zoom-display', 'btn-zoom-out', 'btn-center', 
          'btn-layout', 'btn-panel-theme', 'btn-panel-outline', 'btn-panel-comment'
        ];

        optionsToMove.forEach(id => {
          const btn = document.getElementById(id);
          if (btn) {
            btn.className = 'toolbar-btn';
            const txt = btn.querySelector('.menu-item-content');
            if (txt) btn.title = txt.textContent.trim().replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ');
            
            if (id === 'zoom-display') {
              btn.style.width = '45px';
              btn.style.fontSize = '12px';
              btn.style.fontWeight = '600';
              btn.style.cursor = 'pointer';
              btn.innerHTML = Math.round(this.zoom * 100) + '%';
            } else {
              const icon = btn.querySelector('.menu-icon');
              if (icon) {
                btn.innerHTML = '';
                btn.appendChild(icon);
              }
            }
            webGroup.appendChild(btn);
          }
        });
        toolbar.insertBefore(webGroup, addGroup);
        
        // Hide empty dividers
        document.querySelectorAll('#hamburger-dropdown .dropdown-divider').forEach(el => el.style.display = 'none');
      }
    }

    /* hamburger dropdown */
    const hamBtn  = document.getElementById('btn-hamburger');
    const hamDrop = document.getElementById('hamburger-dropdown');
    hamBtn?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.toggle('hidden');
    });
    hamDrop?.addEventListener('click', e => {
      const target = e.target.closest('button, input');
      if (target) {
        const id = target.id;
        if (id === 'btn-undo' || id === 'btn-redo' || id === 'btn-zoom-in' || id === 'btn-zoom-out' || id === 'zoom-display') {
          e.stopPropagation();
          return;
        }
      }
      hamDrop.classList.add('hidden');
    });
    document.addEventListener('click', () => hamDrop?.classList.add('hidden'));

    /* export / import */
    document.getElementById('btn-export')?.addEventListener('click', () => this.exportJSON());
    document.getElementById('btn-export-png')?.addEventListener('click', () => this.exportPNG());
    document.getElementById('btn-export-svg')?.addEventListener('click', () => this.exportSVG());
    document.getElementById('btn-import')?.addEventListener('click', () =>
      document.getElementById('import-file-input')?.click());
    document.getElementById('import-file-input')?.addEventListener('change', e => {
      const f = e.target.files[0]; if (f) this._importFile(f);
      e.target.value = '';
    });

    /* undo / redo */
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());

    /* add dropdown */
    const addBtn  = document.getElementById('btn-add');
    const addDrop = document.getElementById('add-dropdown');
    addBtn?.addEventListener('click', e => {
      e.stopPropagation();
      addDrop?.classList.toggle('hidden');
    });
    addDrop?.querySelectorAll('[data-action]').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        addDrop.classList.add('hidden');
        this._handleAddAction(item.dataset.action);
      });
    });
    document.addEventListener('click', () => addDrop?.classList.add('hidden'));

    /* delete / clone */
    document.getElementById('btn-delete')?.addEventListener('click', () => {
      if (this.selected) this.deleteNode(this.selected);
    });
    document.getElementById('btn-clone')?.addEventListener('click', () => {
      if (this.selected) this.cloneNode(this.selected);
    });

    /* search */
    document.getElementById('btn-search')?.addEventListener('click', () => this._toggleSearch());

    /* zoom */
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.zoom = clamp(this.zoom * CFG.ZOOM_BTN, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
      this._updateTransform(); this._updateZoomLabel();
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.zoom = clamp(this.zoom / CFG.ZOOM_BTN, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
      this._updateTransform(); this._updateZoomLabel();
    });
    document.getElementById('zoom-display')?.addEventListener('click', () => this.fitToScreen());

    /* center / layout */
    document.getElementById('btn-center')?.addEventListener('click', () => this.fitToScreen());
    document.getElementById('btn-layout')?.addEventListener('click', () => this._showModal('modal-layout'));

    /* panel toggles */
    document.getElementById('btn-panel-outline')?.addEventListener('click', () => this._togglePanel('outline'));
    document.getElementById('btn-panel-comment')?.addEventListener('click', () => this._togglePanel('comment'));
    document.getElementById('btn-panel-theme')?.addEventListener('click',   () => this._showModal('modal-theme'));
  }

  _handleAddAction(action) {
    switch (action) {
      case 'addChild':    this.addChildNode(this.selected || this.rootId, { diffColor: true }); break;
      case 'addSibling':  if (this.selected && this.selected !== this.rootId) this.addSiblingNode(this.selected); break;
      case 'insertParent':if (this.selected && this.selected !== this.rootId) this.insertParentNode(this.selected); break;
      case 'insertSibling':if (this.selected) this.addSiblingNode(this.selected); break;
      case 'addCentral':  this._newMap(); break;
    }
  }

  _updateZoomLabel() {
    const el = document.getElementById('zoom-display');
    if (el) el.textContent = Math.round(this.zoom * 100) + '%';
  }

  /* ============================================================
     PANELS
     ============================================================ */
  _setupPanels() {
    /* inline edit */
    const inp = document.getElementById('edit-input');
    inp?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this._commitEdit(); }
      else if (e.key === 'Escape') this._cancelEdit();
    });
    inp?.addEventListener('blur', () => this._commitEdit());

    /* comment popover */
    document.getElementById('btn-comment-save')?.addEventListener('click', () => {
      const pop = document.getElementById('comment-popover');
      const ta  = document.getElementById('comment-textarea');
      if (pop && ta) { this.setComment(pop.dataset.nodeId, ta.value); this._hideCommentPopover(); }
    });
    const cancelCmt = () => this._hideCommentPopover();
    document.getElementById('btn-comment-cancel')?.addEventListener('click', cancelCmt);
    document.getElementById('btn-comment-x')?.addEventListener('click', cancelCmt);
    document.addEventListener('click', e => {
      const pop = document.getElementById('comment-popover');
      if (pop && !pop.contains(e.target) && !e.target.closest('.btn-comment'))
        this._hideCommentPopover();
    });

    /* panel close */
    ['btn-close-panel','btn-close-panel-2'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        const rp = document.getElementById('right-panel');
        rp?.classList.remove('panel-open');
        this.panelOpen = false;
        document.querySelectorAll('.panel-toggle').forEach(b => b.classList.remove('active'));
      });
    });
  }

  _togglePanel(name) {
    const rp = document.getElementById('right-panel');
    if (!rp) return;
    if (this.activePanel === name && this.panelOpen) {
      rp.classList.remove('panel-open');
      this.panelOpen = false;
      document.querySelectorAll('.panel-toggle').forEach(b => b.classList.remove('active'));
    } else {
      this.activePanel = name;
      this.panelOpen   = true;
      rp.classList.add('panel-open');
      /* show correct page */
      rp.querySelectorAll('.panel-page').forEach(p => p.classList.add('hidden'));
      document.getElementById(`panel-${name}`)?.classList.remove('hidden');
      /* update toggle buttons */
      document.querySelectorAll('.panel-toggle').forEach(b => b.classList.remove('active'));
      document.getElementById(`btn-panel-${name}`)?.classList.add('active');
      if (name === 'comment') this._renderCommentPanel();
    }
  }

  /* ============================================================
     MODALS
     ============================================================ */
  _setupModals() {
    /* layout grid */
    const lg = document.getElementById('layout-grid');
    if (lg) {
      lg.innerHTML = '';
      LAYOUTS.forEach(lay => {
        const card = document.createElement('div');
        card.className = 'layout-card' + (lay.id === this.layout ? ' lc-active' : '');
        card.innerHTML = `
          <div class="lc-preview">
            <svg viewBox="-75 -32 150 65" xmlns="http://www.w3.org/2000/svg">
              ${LAYOUT_PREVIEWS[lay.id] || ''}
            </svg>
          </div>
          <div class="lc-name">${lay.name}</div>`;
        card.addEventListener('click', () => {
          this._setLayout(lay.id);
          lg.querySelectorAll('.layout-card').forEach(c => c.classList.remove('lc-active'));
          card.classList.add('lc-active');
          this._hideModal('modal-layout');
        });
        lg.appendChild(card);
      });
    }

    /* theme grid */
    const tg = document.getElementById('theme-grid');
    if (tg) {
      tg.innerHTML = '';
      Object.entries(THEMES).forEach(([tid, th]) => {
        const card = document.createElement('div');
        card.className = 'theme-card' + (tid === this.theme ? ' tc-active' : '');
        const swatches = [th.root, ...th.palette.slice(0,5)]
          .map(c => `<span class="tc-swatch" style="background:${c}"></span>`).join('');
        card.innerHTML = `<div class="tc-swatches">${swatches}</div><div class="tc-name">${th.name}</div>`;
        card.addEventListener('click', () => {
          this._setTheme(tid);
          tg.querySelectorAll('.theme-card').forEach(c => c.classList.remove('tc-active'));
          card.classList.add('tc-active');
          this._hideModal('modal-theme');
        });
        tg.appendChild(card);
      });
    }

    /* close buttons */
    document.querySelectorAll('.modal-x[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this._hideModal(btn.dataset.close));
    });
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
    });
  }

  _showModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
  _hideModal(id) { document.getElementById(id)?.classList.add('hidden'); }

  /* ============================================================
     THEME & LAYOUT SWITCH
     ============================================================ */
  _setTheme(tid) {
    if (!THEMES[tid]) return;
    this.theme = tid;
    /* recolor */
    const th   = THEMES[tid];
    const root = this.nodes.get(this.rootId);
    if (root) root.color = th.root;
    const rootCh = root?.children || [];
    this.colorIdx = 0;
    rootCh.forEach((cid, i) => {
      const c = th.palette[i % th.palette.length];
      this._branchColor(cid, c);
      this.colorIdx++;
    });
    this.render();
    this._schedSave();
    this.toast(`Theme: ${th.name}`, 'info');
  }

  _branchColor(id, color) {
    const n = this.nodes.get(id); if (!n) return;
    n.color = color;
    n.children.forEach(c => this._branchColor(c, color));
  }

  _setLayout(lid) {
    if (this.layout === lid) return;
    /* if switching TO freeForm, copy current positions */
    if (lid === 'freeForm') {
      this.nodes.forEach(n => { n.freeX = n.x; n.freeY = n.y; });
    }
    this.layout = lid;
    if (lid === 'horizontal') this._reassignSides();
    this.render();
    this._schedSave();
    this.toast(LAYOUTS.find(l=>l.id===lid)?.name || lid, 'info');
  }

  _reassignSides() {
    const root = this.nodes.get(this.rootId); if (!root) return;
    root.children.forEach((cid, i) => {
      const s = i % 2 === 0 ? 'right' : 'left';
      this.sides.set(cid, s);
      this._inheritSide(cid, s);
    });
  }

  _inheritSide(id, s) {
    const n = this.nodes.get(id); if (!n) return;
    n.children.forEach(c => { this.sides.set(c, s); this._inheritSide(c, s); });
  }

  _newMap() {
    if (!confirm('Create a new mind map? The current map will be cleared.')) return;
    this.nodes.clear(); this.sides.clear();
    this.colorIdx = 0; this.selected = null;
    this.undoStack = []; this.redoStack = [];
    this._updateUndoBtns();
    const c = document.getElementById('canvas-container');
    this.panX = (c?.clientWidth  || 800) / 2;
    this.panY = (c?.clientHeight || 600) / 2;
    this.zoom = 1;
    const rid = this._addNode(null, 'Central Theme');
    this.render();
    this._schedSave();
    this._startEdit(rid);
  }

  /* ============================================================
     SEARCH
     ============================================================ */
  _setupSearch() {
    const bar  = document.getElementById('search-bar');
    const inp  = document.getElementById('search-input');
    inp?.addEventListener('input',   e  => { this.searchQ = e.target.value; this._doSearch(); });
    inp?.addEventListener('keydown', e  => {
      if (e.key === 'Enter') { e.shiftKey ? this._searchNav(-1) : this._searchNav(1); }
      else if (e.key === 'Escape') this._toggleSearch(false);
    });
    document.getElementById('btn-search-prev')?.addEventListener('click', () => this._searchNav(-1));
    document.getElementById('btn-search-next')?.addEventListener('click', () => this._searchNav(1));
    document.getElementById('btn-search-close')?.addEventListener('click', () => this._toggleSearch(false));
  }

  _toggleSearch(force) {
    const bar = document.getElementById('search-bar');
    this.searchOpen = force !== undefined ? force : !this.searchOpen;
    bar?.classList.toggle('hidden', !this.searchOpen);
    if (this.searchOpen) document.getElementById('search-input')?.focus();
    else { this.searchHits = []; this.searchQ = ''; this._renderNodes(); }
  }

  _doSearch() {
    const q = this.searchQ.toLowerCase().trim();
    this.searchHits = []; this.searchIdx = 0;
    const cnt = document.getElementById('search-count');
    if (!q) { if (cnt) cnt.textContent = ''; this._renderNodes(); return; }
    this.nodes.forEach(n => { if (n.label.toLowerCase().includes(q)) this.searchHits.push(n.id); });
    if (cnt) cnt.textContent = `${this.searchHits.length} found`;
    if (this.searchHits.length) { this.selected = this.searchHits[0]; this._centerOn(this.searchHits[0]); }
    this._renderNodes(); this._renderOutline();
  }

  _searchNav(dir) {
    if (!this.searchHits.length) return;
    this.searchIdx = (this.searchIdx + dir + this.searchHits.length) % this.searchHits.length;
    const id = this.searchHits[this.searchIdx];
    this.selected = id; this._centerOn(id);
    this._renderNodes(); this._renderOutline();
  }

  /* ============================================================
     KEYBOARD SHORTCUTS
     ============================================================ */
  _setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (this.isEditing) return;
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
      else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this.redo(); }
      else if (ctrl && e.key === 'f') { e.preventDefault(); this._toggleSearch(); }
      else if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        this.zoom = clamp(this.zoom * CFG.ZOOM_BTN, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
        this._updateTransform(); this._updateZoomLabel();
      }
      else if (ctrl && e.key === '-') {
        e.preventDefault();
        this.zoom = clamp(this.zoom / CFG.ZOOM_BTN, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
        this._updateTransform(); this._updateZoomLabel();
      }
      else if (ctrl && e.key === '0') { e.preventDefault(); this.fitToScreen(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selected && this.selected !== this.rootId) this.deleteNode(this.selected);
      }
      else if (e.key === 'Tab') {
        e.preventDefault();
        this.addChildNode(this.selected || this.rootId, { diffColor: true });
      }
      else if (e.key === 'Enter') {
        if (!this.selected) return;
        if (this.selected === this.rootId) this._startEdit(this.rootId);
        else this.addSiblingNode(this.selected);
      }
      else if (e.key === 'F2') { if (this.selected) this._startEdit(this.selected); }
      else if (e.key === 'Escape') {
        if (this.crossLinkMode) {
          this.crossLinkMode = false; this.crossLinkFrom = null;

          if (banner) banner.style.display = 'none';
        }
        this.selected = null;
        this._renderNodes();
        this._renderOutline();
      }
      /* arrow navigation */
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const n = this.nodes.get(this.selected);
        if (n && n.children.length) { this.selected = n.children[0]; this._centerOn(this.selected); this._renderNodes(); this._renderOutline(); }
      }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const n = this.nodes.get(this.selected);
        if (n?.parentId) { this.selected = n.parentId; this._centerOn(this.selected); this._renderNodes(); this._renderOutline(); }
      }
    });
  }

  /* ============================================================
     UNDO / REDO
     ============================================================ */
  _pushUndo() {
    const snap = this._snap();
    this.undoStack.push(snap);
    if (this.undoStack.length > CFG.MAX_UNDO) this.undoStack.shift();
    this.redoStack = [];
    this._updateUndoBtns();
  }

  _snap() {
    const nodes = {};
    this.nodes.forEach((n, id) => nodes[id] = { ...n, children: [...n.children] });
    return {
      nodes,
      rootId:    this.rootId,
      selected:  this.selected,
      colorIdx:  this.colorIdx,
      sides:     Object.fromEntries(this.sides),
      crossLinks:[...this.crossLinks],
    };
  }

  _restore(snap) {
    this.nodes.clear();
    Object.entries(snap.nodes).forEach(([id, n]) =>
      this.nodes.set(id, { ...n, children: [...n.children] }));
    this.rootId     = snap.rootId;
    this.selected   = snap.selected;
    this.colorIdx   = snap.colorIdx || 0;
    this.sides      = new Map(Object.entries(snap.sides || {}));
    this.crossLinks = snap.crossLinks ? [...snap.crossLinks] : [];
  }

  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this._snap());
    this._restore(this.undoStack.pop());
    this.render();
    this._updateUndoBtns();
    this.toast('Undo', 'info');
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this._snap());
    this._restore(this.redoStack.pop());
    this.render();
    this._updateUndoBtns();
    this.toast('Redo', 'info');
  }

  _updateUndoBtns() {
    const u = document.getElementById('btn-undo');
    const r = document.getElementById('btn-redo');
    if (u) u.style.opacity = this.undoStack.length ? '1' : '0.35';
    if (r) r.style.opacity = this.redoStack.length ? '1' : '0.35';
  }

  /* ============================================================
     PERSISTENCE — IndexedDB
     ============================================================ */

  /* Mark unsaved so indicator updates */
  _markDirty() {
    this._setSaveState('saving');
    this._schedSave();
  }

  _setSaveState(state) {
    const ind  = document.getElementById('save-indicator');
    if (!ind) return;
    const ok   = ind.querySelector('.si-ok');
    const spin = ind.querySelector('.si-saving');
    const txt  = ind.querySelector('.si-text');
    ind.className = `save-indicator save-${state}`;
    if (state === 'saving') {
      if (ok)   ok.style.display   = 'none';
      if (spin) spin.style.display = 'block';
      if (txt)  txt.textContent    = 'Saving…';
    } else if (state === 'ok') {
      if (ok)   ok.style.display   = 'block';
      if (spin) spin.style.display = 'none';
      if (txt)  txt.textContent    = 'Saved';
    } else {
      if (ok)   ok.style.display   = 'none';
      if (spin) spin.style.display = 'none';
      if (txt)  txt.textContent    = 'Error';
    }
  }

  _schedSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this._saveDB(), 700);
  }

  _buildPayload() {
    const nameEl = document.getElementById('map-name-input');
    return {
      id:       this.currentMapId || undefined,
      name:     nameEl?.value.trim() || 'Untitled Map',
      nodes:    Object.fromEntries(this.nodes),
      rootId:   this.rootId,
      colorIdx: this.colorIdx,
      sides:    Object.fromEntries(this.sides),
      theme:    this.theme,
      layout:   this.layout,
      zoom:     this.zoom,
      panX:     this.panX,
      panY:     this.panY,
      updatedAt: new Date().toISOString(),
      createdAt: this._createdAt || new Date().toISOString(),
      v: 3,
    };
  }

  async _saveDB() {
    if (!this._db) { this._fallbackSave(); return; }
    try {
      const payload = this._buildPayload();
      const newId   = await this._db.save(payload);
      if (!this.currentMapId) this.currentMapId = newId;
      this._setSaveState('ok');
    } catch(e) {
      console.warn('DB save failed', e);
      this._fallbackSave();
      this._setSaveState('err');
    }
  }

  _fallbackSave() {
    try {
      localStorage.setItem('mindmap-v2-fallback', JSON.stringify(this._buildPayload()));
    } catch(e) {}
  }

  async _loadLastMap() {
    if (!this._db) return this._fallbackLoad();
    try {
      const all = await this._db.getAll();
      if (!all.length) return this._fallbackLoad();
      /* sort by most recently updated */
      all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      this._applyMapData(all[0]);
      return true;
    } catch(e) { return this._fallbackLoad(); }
  }

  _fallbackLoad() {
    /* try old localStorage keys */
    const keys = ['mindmap-v2-fallback', 'mindmap-v2'];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const d = JSON.parse(raw);
        if (d.nodes && d.rootId) { this._applyMapData(d); return true; }
      } catch(e) {}
    }
    return false;
  }

  _applyMapData(d) {
    this.nodes.clear();
    Object.entries(d.nodes || {}).forEach(([id, n]) =>
      this.nodes.set(id, { ...n, children: n.children || [] }));
    this.rootId      = d.rootId;
    this.colorIdx    = d.colorIdx || 0;
    this.sides       = new Map(Object.entries(d.sides || {}));
    this.crossLinks  = d.crossLinks || [];
    if (d.theme  && THEMES[d.theme])  this.theme  = d.theme;
    if (d.layout) this.layout = d.layout;
    this.zoom        = d.zoom  || 1;
    this.panX        = d.panX  || 0;
    this.panY        = d.panY  || 0;
    this.currentMapId   = d.id        || null;
    this._createdAt     = d.createdAt || new Date().toISOString();
    /* update map name in toolbar */
    const ni = document.getElementById('map-name-input');
    if (ni) ni.value = d.name || 'Untitled Map';
  }

  _buildPayload() {
    const ni = document.getElementById('map-name-input');
    const name = ni?.value.trim() || 'Untitled Map';
    return {
      nodes:     Object.fromEntries(this.nodes),
      rootId:    this.rootId,
      colorIdx:  this.colorIdx,
      sides:     Object.fromEntries(this.sides),
      crossLinks:this.crossLinks,
      theme:     this.theme,
      layout:    this.layout,
      zoom:      this.zoom,
      panX:      this.panX,
      panY:      this.panY,
      name:      name,
      updatedAt: new Date().toISOString(),
      createdAt: this._createdAt || new Date().toISOString()
    };
  }

  /* ---- Maps Modal ---- */
  async _openMapsModal() {
    this._showModal('modal-maps');
    await this._renderMapsGrid();
  }

  async _renderMapsGrid() {
    const grid  = document.getElementById('maps-grid');
    const empty = document.getElementById('maps-empty');
    if (!grid) return;

    let all = [];
    if (this._db) {
      try { all = await this._db.getAll(); } catch(e) {}
    }
    all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    grid.innerHTML = '';
    if (!all.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    all.forEach(map => {
      const isActive = map.id === this.currentMapId;
      const card     = document.createElement('div');
      card.className = 'map-card' + (isActive ? ' mc-active' : '');

      /* mini thumb — just show root label */
      const rootNode = map.nodes?.[map.rootId];
      const rootLabel = rootNode?.label || map.name || 'Map';
      const rootColor = rootNode?.color || '#4DD0E1';
      const updated   = map.updatedAt
        ? new Date(map.updatedAt).toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
        : 'Unknown';
      const nodeCount = Object.keys(map.nodes || {}).length;

      card.innerHTML = `
        <div class="mc-thumb" style="background:${rootColor}22">
          <div class="mc-thumb-label" style="color:${rootColor}44">${rootLabel.substring(0,2).toUpperCase()}</div>
          ${isActive ? '<span class="mc-active-badge">Active</span>' : ''}
          <svg viewBox="-50 -25 100 50" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.55">
            <ellipse cx="0" cy="0" rx="22" ry="12" fill="${rootColor}"/>
            ${(map.nodes?.[map.rootId]?.children || []).slice(0,5).map((cid,i) => {
              const ch  = map.nodes?.[cid];
              const ang = (i / 5) * Math.PI * 2 - Math.PI/2;
              const cx  = Math.cos(ang) * 36;
              const cy  = Math.sin(ang) * 18;
              return ch ? `
                <line x1="0" y1="0" x2="${cx}" y2="${cy}" stroke="${ch.color||'#aaa'}" stroke-width="1.5" opacity="0.7"/>
                <ellipse cx="${cx}" cy="${cy}" rx="12" ry="7" fill="${ch.color||'#aaa'}33" stroke="${ch.color||'#aaa'}" stroke-width="1.2"/>
              ` : '';
            }).join('')}
          </svg>
        </div>
        <div class="mc-body">
          <div class="mc-name">${map.name || 'Untitled Map'}</div>
          <div class="mc-meta">
            <span>📄 ${nodeCount} node${nodeCount !== 1 ? 's' : ''}</span>
            <span>· ${updated}</span>
          </div>
        </div>
        <div class="mc-actions">
          <button class="mc-btn mc-btn-open" data-id="${map.id}">Open</button>
          ${!isActive ? `<button class="mc-btn mc-btn-delete" data-del="${map.id}">Delete</button>` : ''}
        </div>`;

      /* open */
      card.querySelector('.mc-btn-open')?.addEventListener('click', async e => {
        e.stopPropagation();
        await this._openMap(map.id);
        this._hideModal('modal-maps');
      });

      /* delete */
      card.querySelector('.mc-btn-delete')?.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm(`Delete "${map.name || 'this map'}"? This cannot be undone.`)) return;
        await this._deleteMap(map.id);
        await this._renderMapsGrid();
      });

      grid.appendChild(card);
    });
  }

  async _openMap(id) {
    /* save current map first */
    await this._saveDB();
    if (!this._db) return;
    try {
      const map = await this._db.get(id);
      if (!map) return;
      this.undoStack = []; this.redoStack = [];
      this._updateUndoBtns();
      this._applyMapData(map);
      this.render();
      this.fitToScreen();
      this._setSaveState('ok');
    } catch(e) { this.toast('Could not open map', 'error'); }
  }

  async _deleteMap(id) {
    if (!this._db) return;
    try { await this._db.delete(id); } catch(e) {}
  }

  async _createNewMap() {
    /* save current */
    await this._saveDB();
    this.nodes.clear(); this.sides.clear();
    this.colorIdx = 0; this.selected = null;
    this.undoStack = []; this.redoStack = [];
    this.currentMapId = null;
    this._createdAt   = new Date().toISOString();
    this._updateUndoBtns();
    const c = document.getElementById('canvas-container');
    this.panX = (c?.clientWidth  || 800) / 2;
    this.panY = (c?.clientHeight || 600) / 2;
    this.zoom = 1;
    const ni = document.getElementById('map-name-input');
    if (ni) ni.value = 'Untitled Map';
    const rid = this._addNode(null, 'Central Theme');
    this.render();
    this._startEdit(rid);
    this._setSaveState('saving');
    this._schedSave();
  }

  exportJSON() {
    const nameEl = document.getElementById('map-name-input');
    const name   = nameEl?.value.trim() || 'mindmap';
    const data = {
      nodes:    Object.fromEntries(this.nodes),
      rootId:   this.rootId,
      colorIdx: this.colorIdx,
      sides:    Object.fromEntries(this.sides),
      theme:    this.theme,
      layout:   this.layout,
      name,
      exportedAt: new Date().toISOString(),
      v: 3,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${name.replace(/\s+/g,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('Exported!', 'success');
  }

  exportSVG() {
    const nameEl = document.getElementById('map-name-input');
    const name   = nameEl?.value.trim() || 'mindmap';
    const svgEl  = document.getElementById('canvas');
    if (!svgEl) return;
    /* Clone SVG and embed current dimensions */
    const clone = svgEl.cloneNode(true);
    const bbox  = svgEl.getBBox ? svgEl.getBBox() : null;
    /* remove hover-only elements */
    clone.querySelectorAll('.node-hover-bridge, .node-actions').forEach(el => el.remove());
    /* Add background */
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#12121a');
    clone.insertBefore(bg, clone.firstChild);
    const serializer = new XMLSerializer();
    const svgStr     = serializer.serializeToString(clone);
    const blob       = new Blob([svgStr], { type: 'image/svg+xml' });
    const url        = URL.createObjectURL(blob);
    const a          = document.createElement('a');
    a.href = url; a.download = `${name.replace(/\s+/g,'-').toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('SVG exported!', 'success');
  }

  exportPNG() {
    const nameEl = document.getElementById('map-name-input');
    const name   = nameEl?.value.trim() || 'mindmap';
    const svgEl  = document.getElementById('canvas');
    if (!svgEl) return;
    this.toast('Preparing PNG…', 'info');

    /* Get bounds of all nodes */
    let minX=1e9, minY=1e9, maxX=-1e9, maxY=-1e9;
    this.nodes.forEach(n => {
      minX = Math.min(minX, n.x - n.w/2); maxX = Math.max(maxX, n.x + n.w/2);
      minY = Math.min(minY, n.y - n.h/2); maxY = Math.max(maxY, n.y + n.h/2);
    });
    const pad = 60;
    const cw  = (maxX - minX) + pad * 2;
    const ch  = (maxY - minY) + pad * 2;

    /* Clone + reset transform to fit content */
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('width',  cw);
    clone.setAttribute('height', ch);
    clone.querySelector('#canvas-root')?.setAttribute('transform',
      `translate(${-minX + pad}, ${-minY + pad})`);
    clone.querySelectorAll('.node-hover-bridge, .node-actions, .node-collapse-btn').forEach(el => el.remove());

    /* Dark background */
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', cw); bg.setAttribute('height', ch);
    bg.setAttribute('fill', '#12121a');
    clone.insertBefore(bg, clone.firstChild);

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale  = 2; /* 2x for retina quality */
      canvas.width  = cw * scale;
      canvas.height = ch * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `${name.replace(/\s+/g,'-').toLowerCase()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      this.toast('PNG exported!', 'success');
    };
    img.onerror = () => { URL.revokeObjectURL(url); this.toast('PNG export failed', 'error'); };
    img.src = url;
  }

  setNodeImage(id, url) {
    const node = this.nodes.get(id);
    if (!node) return;
    this._pushUndo();
    node.imageUrl = url || null;
    const d = this._nodeDims(node);
    node.w = d.w; node.h = d.h;
    this._applyLayout();
    this.render();
    this._schedSave();
    this.toast(url ? 'Image added!' : 'Image removed', 'success');
  }

  setNodeUrl(id, url) {
    const node = this.nodes.get(id);
    if (!node) return;
    this._pushUndo();
    node.url = url || null;
    const d = this._nodeDims(node);
    node.w = d.w; node.h = d.h;
    this._applyLayout();
    this.render();
    this._schedSave();
    this.toast(url ? 'Link added! Click ↗ to open' : 'Link removed', 'success');
  }

  _importFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try { this._importJSON(JSON.parse(e.target.result)); }
      catch { this.toast('Invalid JSON file', 'error'); }
    };
    reader.readAsText(file);
  }

  _importJSON(data) {
    if (!data.nodes || !data.rootId) { this.toast('Invalid mind map file', 'error'); return; }
    this._pushUndo();
    this.currentMapId = null; /* treat as new map after import */
    this._createdAt   = new Date().toISOString();
    this.nodes.clear();
    Object.entries(data.nodes).forEach(([id, n]) =>
      this.nodes.set(id, { ...n, children: n.children || [] }));
    this.rootId   = data.rootId;
    this.colorIdx = data.colorIdx || 0;
    this.sides    = new Map(Object.entries(data.sides || {}));
    if (data.theme  && THEMES[data.theme])  this.theme  = data.theme;
    if (data.layout) this.layout = data.layout;
    const ni = document.getElementById('map-name-input');
    if (ni) ni.value = data.name || 'Imported Map';
    this.render();
    this.fitToScreen();
    this._markDirty();
    this.toast('Imported!', 'success');
  }

  /* ============================================================
     TOAST
     ============================================================ */
  toast(msg, type='info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast-show'));
    setTimeout(() => {
      t.classList.remove('toast-show');
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }
}

/* ============================================================
   GOOGLE DRIVE MANAGER
   ============================================================ */
class GoogleDriveManager {
  constructor(app) {
    this.app = app;
    this.clientId = '86489755421-e7utfmuof73lmb8cc2k6isf1dmoe1mdn.apps.googleusercontent.com';
    this.scopes = 'https://www.googleapis.com/auth/drive.file';
    this.tokenClient = null;
    this.accessToken = null;
    this.gapiInited = false;
    
    /* Initialize GIS (Google Identity Services) for auth token */
    if (window.google?.accounts?.oauth2) {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scopes,
        callback: (response) => {
          if (response.error !== undefined) {
            this.app.toast('Google Auth Error', 'error');
            return;
          }
          this.accessToken = response.access_token;
          if (this._pendingAction) {
            this._pendingAction();
            this._pendingAction = null;
          }
        },
      });
    }

    /* Initialize GAPI for Picker and Drive API */
    if (window.gapi) {
      gapi.load('client:picker', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          this.gapiInited = true;
        } catch(e) { console.error('GAPI Init error', e); }
      });
    }
  }

  _requireAuth(action) {
    if (!this.tokenClient) {
      if (window.google?.accounts?.oauth2) {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: this.scopes,
          callback: (response) => {
            if (response.error !== undefined) {
              this.app.toast('Google Auth Error', 'error');
              return;
            }
            this.accessToken = response.access_token;
            if (this._pendingAction) {
              this._pendingAction();
              this._pendingAction = null;
            }
          },
        });
      } else {
        this.app.toast('Google scripts not loaded', 'error');
        return;
      }
    }

    if (this.accessToken) {
      action();
    } else {
      this._pendingAction = action;
      this.tokenClient.requestAccessToken({prompt: ''});
    }
  }

  saveToDrive(payload) {
    this._requireAuth(async () => {
      this.app.toast('Saving to Google Drive...', 'info');
      try {
        const fileContent = JSON.stringify(payload, null, 2);
        const file = new Blob([fileContent], {type: 'application/json'});
        const name = (payload.name || 'Untitled Map') + '.json';
        const metadata = { name, mimeType: 'application/json' };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + this.accessToken },
          body: form,
        });
        
        if (res.ok) {
          this.app.toast('Saved to Google Drive!', 'success');
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        console.error(err);
        this.app.toast('Error saving to Drive', 'error');
      }
    });
  }

  openFromDrive() {
    this._requireAuth(() => {
      if (!this.gapiInited) {
        this.app.toast('Google API loading, try again', 'warn');
        return;
      }
      const view = new google.picker.View(google.picker.ViewId.DOCS);
      view.setMimeTypes('application/json');
      
      const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setAppId(this.clientId.split('-')[0])
        .setOAuthToken(this.accessToken)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setCallback(async (data) => {
          if (data.action === google.picker.Action.PICKED) {
            try {
              const fileId = data.docs[0].id;
              const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: 'Bearer ' + this.accessToken }
              });
              if (!res.ok) throw new Error('Download failed');
              const mapData = await res.json();
              this.app._importJSON(mapData);
            } catch (err) {
              console.error(err);
              this.app.toast('Failed to load file from Drive', 'error');
            }
          }
        })
        .build();
      picker.setVisible(true);
    });
  }
}

/* ============================================================
   INDEXEDDB MANAGER
   ============================================================ */
class DBManager {
  constructor() {
    this.db        = null;
    this.DB_NAME   = 'MindMapDB';
    this.DB_VER    = 1;
    this.STORE     = 'maps';
  }

  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VER);
      req.onupgradeneeded = e => {
        const db  = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          const st = db.createObjectStore(this.STORE, { keyPath:'id', autoIncrement:true });
          st.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
      req.onsuccess = e => { this.db = e.target.result; resolve(this.db); };
      req.onerror   = e => reject(e.target.error);
    });
  }

  save(payload) {
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(this.STORE, 'readwrite');
      const st  = tx.objectStore(this.STORE);
      /* put uses keyPath id; if undefined, auto-increments (new record) */
      const req = payload.id ? st.put(payload) : st.add(payload);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).getAll();
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  get(id) {
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).get(id);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(this.STORE, 'readwrite');
      const req = tx.objectStore(this.STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = e => reject(e.target.error);
    });
  }
}


















































































































































