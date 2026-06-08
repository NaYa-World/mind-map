// @ts-nocheck
import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from './utils.js';

export const HistoryMixin = class {
undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this._snap());
    this._restore(this.undoStack.pop());
    this.render();
    this._updateUndoBtns();
    this._schedSave();
    this.toast('Undo', 'info');
  }

redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this._snap());
    this._restore(this.redoStack.pop());
    this.render();
    this._updateUndoBtns();
    this._schedSave();
    this.toast('Redo', 'info');
  }

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

_buildPayload() {
    const ni = document.getElementById('map-name-input');
    const name = ni?.value.trim() || 'Welcome to MindMap';
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
}.prototype;
