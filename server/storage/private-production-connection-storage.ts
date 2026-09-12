import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface PrivateProductionConnectionSettings {
  alignmentUrlTemplate?: string;
  alignmentAuthorization?: string;
  alignmentExtraHeadersJson?: string;
  streamUrlTemplate?: string;
  streamAuthorization?: string;
  streamExtraHeadersJson?: string;
  providerKey?: string;
}

const STORAGE_DIR = path.join(process.cwd(), '.data');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'private-production-connection.enc');

// Get a deterministic 32-byte key from JWT_SECRET or fallback
const getEncryptionKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback-insecure-secret-do-not-use-in-prod';
  return crypto.createHash('sha256').update(secret).digest();
};

export const privateProductionConnectionStorage = {
  getSettings(): PrivateProductionConnectionSettings | null {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return null;
    }
    
    try {
      const encrypted = fs.readFileSync(SETTINGS_FILE);
      if (encrypted.length < 16) return null;
      
      const iv = encrypted.subarray(0, 16);
      const authTag = encrypted.subarray(16, 32);
      const ciphertext = encrypted.subarray(32);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(ciphertext, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted) as PrivateProductionConnectionSettings;
    } catch (err) {
      console.warn('Failed to decrypt private production settings. They may be corrupted or the encryption key changed.');
      return null;
    }
  },

  saveSettings(settings: PrivateProductionConnectionSettings): void {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    
    const plaintext = JSON.stringify(settings);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    const payload = Buffer.concat([iv, authTag, ciphertext]);
    fs.writeFileSync(SETTINGS_FILE, payload);
  },

  clearSettings(): void {
    if (fs.existsSync(SETTINGS_FILE)) {
      fs.unlinkSync(SETTINGS_FILE);
    }
  }
};
