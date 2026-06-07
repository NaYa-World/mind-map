import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from '../core/utils.js';
import { decryptPayload } from '../core/crypto.js';

export const ModalsMixin = class {
_setupModals() {
    /* layout grid */
    const lg = document.getElementById('layout-grid');
    if (lg) {
      lg.innerHTML = '';
      LAYOUTS.forEach(lay => {
        const card = document.createElement('div');
        card.className = 'layout-card' + (lay.id === this.layout ? ' lc-active' : '');
        const premiumLayouts = ['freeForm', 'radial', 'matrix'];
        const isPremiumItem = premiumLayouts.includes(lay.id);
        const needsUpgrade = isPremiumItem && (!this.isPremium || !this.isPremium());
        
        card.innerHTML = `
          <div class="lc-preview">
            <svg viewBox="-75 -32 150 65" xmlns="http://www.w3.org/2000/svg">
              ${LAYOUT_PREVIEWS[lay.id] || ''}
            </svg>
          </div>
          <div class="lc-name">${lay.name}</div>
          ${needsUpgrade ? '<div class="premium-mask">✨ Premium</div>' : ''}
        `;
        card.addEventListener('click', () => {
          const premiumLayouts = ['freeForm', 'radial', 'matrix'];
          if (premiumLayouts.includes(lay.id) && !this.requirePremium()) return;

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
        const premiumThemes = ['blueSteel', 'spring', 'pastel', 'bw'];
        const isPremiumItem = premiumThemes.includes(tid);
        const needsUpgrade = isPremiumItem && (!this.isPremium || !this.isPremium());

        const swatches = [th.root, ...th.palette.slice(0,5)]
          .map(c => `<span class="tc-swatch" style="background:${c}"></span>`).join('');
        card.innerHTML = `
          <div class="tc-swatches">${swatches}</div>
          <div class="tc-name">${th.name}</div>
          ${needsUpgrade ? '<div class="premium-mask">✨ Premium</div>' : ''}
        `;
        card.addEventListener('click', () => {
          const premiumThemes = ['blueSteel', 'spring', 'pastel', 'bw'];
          if (premiumThemes.includes(tid) && !this.requirePremium()) return;

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
      
      row.onclick = () => { this.selected = id; this._centerOn(id); this._renderNodes(); this._renderOutline(); };
      tree.appendChild(row);
      
      if (!n.collapsed) n.children.forEach(c => rec(c, depth + 1));
    };
    rec(this.rootId, 0);
  }

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

addChildNode(parentId, opts={}) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return null;
    }
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
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return null;
    }
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
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
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

renameNode(id, label) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
    const node = this.nodes.get(id);
    if (!node || node.label === label) return;
    this._pushUndo();
    node.label = label;
    const d = this._nodeDims(node);
    node.w = d.w; node.h = d.h;
    this.render();
    this._schedSave();
  }

setComment(id, text) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
    const node = this.nodes.get(id);
    if (!node) return;
    node.comment = text.trim();
    this.render();
    this._renderCommentPanel();
    this._schedSave();
  }

cloneNode(id) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
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

_visChildren(id) {
    const n = this.nodes.get(id);
    if (!n || n.collapsed) return [];
    return n.children.filter(c => this.nodes.has(c));
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

_updateTransform() {
    const g = document.getElementById('canvas-root');
    if (g) g.setAttribute('transform', `translate(${this.panX},${this.panY}) scale(${this.zoom})`);
  }

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
      const g = this._renderNode(n);
      if (g) g.style.display = visibleIds.has(n.id) ? '' : 'none';
    });
  }

_startDrag(e, id) {
    if (this.isLocked) return;
    const n = this.nodes.get(id);
    if (!n) return;
    this.isDragging = true;
    this.dragId  = id;
    this.dragSX  = e.clientX;
    this.dragSY  = e.clientY;
    
    // Collect subtree and record initial positions
    this.dragSubtree = new Set();
    const collect = (currId) => {
      this.dragSubtree.add(currId);
      const currNode = this.nodes.get(currId);
      if (currNode) {
        currNode._dragStartX = currNode.x;
        currNode._dragStartY = currNode.y;
        (currNode.children || []).forEach(collect);
      }
    };
    collect(id);

    this._dropTargetId = null;
  }

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

  _reparentNode(dragId, newParentId) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
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

  _startEdit(id) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
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

_showCtxMenu(id, x, y) {
    this._ctxNodeId = id;
    const menu = document.getElementById('ctx-menu');
    if (!menu) return;
    menu.style.left = Math.min(x, window.innerWidth  - 210) + 'px';
    menu.style.top  = Math.min(y, window.innerHeight - 260) + 'px';
    menu.classList.remove('hidden');
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

  _renderCommentPanel() {
    const cl = document.getElementById('comment-list');
    if (!cl) return;
    cl.innerHTML = '';
    const comments = [];
    this.nodes.forEach(n => {
      if (n.comment && n.comment.trim() !== '') {
        comments.push({ id: n.id, label: n.label || 'Node', text: n.comment });
      }
    });

    if (comments.length === 0) {
      cl.innerHTML = '<p class="panel-empty">Click <strong>T</strong> on any node to add a comment.</p>';
      return;
    }

    comments.forEach(c => {
      const el = document.createElement('div');
      el.className = 'outline-item';
      el.innerHTML = `<strong>${c.label}</strong><br/><span style="font-size:0.9em;color:var(--text2);">${c.text}</span>`;
      el.addEventListener('click', () => {
        const target = this.nodes.get(c.id);
        if (target) {
          this.selected = target;
          this._centerOn(target);
          this._renderNodes();
          this._renderOutline();
        }
      });
      cl.appendChild(el);
    });
  }

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
    this.toast(`Style: ${th.name}`, 'info');
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
    this._confirm('Create a new mind map? The current map will be cleared.').then(ok => {
      if (!ok) return;
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
    });
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

_updateUndoBtns() {
    const u = document.getElementById('btn-undo');
    const r = document.getElementById('btn-redo');
    if (u) { u.style.opacity = this.undoStack.length ? '1' : '0.35'; u.disabled = !this.undoStack.length; }
    if (r) { r.style.opacity = this.redoStack.length ? '1' : '0.35'; r.disabled = !this.redoStack.length; }
  }

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

_fallbackSave() {
    try {
      localStorage.setItem('mindmap-v2-fallback', JSON.stringify(this._buildPayload()));
    } catch(e) {
      this.toast('Could not save — storage may be full', 'error');
    }
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

exportSVG() {
    if (!this.requirePremium()) return;
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

_importFile(file) {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        let parsed = JSON.parse(e.target.result);
        if (parsed && parsed.encrypted) {
          parsed = await decryptPayload(parsed);
        }
        this._importJSON(parsed);
      } catch (err) {
        console.error('Import failed:', err);
        this.toast('Invalid mind map or decryption failed', 'error');
      }
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

toast(msg, type='info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast-show'));
    const durations = { error: 4000, warn: 3000, success: 2000, info: 2200 };
    const delay = durations[type] || 2200;
    setTimeout(() => {
      t.classList.remove('toast-show');
      setTimeout(() => t.remove(), 300);
    }, delay);
  }

_confirm(message) {
    return new Promise(resolve => {
      const modal = document.getElementById('modal-confirm');
      const msgEl = document.getElementById('confirm-message');
      const okBtn  = document.getElementById('confirm-ok');
      const cancelBtn = document.getElementById('confirm-cancel');
      if (!modal || !okBtn || !cancelBtn) {
        /* fallback if modal not in DOM */
        resolve(window.confirm(message));
        return;
      }
      if (msgEl) msgEl.textContent = message;
      modal.classList.remove('hidden');
      const cleanup = (result) => {
        modal.classList.add('hidden');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      };
      const onOk     = () => cleanup(true);
      const onCancel = () => cleanup(false);
      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  }
}.prototype;
