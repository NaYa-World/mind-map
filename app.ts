// @ts-nocheck
import * as Sentry from '@sentry/browser';

try {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    integrations: [],
    tracesSampleRate: 0.1,
  });
} catch(e) {}

'use strict';

/* ============================================================
   MINDMAP APPLICATION CLASS
   ============================================================ */
export interface MindMapApp extends LayoutMixin, StorageMixin, HistoryMixin, RenderMixin, EventsMixin, CrudMixin, ModalsMixin {
  [key: string]: any; // Catch-all for dynamic properties during migration
}
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
    this.isLocked = false;

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
    this.isEditing   = false;
    this.editId      = null;
    this.activePanel = null;
    this.panelOpen   = false;
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
}

import { LayoutMixin } from './src/core/layout';
import { StorageMixin } from './src/core/storage';
import { HistoryMixin } from './src/core/history';
import { RenderMixin } from './src/ui/render';
import { EventsMixin } from './src/ui/events';
import { CrudMixin } from './src/core/crud';
import { ModalsMixin } from './src/ui/modals';
import { encryptPayload, decryptPayload } from './src/core/crypto.js';

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



/* ============================================================
   GOOGLE DRIVE MANAGER
   ============================================================ */
class GoogleDriveManager {
  constructor(app) {
    this.app = app;
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
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
          this.tokenAcquiredAt = Date.now();
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

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (src.includes('gsi/client') && window.google?.accounts?.oauth2) {
          resolve();
          return;
        }
        if (src.includes('api.js') && window.gapi) {
          resolve();
          return;
        }
        const oldOnload = existing.onload;
        existing.onload = (e) => {
          if (oldOnload) oldOnload(e);
          resolve();
        };
        existing.onerror = reject;
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Script load failed: ${src}`));
      document.head.appendChild(script);
    });
  }

  async _ensureGoogleScripts() {
    if (window.google?.accounts?.oauth2 && window.gapi && this.gapiInited) {
      return true;
    }
    this.app.toast('Connecting to Google services...', 'info');
    try {
      if (!window.google?.accounts?.oauth2) {
        await this._loadScript('https://accounts.google.com/gsi/client');
      }
      if (!window.gapi) {
        await this._loadScript('https://apis.google.com/js/api.js');
      }
      if (window.gapi && !this.gapiInited) {
        await new Promise((resolve) => {
          gapi.load('client:picker', async () => {
            try {
              await gapi.client.init({
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              });
              this.gapiInited = true;
            } catch (e) {
              console.error('GAPI Init error', e);
            }
            resolve();
          });
        });
      }
      return !!(window.google?.accounts?.oauth2);
    } catch (err) {
      console.error('Failed to load Google scripts:', err);
      return false;
    }
  }

  async _requireAuth(action) {
    const scriptsLoaded = await this._ensureGoogleScripts();
    if (!scriptsLoaded) {
      this.app.toast('Google scripts could not be loaded. Please check your network connection.', 'error');
      return;
    }

    if (!this.tokenClient) {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scopes,
        callback: (response) => {
          if (response.error !== undefined) {
            this.app.toast('Google Auth Error', 'error');
            return;
          }
          this.accessToken = response.access_token;
          this.tokenAcquiredAt = Date.now();
          if (this._pendingAction) {
            this._pendingAction();
            this._pendingAction = null;
          }
        },
      });
    }

    if (this.accessToken && this.tokenAcquiredAt && (Date.now() - this.tokenAcquiredAt > 3000 * 1000)) {
      this.accessToken = null;
    }

    if (this.accessToken) {
      action();
    } else {
      this._pendingAction = action;
      this.tokenClient.requestAccessToken({prompt: ''});
    }
  }

  saveToDrive(payload) {
    if (!this.app.requirePremium()) return;
    const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
    if (isNative) {
      this.app.toast("Redirecting to Share. Choose 'Google Drive' or 'Save to Drive'.", "info");
      this.app.exportJSON();
      return;
    }
    this._requireAuth(async () => {
      try {
        let password;
        try {
          password = await this.app.promptPassword(
            'Sync to Google Drive',
            'Enter a password to encrypt this MindMap file on your Google Drive.'
          );
        } catch (e) {
          this.app.toast('Sync cancelled: password required', 'warn');
          return;
        }
        this.app.toast('Saving to Google Drive...', 'info');
        const encryptedData = await encryptPayload(JSON.stringify(payload), password);
        const fileContent = JSON.stringify(encryptedData, null, 2);
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
    if (!this.app.requirePremium()) return;
    const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
    if (isNative) {
      this.app.toast("Opening file picker. Select 'Google Drive' or 'Drive' from the menu.", "info");
      document.getElementById('import-file-input')?.click();
      return;
    }
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
              let mapData = await res.json();
              if (mapData && mapData.encrypted) {
                let password;
                if (mapData.salt) {
                  try {
                    password = await this.app.promptPassword(
                      'Decrypt MindMap',
                      'This Google Drive file is password-protected. Please enter the password to open it.'
                    );
                  } catch (pErr) {
                    this.app.toast('Sync cancelled: password required', 'warn');
                    return;
                  }
                }
                mapData = await decryptPayload(mapData, password);
              }
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
async function verifyLicenseKey(key) {
  if (!key) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(key.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Obfuscated representation of target hash via split base64
  const _k = [
    'MzNk', 'ZTUx', 'ZmQy', 'Y2M2', 'MWUy', 'NmZi', 'YWJk', 'MjU3', 
    'YmM4', 'MzE2', 'ZjQ2', 'Zjkw', 'ZmM1', 'NzA3', 'NzUx', 'ODhl', 
    'M2Ez', 'Mjkx', 'MWEy', 'OGNi', 'Zjg1', 'ZA=='
  ].join('');
  
  return hashHex === window.atob(_k);
}


/* ============================================================
   BOOT (async — waits for DB)
   ============================================================ */
let app;
let driveManager;
document.addEventListener('DOMContentLoaded', async () => {
  // Verify License Key
  const licenseKey = import.meta.env.VITE_LICENSE_KEY || '';
  const isLicensed = await verifyLicenseKey(licenseKey);
  if (!isLicensed) {
    document.body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#0b0c10; color:#eeeef5; font-family:'Inter', sans-serif; text-align:center; padding:20px; box-sizing:border-box;">
        <h1 style="color:#f87171; font-size:30px; font-weight:700; margin-bottom:12px; font-family:'Inter', sans-serif;">⚠️ License Key Missing or Invalid</h1>
        <p style="color:rgba(238, 238, 245, 0.65); max-width:480px; font-size:14.5px; line-height:1.6; margin-bottom:24px; font-family:'Inter', sans-serif;">
          Execution halted. To run Naya MindMap, please copy <code>.env.example</code> to <code>.env</code> and define the correct <code>VITE_LICENSE_KEY</code> parameter.
        </p>
        <div style="background:#1c1c28; border:1px solid rgba(255,255,255,0.08); padding:12px 24px; border-radius:8px; font-size:13px; color:#4fc3f7; font-family:monospace; display:inline-block;">
          VITE_LICENSE_KEY=your_license_key_here
        </div>
      </div>
    `;
    return;
  }

