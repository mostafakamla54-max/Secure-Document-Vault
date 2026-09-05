import * as CryptoJS from 'crypto-js';

export function encryptData(plaintext, key) {
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

export function decryptData(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function generateClientKey() {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
}
