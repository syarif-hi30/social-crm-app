import CryptoJS from 'crypto-js';

const DEFAULT_SECRET_KEY = 'SocialCRM_AES256_LocalEncryptedVaultKey_2026';

export class EncryptionService {
  private static masterKey: string = DEFAULT_SECRET_KEY;

  static setMasterKey(key: string) {
    if (key && key.length >= 8) {
      this.masterKey = key;
    }
  }

  static encrypt(plainText: string): string {
    if (!plainText) return '';
    try {
      return CryptoJS.AES.encrypt(plainText, this.masterKey).toString();
    } catch (e) {
      console.error('Encryption error:', e);
      return plainText;
    }
  }

  static decrypt(cipherText: string): string {
    if (!cipherText) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, this.masterKey);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || cipherText;
    } catch (e) {
      console.error('Decryption error:', e);
      return '[Encrypted Data - Invalid Key]';
    }
  }

  static maskText(text: string, visibleChars: number = 4): string {
    if (!text) return '';
    if (text.length <= visibleChars) return '****';
    const prefix = text.substring(0, visibleChars);
    return `${prefix}${'*'.repeat(Math.max(4, text.length - visibleChars))}`;
  }

  static hashKey(key: string): string {
    return CryptoJS.SHA256(key).toString();
  }
}
