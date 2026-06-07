import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from './utils.js';

export const LayoutMixin = class {
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

_subH(id, vg = CFG.V_GAP + 14) {
    const n = this.nodes.get(id);
    if (!n) return CFG.NODE_H + 8;
    const ch = this._visChildren(id);
    if (ch.length === 0) return (n.h || CFG.NODE_H) + 8;
    const tot = ch.reduce((s,c) => s + this._subH(c, vg), 0) + vg * (ch.length - 1);
    return Math.max((n.h || CFG.NODE_H) + 8, tot);
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
}.prototype;
