// @ts-nocheck
'use strict';

// Fixed raw 32-byte key material for legacy file imports (backward compatibility).
const staticRawKey = new Uint8Array([
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
 * Imports the static raw key material for legacy fallback.
 */
async function getStaticCryptoKey() {
  return await window.crypto.subtle.importKey(
    'raw',
    staticRawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives a CryptoKey from a user-supplied password using PBKDF2.
 */
async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a mind map JSON string.
 * If a password is provided, uses PBKDF2 key derivation.
 * If no password is provided, falls back to the legacy static key.
 */
export async function encryptPayload(payloadString, password) {
  if (!password) {
    const key = await getStaticCryptoKey();
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

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassword(password, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(payloadString);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    encrypted: true,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertextBuffer)
  };
}

/**
 * Decrypts a mind map wrapper JSON object.
 * If the payload has no salt, it was encrypted with the legacy static key.
 * Otherwise, decrypts using the derived key from the supplied password.
 */
export async function decryptPayload(encryptedObj, password) {
  if (!encryptedObj || !encryptedObj.encrypted || !encryptedObj.iv || !encryptedObj.ciphertext) {
    throw new Error('Invalid encrypted payload structure');
  }

  const iv = base64ToUint8Array(encryptedObj.iv);
  const ciphertext = base64ToUint8Array(encryptedObj.ciphertext);

  // Legacy fallback: No salt parameter means it was encrypted with the old static key
  if (!encryptedObj.salt) {
    const key = await getStaticCryptoKey();
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    const decoded = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decoded);
  }

  // New secure files must have a password to decrypt
  if (!password) {
    throw new Error('Password required for decryption');
  }

  const salt = base64ToUint8Array(encryptedObj.salt);
  const key = await deriveKeyFromPassword(password, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  const decoded = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decoded);
}
