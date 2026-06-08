// @ts-nocheck
import { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl } from '../core/utils.js';

export const EventsMixin = class {
_setupCanvas() {
    const cont = document.getElementById('canvas-container');
    const svg  = document.getElementById('canvas');
    if (!cont || !svg) return;

    /* pan start on background */
    svg.addEventListener('mousedown', e => {
      if (e.target.closest('.node-group')) return;
      if (e.button !== 0) return;
      if (this.isPanning || this.isDragging) return;
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
        if (this.dragSubtree) {
          this.dragSubtree.forEach(id => {
            const node = this.nodes.get(id);
            if (node) {
              node.x = node._dragStartX + dx;
              node.y = node._dragStartY + dy;
              if (this.layout === 'freeForm') { node.freeX = node.x; node.freeY = node.y; }
              this._renderNode(node);
              
              // Apply ghost visual class
              const el = document.querySelector(`[data-id="${id}"]`);
              if (el) el.classList.add('node-ghost');
            }
          });
        }
        this._renderEdges();
        this._updateDropTarget(e.clientX, e.clientY);
      }
    });

    document.addEventListener('mouseup', e => {
      if (this.isPanning) { this.isPanning = false; svg.style.cursor = 'default'; }
      if (this.isDragging) {
        this.isDragging = false;
        
        // Remove ghost visual classes
        if (this.dragSubtree) {
          this.dragSubtree.forEach(id => {
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) el.classList.remove('node-ghost');
          });
        }

        /* Attempt reparent if there's a valid drop target */
        if (this._dropTargetId && this._dropTargetId !== this.dragId) {
          this._reparentNode(this.dragId, this._dropTargetId);
        } else if (this.layout !== 'freeForm') {
          const n = this.nodes.get(this.dragId);
          if (n && n._dragStartX !== undefined && (n.x !== n._dragStartX || n.y !== n._dragStartY)) {
            n.offsetX = (n.offsetX || 0) + (n.x - n._dragStartX);
            n.offsetY = (n.offsetY || 0) + (n.y - n._dragStartY);
          }
          this._applyLayout(); this.render();
          this._schedSave();
        } else {
          this._schedSave();
        }
        this._clearDropTarget();
        this.dragId = null;
        this.dragSubtree = null;
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
        e.preventDefault();
        this.isPanning = false;
        this.isPinchZooming = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.pinchStartDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        this.pinchStartZoom = this.zoom;
        this.svgRect = svg.getBoundingClientRect();
      }
    }, { passive: false });


    document.addEventListener('touchmove', e => {
      if (this.isPanning || this.isDragging) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      if (this.isPanning && touch) {
        this.panX = touch.clientX - this.panSX;
        this.panY = touch.clientY - this.panSY;
        this._updateTransform();
      }
      if (this.isDragging && this.dragId && touch) {
        const dx = (touch.clientX - this.dragSX) / this.zoom;
        const dy = (touch.clientY - this.dragSY) / this.zoom;
        if (this.dragSubtree) {
          this.dragSubtree.forEach(id => {
            const node = this.nodes.get(id);
            if (node) {
              node.x = node._dragStartX + dx;
              node.y = node._dragStartY + dy;
              if (this.layout === 'freeForm') { node.freeX = node.x; node.freeY = node.y; }
              this._renderNode(node);
              
              const el = document.querySelector(`[data-id="${id}"]`);
              if (el) el.classList.add('node-ghost');
            }
          });
        }
        this._renderEdges();
        this._updateDropTarget(touch.clientX, touch.clientY);
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
        
        if (this.dragSubtree) {
          this.dragSubtree.forEach(id => {
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) el.classList.remove('node-ghost');
          });
        }

        if (this._dropTargetId && this._dropTargetId !== this.dragId) {
          this._reparentNode(this.dragId, this._dropTargetId);
        } else if (this.layout !== 'freeForm') {
          const n = this.nodes.get(this.dragId);
          if (n && n._dragStartX !== undefined && (n.x !== n._dragStartX || n.y !== n._dragStartY)) {
            n.offsetX = (n.offsetX || 0) + (n.x - n._dragStartX);
            n.offsetY = (n.offsetY || 0) + (n.y - n._dragStartY);
          }
          this._applyLayout(); this.render();
        } else {
          this._schedSave();
        }
        this._clearDropTarget();
        this.dragId = null;
        this.dragSubtree = null;
      }
    });
  }

