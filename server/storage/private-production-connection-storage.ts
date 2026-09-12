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
  _keyVersion?: number;
}

const STORAGE_DIR = path.join(process.cwd(), '.data');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'private-production-connection.enc');

const getLegacyEncryptionKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback-insecure-secret-do-not-use-in-prod';
  return crypto.createHash('sha256').update(secret).digest();
};

const getPrimaryEncryptionKey = () => {
  if (!process.env.PRIVATE_PRODUCTION_ENCRYPTION_KEY) {
    console.warn('PRIVATE_PRODUCTION_ENCRYPTION_KEY is missing. Using legacy/fallback key. Please add a 32-byte key to .env.local');
    return getLegacyEncryptionKey();
  }
  return crypto.createHash('sha256').update(process.env.PRIVATE_PRODUCTION_ENCRYPTION_KEY).digest();
};

const tryDecryptWithKey = (buffer: Buffer, key: Buffer): string | null => {
  try {
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const ciphertext = buffer.subarray(32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
};

export const privateProductionConnectionStorage = {
  getSettings(): PrivateProductionConnectionSettings | null {
    if (!fs.existsSync(SETTINGS_FILE)) return null;
    
    try {
      const encrypted = fs.readFileSync(SETTINGS_FILE);
      if (encrypted.length < 32) return null;
      
      let decrypted = tryDecryptWithKey(encrypted, getPrimaryEncryptionKey());
      if (!decrypted && process.env.PRIVATE_PRODUCTION_ENCRYPTION_KEY) {
        decrypted = tryDecryptWithKey(encrypted, getLegacyEncryptionKey());
      }
      
      if (!decrypted) {
        console.warn('Failed to decrypt private production settings. The encryption key may have changed.');
        return null;
      }
      
      return JSON.parse(decrypted) as PrivateProductionConnectionSettings;
    } catch (err) {
      console.warn('Failed to read private production settings.', err);
      return null;
    }
  },

  saveSettings(settings: PrivateProductionConnectionSettings): void {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    
    const settingsWithVersion = { ...settings, _keyVersion: 2 };
    const plaintext = JSON.stringify(settingsWithVersion);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', getPrimaryEncryptionKey(), iv);
    
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    const payload = Buffer.concat([iv, authTag, ciphertext]);
    fs.writeFileSync(SETTINGS_FILE, payload, { mode: 0o600 });
  },

  clearSettings(): void {
    if (fs.existsSync(SETTINGS_FILE)) {
      fs.unlinkSync(SETTINGS_FILE);
    }
  }
};
