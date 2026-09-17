import fs from "fs/promises";
import path from "path";

export interface StorageUploadResult {
  storageKey: string;
  storageUrl?: string;
}

export interface ResumeStorage {
  upload(params: {
    candidateId: string;
    filename: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StorageUploadResult>;
  delete(storageKey: string): Promise<boolean>;
  get(storageKey: string): Promise<Buffer | null>;
}

/**
 * Local file system development storage implementation.
 * Stores files in the app's persistent storage directory.
 * Easily swappable with S3 or Vercel Blob by implementing ResumeStorage.
 */
export class LocalResumeStorage implements ResumeStorage {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), ".storage", "resumes");
  }

  private async ensureDir(dirPath: string) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      // Ignored if already exists
    }
  }

  async upload(params: {
    candidateId: string;
    filename: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StorageUploadResult> {
    const candidateDir = path.join(this.baseDir, params.candidateId);
    await this.ensureDir(candidateDir);

    const safeFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${params.candidateId}/${Date.now()}-${safeFilename}`;
    const filePath = path.join(this.baseDir, storageKey);

    await fs.writeFile(filePath, params.buffer);

    return {
      storageKey,
      storageUrl: undefined, // Local dev storage doesn't expose public URL
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, storageKey);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async get(storageKey: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.baseDir, storageKey);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const resumeStorage: ResumeStorage = new LocalResumeStorage();