  /* Handle Animated Splash Screen */
  document.body.classList.add('splash-active');
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      setTimeout(() => {
        splash.remove();
        document.body.classList.remove('splash-active');
      }, 800); // Wait for transition to finish
    }
  }, 6000); // Exactly 6 seconds

  /* Check for Stripe Checkout Success */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('checkout') === 'success') {
    localStorage.setItem('naya_premium', 'true');
    window.history.replaceState({}, document.title, '/');
  }

  app = new MindMapApp();
  
  app.promptPassword = function(title, description) {
    return new Promise((resolve, reject) => {
      const modal = document.getElementById('modal-password');
      const titleEl = document.getElementById('modal-password-title');
      const descEl = document.getElementById('modal-password-desc');
      const input = document.getElementById('password-input');
      const submitBtn = document.getElementById('btn-password-submit');
      const cancelBtn = document.getElementById('btn-password-cancel');
      const bg = modal?.querySelector('.modal-bg');

      if (!modal || !input || !submitBtn || !cancelBtn) {
        reject(new Error('Password modal elements not found'));
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = description;
      input.value = '';
      modal.classList.remove('hidden');
      input.focus();

      const cleanup = () => {
        modal.classList.add('hidden');
        submitBtn.removeEventListener('click', onSubmit);
        cancelBtn.removeEventListener('click', onCancel);
        bg?.removeEventListener('click', onCancel);
        input.removeEventListener('keydown', onKeyDown);
      };

      const onSubmit = () => {
        const val = input.value;
        if (!val) {
          alert('Password cannot be empty');
          return;
        }
        cleanup();
        resolve(val);
      };

      const onCancel = () => {
        cleanup();
        reject(new Error('Password prompt cancelled'));
      };

      const onKeyDown = (e) => {
        if (e.key === 'Enter') {
          onSubmit();
        } else if (e.key === 'Escape') {
          onCancel();
        }
      };

      submitBtn.addEventListener('click', onSubmit);
      cancelBtn.addEventListener('click', onCancel);
      bg?.addEventListener('click', onCancel);
      input.addEventListener('keydown', onKeyDown);
    });
  };
  
  app.isMobilePremiumUnlocked = false;
  if (import.meta.env.VITE_BUILD_TARGET === 'mobile') {
    app.isMobilePremiumUnlocked = await app.checkMobileBillingStatus();
  }
  
  app.isPremium = function() {
    if (import.meta.env.VITE_BUILD_TARGET === 'mobile') {
      return this.isMobilePremiumUnlocked;
    }
    return localStorage.getItem('naya_premium') === 'true';
  };

  
  app.requirePremium = function() {
    if (this.isPremium()) return true;
    document.getElementById('modal-upgrade')?.classList.remove('hidden');
    
    // Track upgrade click if posthog exists
    if (window.posthog) window.posthog.capture('Upgrade Modal Shown');
    
    return false;
  };

  app._mobilePremiumCached = null;
  app.isMobilePremiumUnlocked = false;

  app.checkMobileBillingStatus = async function() {
    if (this._mobilePremiumCached !== null) return this._mobilePremiumCached;

    const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
    if (!isNative) {
      this._mobilePremiumCached = false;
      return false;
    }

    try {
      // Dynamically load Capacitor In-App Purchase to prevent import failures in non-android environments
      const { InAppPurchase } = await import('@capacitor-community/in-app-purchase');
      const purchases = await InAppPurchase.getPurchases();
      const hasUpgrade = purchases.some(p => p.productId === 'premium_upgrade');
      this._mobilePremiumCached = hasUpgrade;
      return hasUpgrade;
    } catch (e) {
      console.warn('Capacitor IAP check skipped/unavailable:', e.message);
      // Local fallback during emulation testing
      const localFallback = localStorage.getItem('naya_premium') === 'true';
      this._mobilePremiumCached = localFallback;
      return localFallback;
    }
  };

  /* Attach Upgrade Button Event */
  document.getElementById('btn-upgrade-now')?.addEventListener('click', async () => {
    if (window.posthog) window.posthog.capture('Upgrade Clicked');
    
    const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
    if (isNative || import.meta.env.VITE_BUILD_TARGET === 'mobile') {
      app.toast('Connecting to Google Play Billing...', 'info');
      try {
        const { InAppPurchase } = await import('@capacitor-community/in-app-purchase');
        await InAppPurchase.purchase({ productId: 'premium_upgrade' });
        
        // Reload purchase state
        app._mobilePremiumCached = null;
        app.isMobilePremiumUnlocked = await app.checkMobileBillingStatus();
        if (app.isMobilePremiumUnlocked) {
          app.toast('Premium upgrade successful! Thank you!', 'success');
          document.getElementById('modal-upgrade')?.classList.add('hidden');
          app.render();
        }
      } catch (e) {
        console.error('Google Play purchase failed:', e);
        app.toast('Purchase failed or cancelled', 'error');
      }
    } else {
      window.location.href = import.meta.env.VITE_STRIPE_PAYMENT_LINK || "https://buy.stripe.com/test_dummy_link";
    }
  });


  const bypassBtn = document.getElementById('btn-upgrade-bypass');
  if (bypassBtn) {
    if (import.meta.env.DEV) {
      bypassBtn.addEventListener('click', () => {
        localStorage.setItem('naya_premium', 'true');
        document.getElementById('modal-upgrade')?.classList.add('hidden');
        app.toast('Premium features unlocked for testing!', 'success');
      });
    } else {
      bypassBtn.style.display = 'none';
    }
  }


  if (typeof GoogleDriveManager !== 'undefined') {
    driveManager = new GoogleDriveManager(app);
    window.driveManager = driveManager;
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
      nameTimer = setTimeout(() => app._saveDB(), 2000);
    });
    mapNameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); mapNameInput.blur(); }
    });
  }

  // Guarantee that any pending auto-saves are written to IndexedDB on page close
  window.addEventListener('beforeunload', () => {
    if (app && app.saveTimer) {
      app._saveDB();
    }
  });


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

  window.mindmap = app;
});
