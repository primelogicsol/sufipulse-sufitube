/**
 * Client-side helper for server-side video conversion.
 *
 * Uploads in 5 MB chunks to bypass Next.js App Router's internal ~10 MB
 * body-read limit. The server assembles chunks and runs FFmpeg on the last one.
 *
 * Browser-only — do not import from server-side code.
 */

export type ConvertProgressCallback = (message: string) => void;

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per chunk

/** Returns true if the browser can decode the file without server conversion. */
export function browserCanPlayFile(file: File): boolean {
  if (!file.type) return true;
  const test = document.createElement('video');
  return test.canPlayType(file.type) !== '';
}

/**
 * Upload the file to /api/video/convert in 5 MB chunks, assemble on the
 * server, convert to H.264 with FFmpeg, and return the temp URL.
 *
 * The returned URL is valid for 30 minutes and can be passed directly to
 * videoFileToParsedCues() — no need to re-download the blob.
 */
export async function convertVideoForOcr(
  file: File,
  onProgress?: ConvertProgressCallback
): Promise<string> {
  if (file.size === 0) throw new Error('File is empty');

  const totalMB = (file.size / 1024 / 1024).toFixed(0);
  const uploadId = crypto.randomUUID();
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const pct = Math.round((i / totalChunks) * 100);

    onProgress?.(`Uploading ${totalMB} MB — ${pct}% (part ${i + 1} of ${totalChunks})…`);

    const res = await fetch('/api/video/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Upload-Id': uploadId,
        'X-Chunk-Index': String(i),
        'X-Total-Chunks': String(totalChunks),
        'X-Filename': encodeURIComponent(file.name),
      },
      body: chunk,
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error(
          `Upload chunk rejected as too large. Check nginx client_max_body_size (must be ≥ 500M).`
        );
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Upload failed at part ${i + 1}/${totalChunks} (HTTP ${res.status})`);
    }

    if (i === totalChunks - 1) {
      // Last chunk — server has assembled + converted; response contains the URL
      const data = await res.json().catch(() => ({}));
      if (!data.url) throw new Error(data.error || 'Conversion finished but no URL returned');
      onProgress?.('Conversion complete — starting frame extraction…');
      return data.url as string;
    }
  }

  throw new Error('Unexpected state: upload loop exited without a URL');
}
