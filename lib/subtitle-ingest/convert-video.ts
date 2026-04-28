/**
 * Client-side helper for server-side video conversion.
 * Uploads a video file to the backend FFmpeg converter and returns a URL
 * that can be passed directly to videoFileToParsedCues() as a string.
 *
 * Browser-only — do not import from server-side code.
 */

export type ConvertProgressCallback = (message: string) => void;

/** Returns true if the browser can decode the file without server conversion. */
export function browserCanPlayFile(file: File): boolean {
  if (!file.type) return true; // Unknown MIME — let the video element try
  const test = document.createElement('video');
  return test.canPlayType(file.type) !== '';
}

/**
 * Upload the file to /api/video/convert, run FFmpeg on the server, and
 * return the temp URL of the H.264 output.
 *
 * The returned URL is valid for 30 minutes and can be passed directly to
 * videoFileToParsedCues() as a string — no need to re-download the blob.
 */
export async function convertVideoForOcr(
  file: File,
  onProgress?: ConvertProgressCallback
): Promise<string> {
  onProgress?.(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(0)} MB) for server conversion…`);

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/video/convert', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 413) {
      throw new Error(
        `File too large for the server upload limit (${(file.size / 1024 / 1024).toFixed(0)} MB). ` +
        `Update nginx: set client_max_body_size 500M; in the server block and reload nginx.`
      );
    }
    throw new Error(data.error || `Conversion failed (HTTP ${res.status})`);
  }

  onProgress?.('Conversion complete — starting frame extraction…');
  return data.url as string;
}
