import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from './utils.js';
import { encryptPayload } from './crypto.js';

export const StorageMixin = class {
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

  async exportJSON() {
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
    try {
      const encryptedData = await encryptPayload(JSON.stringify(data));
      const fileContent = JSON.stringify(encryptedData, null, 2);
      const filename = `${name.replace(/\s+/g,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;

      const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
      if (isNative) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const res = await Filesystem.writeFile({
          path: filename,
          data: fileContent,
          directory: Directory.Cache,
          encoding: 'utf8',
        });

        await Share.share({
          title: 'Export Mind Map',
          url: res.uri,
        });
        this.toast('Exported securely via Share!', 'success');
      } else {
        const blob = new Blob([fileContent], { type:'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Exported securely!', 'success');
      }
    } catch (err) {
      console.error('Export encryption failed:', err);
      this.toast('Secure export failed', 'error');
    }
  }

  exportSVG() {
    if (!this.requirePremium()) return;
    const nameEl = document.getElementById('map-name-input');
    const name   = nameEl?.value.trim() || 'mindmap';
    const svgEl  = document.getElementById('canvas');
    if (!svgEl) return;

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
    clone.querySelector('#canvas-root')?.setAttribute('transform', `translate(${-minX + pad}, ${-minY + pad})`);
    clone.querySelectorAll('.node-hover-bridge, .node-actions, .node-collapse-btn').forEach(el => el.remove());

    /* Dark background */
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', cw); bg.setAttribute('height', ch);
    bg.setAttribute('fill', '#12121a');
    clone.insertBefore(bg, clone.firstChild);

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const filename = `${name.replace(/\s+/g, '-').toLowerCase()}.svg`;

    const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
    if (isNative) {
      (async () => {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');

          const res = await Filesystem.writeFile({
            path: filename,
            data: svgStr,
            directory: Directory.Cache,
            encoding: 'utf8',
          });

          await Share.share({
            title: 'Export SVG',
            url: res.uri,
          });
          this.toast('SVG exported via Share!', 'success');
        } catch (err) {
          console.error('SVG export sharing failed:', err);
          this.toast('SVG export failed', 'error');
        }
      })();
    } else {
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      this.toast('SVG exported!', 'success');
    }
  }

  exportPNG() {
    if (!this.requirePremium()) return;
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

      const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
      if (isNative) {
        (async () => {
          try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const { Share } = await import('@capacitor/share');

            const base64Data = canvas.toDataURL('image/png').split(',')[1];
            const filename = `${name.replace(/\s+/g,'-').toLowerCase()}.png`;

            const res = await Filesystem.writeFile({
              path: filename,
              data: base64Data,
              directory: Directory.Cache,
            });

            await Share.share({
              title: 'Export PNG',
              url: res.uri,
            });
            this.toast('PNG exported via Share!', 'success');
          } catch (err) {
            console.error('PNG export sharing failed:', err);
            this.toast('PNG export failed', 'error');
          }
        })();
      } else {
        const a = document.createElement('a');
        a.download = `${name.replace(/\s+/g,'-').toLowerCase()}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        this.toast('PNG exported!', 'success');
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); this.toast('PNG export failed', 'error'); };
    img.src = url;
  }
}.prototype;
