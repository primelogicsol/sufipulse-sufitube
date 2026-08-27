import '@/lib/database-schema';

declare module '@/lib/database-schema' {
  interface YouTubeAnalyticsSnapshot {
    /** Human-readable provenance/status label for the verified institutional snapshot. */
    snapshotStatus?: string;
  }
}
