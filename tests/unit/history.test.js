/**
 * @jest-environment jsdom
 */

// We don't import the full app.js because it executes `window.app = new MindMapApp()`
// and expects the DOM to exist. 
// Instead we just mock what we need to test the logic of Undo/Redo.

import { HistoryMixin } from '../../src/core/history.ts';

class MockMindMap {
  constructor() {
    this.nodes = new Map();
    this.rootId = 'root';
    this.undoStack = [];
    this.redoStack = [];
    this.theme = 'spring';
    this.layout = 'horizontal';
    this.sides = new Map();
    this.crossLinks = [];
    this.colorIdx = 0;
    this.selected = null;
    
    // Mixin methods
    Object.getOwnPropertyNames(HistoryMixin).forEach(name => {
      if (name !== 'constructor') {
        this[name] = HistoryMixin[name].bind(this);
      }
    });
  }

  // Mock methods used by history
  _snap() {
    return {
      nodes: Array.from(this.nodes.entries()),
      rootId: this.rootId,
      theme: this.theme,
      layout: this.layout
    };
  }

  _restore(snap) {
    this.nodes = new Map(snap.nodes);
    this.rootId = snap.rootId;
    this.theme = snap.theme;
    this.layout = snap.layout;
  }
  _updateUndoBtns() {}
  toast() {}
  _buildPayload() {
    return this._snap();
  }

  _applyPayload(payload) {
    this._restore(payload);
  }

  _renderOutline() {}
  render() {}
  _saveDB() {}
  _schedSave() {}
}

describe('History (Undo/Redo)', () => {
  let app;

  beforeEach(() => {
    app = new MockMindMap();
    app.nodes.set('root', { id: 'root', label: 'Root Node', children: [] });
  });

  test('Pushing to undo stack saves state', () => {
    app._pushUndo();
    expect(app.undoStack.length).toBe(1);
    expect(app.undoStack[0].rootId).toBe('root');
  });

  test('Undo restores previous state', () => {
    app._pushUndo(); // saves "Root Node"
    
    // mutate state
    app.nodes.set('root', { id: 'root', label: 'Changed', children: [] });
    app._pushUndo(); // saves "Changed"
    
    app.nodes.set('root', { id: 'root', label: 'Changed Again', children: [] });
    
    app.undo();
    expect(app.nodes.get('root').label).toBe('Changed');
    
    app.undo();
    expect(app.nodes.get('root').label).toBe('Root Node');
  });

  test('Redo restores undone state', () => {
    app._pushUndo();
    app.nodes.set('root', { id: 'root', label: 'Changed', children: [] });
    
    app.undo(); // back to Root Node
    expect(app.nodes.get('root').label).toBe('Root Node');
    
    app.redo(); // forward to Changed
    expect(app.nodes.get('root').label).toBe('Changed');
  });
});