_setupToolbar() {
    /* Handle Web vs PWA Toolbar layout */
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (!isPWA && !isMobile) {
      const toolbar = document.getElementById('toolbar');
      const addGroup = document.getElementById('btn-add')?.closest('.toolbar-group');
      if (toolbar && addGroup) {
        const webGroup = document.createElement('div');
        webGroup.className = 'toolbar-group web-options-group';
        
        // Move common options to toolbar
        const optionsToMove = [
          'btn-undo', 'btn-redo', 
          'btn-search', 'btn-zoom-in', 'zoom-display', 'btn-zoom-out', 'btn-center', 
          'btn-layout'
        ];

        optionsToMove.forEach(id => {
          const btn = document.getElementById(id);
          if (btn) {
            const icon = btn.querySelector('.menu-icon');
            const txt = btn.querySelector('.menu-item-content');
            if (txt) btn.title = txt.textContent.trim().replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ');
            
            if (id === 'zoom-display') {
              btn.className = 'toolbar-btn';
              btn.style.width = '45px';
              btn.style.fontSize = '12px';
              btn.style.fontWeight = '600';
              btn.style.cursor = 'pointer';
              btn.innerHTML = Math.round(this.zoom * 100) + '%';
            } else if (icon) {
              btn.className = 'toolbar-btn';
              btn.innerHTML = '';
              btn.appendChild(icon);
            } else if (txt) {
              btn.className = 'toolbar-btn toolbar-btn-text';
            } else {
              btn.className = 'toolbar-btn';
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
        // Do not close hamburger menu when clicking submenu header buttons
        if (id === 'btn-add-menu' || id === 'btn-zoom-menu' || id === 'btn-mode-menu') {
          e.stopPropagation();
          return;
        }
      }
      // Close all submenus when menu is closed, except when clicking inside a submenu parent
      if (!e.target.closest('.dropdown-submenu-parent')) {
        document.querySelectorAll('.dropdown-submenu').forEach(sub => sub.classList.add('hidden'));
        hamDrop.classList.add('hidden');
      }
    });
    document.addEventListener('click', () => hamDrop?.classList.add('hidden'));

    /* export / import */
    document.getElementById('btn-export-png')?.addEventListener('click', () => this.exportPNG());
    document.getElementById('btn-export-svg')?.addEventListener('click', () => this.exportSVG());

    /* Drive Syncing */
    document.getElementById('btn-drive-save')?.addEventListener('click', () => {
      if (window.driveManager) {
        window.driveManager.saveToDrive(this._buildPayload());
      }
    });
    
    document.getElementById('btn-drive-open')?.addEventListener('click', () => {
      if (window.driveManager) {
        window.driveManager.openFromDrive();
      }
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

    /* right panel */
    const bindPanel = (id, fn) => {
      document.getElementById(id)?.addEventListener('click', fn);
      document.getElementById(id + '-desktop')?.addEventListener('click', fn);
    };
    bindPanel('btn-panel-outline', () => this._togglePanel('outline'));
    bindPanel('btn-panel-comment', () => this._togglePanel('comment'));
    bindPanel('btn-panel-theme', () => this._showModal('modal-theme'));

    /* --- New Hamburger Options & Submenus --- */
    
    // Toggle submenus on click
    document.getElementById('btn-add-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('add-submenu')?.classList.toggle('hidden');
    });
    document.getElementById('btn-zoom-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('zoom-submenu')?.classList.toggle('hidden');
    });
    document.getElementById('btn-mode-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('mode-submenu')?.classList.toggle('hidden');
    });

    // Add submenu options
    document.getElementById('btn-add-child-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('add-submenu')?.classList.add('hidden');
      this.addChildNode(this.selected || this.rootId, { diffColor: true });
    });
    document.getElementById('btn-add-sibling-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('add-submenu')?.classList.add('hidden');
      if (this.selected && this.selected !== this.rootId) this.addSiblingNode(this.selected);
    });
    document.getElementById('btn-insert-parent-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('add-submenu')?.classList.add('hidden');
      if (this.selected && this.selected !== this.rootId) this.insertParentNode(this.selected);
    });
    document.getElementById('btn-add-central-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('add-submenu')?.classList.add('hidden');
      this._newMap();
    });

    // Zoom submenu options
    document.getElementById('btn-zoom-in-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      this.zoom = clamp(this.zoom * CFG.ZOOM_BTN, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
      this._updateTransform(); this._updateZoomLabel();
    });
    document.getElementById('btn-zoom-out-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      this.zoom = clamp(this.zoom / CFG.ZOOM_BTN, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
      this._updateTransform(); this._updateZoomLabel();
    });
    document.getElementById('btn-zoom-fit-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('zoom-submenu')?.classList.add('hidden');
      this.fitToScreen();
    });
    document.getElementById('btn-zoom-topic-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('zoom-submenu')?.classList.add('hidden');
      if (this.selected) {
        this._centerOn(this.selected);
      } else {
        this.toast('Select a topic first to zoom', 'warn');
      }
    });

    // Mode indicator helper
    const updateModeIndicator = (locked) => {
      const badge = document.getElementById('editor-mode-indicator');
      if (!badge) return;
      if (locked) {
        badge.innerHTML = '🔒<span class="btn-label"> Locked</span>';
        badge.classList.remove('editor-mode-edit');
        badge.classList.add('editor-mode-lock');
      } else {
        badge.innerHTML = '✏️<span class="btn-label"> Edit</span>';
        badge.classList.remove('editor-mode-lock');
        badge.classList.add('editor-mode-edit');
      }
    };

    document.getElementById('editor-mode-indicator')?.addEventListener('click', e => {
      e.stopPropagation();
      this.isLocked = !this.isLocked;
      updateModeIndicator(this.isLocked);
      this.toast(this.isLocked ? 'MindMap is locked — no edits allowed' : 'Editing enabled', this.isLocked ? 'info' : 'success');
      
      // Update submenu highlights if open
      if (this.isLocked) {
        document.getElementById('btn-mode-lock')?.classList.add('dropdown-item-active');
        document.getElementById('btn-mode-edit')?.classList.remove('dropdown-item-active');
      } else {
        document.getElementById('btn-mode-edit')?.classList.add('dropdown-item-active');
        document.getElementById('btn-mode-lock')?.classList.remove('dropdown-item-active');
      }
    });

    // Mode submenu options
    document.getElementById('btn-mode-edit')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('mode-submenu')?.classList.add('hidden');
      this.isLocked = false;
      updateModeIndicator(false);
      this.toast('Editing enabled', 'success');
      document.getElementById('btn-mode-edit')?.classList.add('dropdown-item-active');
      document.getElementById('btn-mode-lock')?.classList.remove('dropdown-item-active');
    });
    document.getElementById('btn-mode-lock')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      document.getElementById('mode-submenu')?.classList.add('hidden');
      this.isLocked = true;
      updateModeIndicator(true);
      this.toast('MindMap is locked — no edits allowed', 'info');
      document.getElementById('btn-mode-lock')?.classList.add('dropdown-item-active');
      document.getElementById('btn-mode-edit')?.classList.remove('dropdown-item-active');
    });

    // Preferences & Info & Upgrade & Help
    document.getElementById('btn-preferences-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      if (this.selected) this.toggleWrap(this.selected);
      else this.toast('Select a node first to change preferences', 'warn');
    });

    document.getElementById('btn-info-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      
      const totalNodes = this.nodes.size;
      const totalCrossLinks = this.crossLinks.length;
      const mapName = document.getElementById('map-name-input')?.value || 'Welcome to MindMap';
      const activeLayout = LAYOUTS.find(l => l.id === this.layout)?.name || this.layout;
      
      let activeThemeName = this.theme;
      if (THEMES[this.theme]) {
        activeThemeName = THEMES[this.theme].name;
      }
      
      document.getElementById('info-map-name').textContent = mapName;
      document.getElementById('info-total-nodes').textContent = totalNodes;
      document.getElementById('info-cross-links').textContent = totalCrossLinks;
      document.getElementById('info-active-layout').textContent = activeLayout;
      document.getElementById('info-color-theme').textContent = activeThemeName;
      
      this._showModal('modal-info');
    });

    document.getElementById('btn-upgrade-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      this._showModal('modal-upgrade');
    });

    document.getElementById('btn-help-menu')?.addEventListener('click', e => {
      e.stopPropagation();
      hamDrop?.classList.add('hidden');
      this.toast('Tips: Double-tap node to edit text. Drag to move parent/child.', 'info');
    });
  }

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

_attachNodeEvents(g, id) {
    /* select + start drag (or cross link) */
    g.addEventListener('mousedown', e => {
      if (e.target.closest('.action-btn') || e.target.closest('.node-collapse-btn') || e.target.closest('.node-wrap-btn')) return;
      e.stopPropagation();
      if (this.crossLinkMode) {
        this._finishCrossLink(id);
        return;
      }
      if (this.isDragging || this.isPanning) return;
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
      this._startDrag(touch, id);
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

toggleCollapse(id) {
    const node = this.nodes.get(id);
    if (!node || node.children.length === 0) return;
    node.collapsed = !node.collapsed;
    this._applyLayout();
    this.render();
    this._schedSave();
  }

  toggleWrap(id) {
    if (this.isLocked) {
      this.toast('MindMap is locked', 'warn');
      return;
    }
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
}.prototype;
