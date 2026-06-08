# Phase 1 Bug Fixes: Security, Billing & Performance

This document summarizes the challenges faced, technical resolution strategies, and code examples for the **Phase 1 Bug Fixes** implemented for Naya MindMap V2. The fixes are executed from the combined perspectives of a **White-Hat Hacker** and a **Senior Frontend Developer**.

---

## 1. Security Fix: Dynamic AES Encryption & Password Prompt

### The Challenge
* **Before:** The application utilized zero-knowledge encryption using the Web Crypto API, but relied on a static, hardcoded 32-byte key material:
  ```javascript
  const yc = new Uint8Array([165, 18, 212, 239, ...]);
  ```
  Since this compiled down to public client-side JavaScript assets, any hacker could extract the key material and decrypt any user's local backups or Google Drive files.
* **The Complexity:** We had to remove the hardcoded key and derive it dynamically from a user password. However, we also had to maintain **backward-compatibility** so that old files (encrypted with the V1 static key) still opened seamlessly without prompting for a password.

### How We Fixed It
1. **Dynamic Key Derivation (PBKDF2):** We implemented password-based key derivation using PBKDF2 with 100,000 iterations of SHA-256 and a random 16-byte salt:
   ```javascript
   async function deriveKeyFromPassword(password, salt) {
     const encoder = new TextEncoder();
     const passwordBuffer = encoder.encode(password);
     
     const baseKey = await window.crypto.subtle.importKey(
       'raw', passwordBuffer, 'PBKDF2', false, ['deriveKey']
     );
     
     return await window.crypto.subtle.deriveKey(
       { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
       baseKey,
       { name: 'AES-GCM', length: 256 },
       false,
       ['encrypt', 'decrypt']
     );
   }
   ```
2. **Backward Compatibility Fallback:** If the encrypted file doesn't have a `salt` property, we identify it as a legacy V1 file and decrypt it using the old static key without prompting the user.
3. **Promise-Based UI Prompt:** We built a modal-based prompt inside [app.html](file:///Users/karthikganji/Downloads/analyze-devops-2/mindmap/app.html) and [app.ts](file:///Users/karthikganji/Downloads/analyze-devops-2/mindmap/app.ts) that yields a Promise. When an export, import, or Google Drive operation is triggered, the app pops up a modal asking for the password:
   ```javascript
   const password = await this.promptPassword('Export File', 'Enter password...');
   ```

---

## 2. Security Fix: Obfuscated License Verification

### The Challenge
* **Before:** The license check inside the client bundle was written in plain text:
  ```javascript
  return hashHex === '33de51fd2cc61e26fbabd257bc8316f46f90fc570775188e3a32911a28cbf85d';
  ```
  Any developer looking at the Javascript bundle could easily find this string and bypass the license validation.

### How We Fixed It
We base64-encoded the target hash and split the base64 string into multiple fragments inside a joined array. When the code runs, it decodes the fragments to evaluate the check, preventing simple static grep-checks or search-and-replace scans:
```javascript
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
```

---

## 3. Play Store Fix: Google Play Billing Integration

### The Challenge
* **Before:** Mobile users were directed to a Stripe checkout link. This violates Google Play Store policies and leads to immediate app rejection.
* **The Complexity:** We had to implement mobile checkout using Capacitor native billing while ensuring the code still compiles cleanly on the web version where the Capacitor plugins are not present.

### How We Fixed It
1. **Dynamic Importing & Safety Guards:** We wrapped the import of `@capacitor-community/in-app-purchase` inside a try-catch block.
2. **Conditional Checkout Routing:** When the "Upgrade Now" button is clicked:
   - On Web: Redirect to Stripe payment link.
   - On Mobile: Trigger Google Play native billing sheet:
   ```javascript
   const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
   if (isNative) {
     const { InAppPurchase } = await import('@capacitor-community/in-app-purchase');
     await InAppPurchase.purchase({ productId: 'premium_upgrade' });
     // Verify and unlock
   }
   ```
3. **Vite Externalizer:** Added the billing package to `rollupOptions.external` inside `vite.config.ts` to prevent bundler errors during compiling.

---

## 4. Performance Fixes: Debounced Auto-Saves & Touch Gestures

### The Challenge
* **Before:** Writes to IndexedDB were fired continuously while typing, causing layout jitter and high battery usage on mobile devices. Touch inputs panning on the canvas also caused page viewport scrolling and jumping.

### How We Fixed It
1. **Save Debouncing:** We throttled the auto-save write frequency to `2000ms` (2 seconds) after typing stops, updating the UI indicator to `'saving'` immediately:
   ```javascript
   _schedSave() {
     clearTimeout(this.saveTimer);
     this._setSaveState('saving');
     this.saveTimer = setTimeout(() => this._saveDB(), 2000);
   }
   ```
2. **Save Page Unload Recovery:** Added a `beforeunload` listener to execute any pending saves instantly if the user closes their browser:
   ```javascript
   window.addEventListener('beforeunload', () => {
     if (app && app.saveTimer) app._saveDB();
   });
   ```
3. **Touch Action Panning:** Set `touch-action: none` on `#canvas-container` and `#canvas` in [style.css](file:///Users/karthikganji/Downloads/analyze-devops-2/mindmap/style.css) and updated the touchmove/touchstart listeners to prevent default scrolling on multi-touch gestures.
