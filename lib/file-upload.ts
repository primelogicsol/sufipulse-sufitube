/**
 * SufiPulse File Upload System
 * 
 * Standalone local file storage - NO cloud dependencies
 * Features:
 * - Local file storage with organization
 * - Automatic unique naming
 * - MIME type validation
 * - Size limits
 * - Cleanup utilities
 */

import fs from 'fs';
import path from 'path';
import { generateId } from './database';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Allowed MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
];

/**
 * Save uploaded file
 */
export async function saveFile(
  file: File,
  folder: string = 'general'
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `File type not allowed: ${file.type}`,
      };
    }

    // Create folder if needed
    const folderPath = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${generateId()}.${ext}`;
    const filePath = path.join(folderPath, fileName);

    // Write file
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));

    // Return public URL
    const publicUrl = `/uploads/${folder}/${fileName}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save file',
    };
  }
}

/**
 * Delete file
 */
export function deleteFile(filePath: string): boolean {
  try {
    // Remove /uploads/ prefix if present
    const cleanPath = filePath.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOAD_DIR, cleanPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[File Upload] Delete failed:', error);
    return false;
  }
}

/**
 * Get file info
 */
export function getFileInfo(filePath: string) {
  try {
    const cleanPath = filePath.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOAD_DIR, cleanPath);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stats = fs.statSync(fullPath);

    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch (error) {
    return null;
  }
}

/**
 * List files in folder
 */
export function listFiles(folder: string = 'general') {
  try {
    const folderPath = path.join(UPLOAD_DIR, folder);

    if (!fs.existsSync(folderPath)) {
      return [];
    }

    return fs.readdirSync(folderPath).map(file => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      return {
        name: file,
        url: `/uploads/${folder}/${file}`,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Cleanup old files (older than specified days)
 */
export function cleanupOldFiles(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    function scanFolder(folderPath: string) {
      const files = fs.readdirSync(folderPath);

      files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          scanFolder(filePath);
        } else if (stats.birthtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
    }

    scanFolder(UPLOAD_DIR);
    return { success: true, deletedCount };
  } catch (error) {
    return { success: false, error };
  }
}

export default {
  saveFile,
  deleteFile,
  getFileInfo,
  listFiles,
  cleanupOldFiles,
};
