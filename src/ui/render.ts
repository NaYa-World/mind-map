// @ts-nocheck
import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from '../core/utils.js';

export const RenderMixin = class {
_setupMeasurer() {
    /* Cache mobile detection once at startup */
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
    const extraH = lines.length > 1 ? (lines.length - 1) * 16 : 0; // assuming line height 16
    const imgH   = node.imageUrl ? 80 : 0;
    return { w, h: baseH + extraH + imgH, lines };
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

    const isMobile = this.isMobile;

    /* body */
    const body = g.querySelector('.node-body');
    body.setAttribute('x', x); body.setAttribute('y', y);
    body.setAttribute('width', node.w); body.setAttribute('height', node.h);
    body.setAttribute('rx', rx); body.setAttribute('ry', rx);
    body.setAttribute('fill', isRoot ? node.color : '#1c1c28');
    body.setAttribute('filter', (isRoot && !isMobile) ? 'url(#f-shadow)' : 'none');

    /* border */
    const border = g.querySelector('.node-border');
    border.setAttribute('x', x); border.setAttribute('y', y);
    border.setAttribute('width', node.w); border.setAttribute('height', node.h);
    border.setAttribute('rx', rx); border.setAttribute('ry', rx);
    border.setAttribute('fill', 'none');
    if (isSel) {
      border.setAttribute('stroke', '#fff');
      border.setAttribute('stroke-width', '2.5');
      if (!isMobile) border.setAttribute('filter', 'url(#f-selected)');
    } else {
      border.setAttribute('stroke', isRoot ? 'none' : node.color);
      border.setAttribute('stroke-width', '2');
      border.removeAttribute('filter');
    }

    /* label — multi-line with tspan wrapping (reuse already-computed dim) */
    const lbl = g.querySelector('.node-label');
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('fill', isRoot ? '#0a0a0f' : '#eeeef5');
    lbl.setAttribute('font-size', isRoot ? 17 : 14);
    lbl.setAttribute('font-weight', isRoot ? 700 : 500);
    lbl.setAttribute('font-family', 'Inter, sans-serif');
    lbl.setAttribute('pointer-events', 'none');
    /* Rebuild tspan lines */
    while (lbl.firstChild) lbl.removeChild(lbl.firstChild);
    const lines  = dim.lines || [node.label];
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
    return g;
  }

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

    /* Draw drop indicator rubber band */
    if (this.isDragging && this._dropTargetId && this.dragId) {
      const targetNode = this.nodes.get(this._dropTargetId);
      const dragNode = this.nodes.get(this.dragId);
      if (targetNode && dragNode) {
        const edge = this._makeEdge(targetNode, dragNode);
        edge.setAttribute('stroke-dasharray', '5,5');
        edge.setAttribute('stroke', '#FFD700');
        edge.setAttribute('stroke-width', '3');
        edge.setAttribute('opacity', '0.7');
        layer.appendChild(edge);
      }
    }
  }

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

render() {
    this._applyLayout();
    this._renderEdges();
    this._renderCrossLinks();
    this._renderNodes();
    this._renderOutline();
    this._updateTransform();
  }
}.prototype;
