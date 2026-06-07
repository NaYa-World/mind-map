'use strict';

// Fixed raw 32-byte key material for seamless app-level background AES-256 encryption.
const rawKey = new Uint8Array([
  0xa5, 0x12, 0xd4, 0xef, 0x88, 0xb9, 0x3c, 0x61,
  0x7d, 0x2e, 0xf0, 0x47, 0xbc, 0x3a, 0x9e, 0xcd,
  0x1f, 0x82, 0x56, 0xb1, 0x73, 0x90, 0xd2, 0x4b,
  0xec, 0xf3, 0x5a, 0x6e, 0x18, 0x77, 0x8b, 0xd9
]);

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Imports the static raw key material into a SubtleCrypto CryptoKey object.
 */
async function getCryptoKey() {
  return await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Automatically encrypts a mind map JSON string.
 * Returns a wrapper JSON object containing ciphertext and IV.
 */
export async function encryptPayload(payloadString) {
  const key = await getCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(payloadString);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    encrypted: true,
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertextBuffer)
  };
}

/**
 * Automatically decrypts a mind map wrapper JSON object.
 * Returns the decrypted mind map JSON parsed object.
 */
export async function decryptPayload(encryptedObj) {
  if (!encryptedObj || !encryptedObj.encrypted || !encryptedObj.iv || !encryptedObj.ciphertext) {
    throw new Error('Invalid encrypted payload structure');
  }
  const key = await getCryptoKey();
  const iv = base64ToUint8Array(encryptedObj.iv);
  const ciphertext = base64ToUint8Array(encryptedObj.ciphertext);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  const decoded = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decoded);
}
