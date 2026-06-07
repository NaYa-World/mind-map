import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from './utils.js';

export const CrudMixin = class {
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

deleteNode(id) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
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

setNodeUrl(id, url) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
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
}.prototype;
