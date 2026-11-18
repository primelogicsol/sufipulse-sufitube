/**
 * server/types/pipeline-draft.ts
 *
 * Isolated data types for the New-Release Hybrid Studio pipeline.
 * Completely decoupled from historical catalog records.
 */

export type VariantRole =
  | 'primary'
  | 'alternate'
  | 'extension'
  | 'corrected_passage'
  | 'vocal_stem'
  | 'instrumental_stem';

export interface VariantSource {
  variantId: string;
  label: string; // e.g., 'Variant A', 'Variant B', 'Chorus Patch 1'
  sourceType: 'suno_url' | 'audio_upload';
  sourceAssetId?: string; // Suno UUID if applicable
  sourceUrl?: string;     // https://suno.com/song/...
  filePath: string;       // local audio file path in .data/pipeline-drafts/{draftId}/audio/
  fileName: string;
  format: 'wav' | 'mp3' | 'm4a' | 'flac';
  durationSeconds: number;
  sampleRate: number;
  bitDepth?: number;
  channels: number;
  sha256: string;
  importedAt: string;
  lyricsText?: string;
  rawAlignment?: {
    lines: Array<{
      index: number;
      text: string;
      startSeconds: number;
      endSeconds: number;
      words: Array<{ text: string; startSeconds: number; endSeconds: number }>;
    }>;
    words: Array<{ text: string; startSeconds: number; endSeconds: number }>;
    alignmentQuality?: number;
  };
}

export interface AssemblyTransition {
  type: 'cut' | 'crossfade';
  durationSeconds?: number;
}

export interface AssemblySegmentEDL {
  segmentId: string;
  sourceVariantId: string;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  destinationStartSeconds: number;
  transition: AssemblyTransition;
  trackType: 'full_mix' | 'vocal_stem' | 'instrumental_stem';
  gainDb?: number;
  excludedLineIndexes?: number[];
  enabled: boolean;
}

export interface AudioAssemblyEDL {
  version: number;
  updatedAt: string;
  segments: AssemblySegmentEDL[];
}

export interface ReconciledWord {
  text: string;
  startSeconds: number;
  endSeconds: number;
  sourceVariantId: string;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
}

export interface ReconciledLine {
  lineIndex: number;
  vocalIndex?: number;
  segmentId: string;
  sourceVariantId: string;
  sourceLineIndex: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  speaker?: string; // e.g. "शायर" | "रब" | "नौजवान" | "कोरस"
  section?: string; // e.g. "आग़ाज़ | पुर-असरार सुकूत, गहरी सरगोशी"
  confidence?: number;
  urduNastaliq?: string;
  englishTranslation?: string;
  romanUrdu?: string;
  devanagariUrdu?: string;
  isProductionDirection: boolean;
  words: ReconciledWord[];
}

export interface ReconciledMasterTimeline {
  revision: number;
  durationSeconds: number;
  lines: ReconciledLine[];
  words: ReconciledWord[];
  stats: {
    lineCount: number;
    wordCount: number;
    overlapCount: number;
    crossfadeBoundaryWarnings: number;
  };
  validation: {
    isMonotonic: boolean;
    boundaryClashes: string[];
    confidenceScore: number;
  };
}

export interface AIQualityAnomaly {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type:
    | 'awkward_silence'
    | 'vocal_clip_or_distortion'
    | 'abrupt_cutoff'
    | 'mispronunciation_detected'
    | 'rhythm_stumble'
    | 'weak_instrumental';
  variantId: string;
  startSeconds: number;
  endSeconds: number;
  description: string;
  suggestedReplacement?: {
    suggestedVariantId: string;
    sourceInSeconds: number;
    sourceOutSeconds: number;
    confidence: number;
    reason: string;
  };
}

export interface AssemblyRevisionRecord {
  revision: number;
  updatedAt: string;
  changeNote: string;
  edl: AudioAssemblyEDL;
  timelineSnapshot?: ReconciledMasterTimeline;
  masterWavPath?: string;
  masterDurationSeconds?: number;
  masterSha256?: string;
}

export interface PublishingTransactionRecord {
  txId: string;
  status:
    | 'NOT_STARTED'
    | 'PRIVATE_UPLOAD_INITIATED'
    | 'PRIVATE_UPLOAD_COMPLETED'
    | 'CAPTIONS_UPLOADED'
    | 'CMS_RECORD_COMMITTED'
    | 'VISIBILITY_UNVEILED'
    | 'FAILED'
    | 'RECONCILED';
  youtubeVideoId?: string;
  youtubePrivacyStatus?: 'private' | 'unlisted' | 'public';
  captionTrackStatus?: Record<string, 'pending' | 'uploaded' | 'failed'>;
  cmsReleaseId?: string;
  publishedUrl?: string;
  lastAttemptAt: string;
  history: Array<{
    timestamp: string;
    step: string;
    status: 'success' | 'failure' | 'retry';
    details?: string;
  }>;
}

export interface VideoPartAThumbnailConfig {
  enabled?: boolean;
  durationSeconds?: number; // Introductory screen duration, default: 5.0s
  sourceType?: 'uploaded_image' | 'uploaded_video' | 'canva_image' | 'video_frame' | 'default_banner';
  filePath?: string;
  fileName?: string;
  thumbnailPath?: string;
  thumbnailMode?: 'first_frame' | 'custom_frame' | 'custom_upload';
  thumbnailTimestampSeconds?: number;
  independentYouTubeThumbnailPath?: string;
  audioPolicy?: 'silence' | 'ambient' | 'suno_starts_at_part_b' | 'suno_starts_at_part_a' | 'preserve_part_a_audio';
  hasAudio?: boolean;
  uploadedAt?: string;
  // Legacy / visual fallbacks
  canvaDesignId?: string;
  canvaUrl?: string;
  title?: string;
  mediaType?: 'image' | 'video';
  playbackDurationSeconds?: number;
  playbackMode?: any;
  loopStartSeconds?: number;
  loopEndSeconds?: number;
  width?: number;
  height?: number;
  validationStatus?: 'VALID' | 'FAILED' | 'PENDING';
  validationError?: string;
}

export interface VideoPartBSongConfig {
  enabled?: boolean;
  canvaDesignId: string;
  canvaUrl: string;
  title: string;
  filePath?: string;
  fileName?: string;
  sourceDurationSeconds?: number; // e.g. 4.0s
  targetDurationSeconds?: number; // exact match to Suno master audio, e.g. 285.16s
  playbackMode: 'seamless_loop' | 'freeze_last_frame' | 'stretch' | 'custom_range';
  loopStartSeconds?: number;
  loopEndSeconds?: number;
  hasBurnedSubtitles?: boolean;
  uploadedAt?: string;
  // Legacy fallback if promo passed to partB
  sceneCount?: number;
  formattedDuration?: string;
  durationSeconds?: number;
  audioMode?: any;
  width?: number;
  height?: number;
  hasAudio?: boolean;
  validationStatus?: 'VALID' | 'FAILED' | 'PENDING';
  validationError?: string;
}

export interface VideoPartCPromoConfig {
  enabled: boolean;
  canvaDesignId: string;
  canvaUrl: string;
  title: string;
  sceneCount: number;
  filePath?: string;
  fileName?: string;
  durationSeconds?: number; // e.g. 608.0s (10:08)
  formattedDuration?: string;
  width?: number;
  height?: number;
  hasAudio?: boolean;
  validationStatus?: 'VALID' | 'FAILED' | 'PENDING';
  validationError?: string;
  audioMode: 'preserve_canva_audio' | 'crossfade' | 'mute';
  playbackMode: 'full_19_scenes' | 'trimmed';
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  uploadedAt?: string;
}

// Backward compatibility legacy interfaces
export interface CanvaPartAConfig extends VideoPartBSongConfig {
  mediaType?: 'image' | 'video';
  thumbnailPath?: string;
  playbackDurationSeconds?: number;
  thumbnailMode?: 'first_frame' | 'custom_frame' | 'custom_upload';
  thumbnailTimestampSeconds?: number;
  width?: number;
  height?: number;
  validationStatus?: 'VALID' | 'FAILED' | 'PENDING';
  validationError?: string;
}

export interface CanvaPartBConfig extends VideoPartCPromoConfig {}

export interface PipelineDraft {
  draftId: string; // Isolated UUID
  slug: string;
  title: string;
  primaryLanguage: string;
  availableLanguages: string[];
  canonicalLyrics: {
    text: string;
    language: string;
    status: 'DRAFT' | 'REVIEWED' | 'APPROVED';
    approvedAt?: string;
    approvedBy?: string;
    thematicSubtitle?: string;
    structured?: any;
  };
  variants: Record<string, VariantSource>;
  activeVariantId: string;
  assembly: AudioAssemblyEDL;
  currentRevision: number;
  assemblyRevisions: AssemblyRevisionRecord[];
  masterAudio: {
    format: 'wav';
    sampleRate: number;
    bitDepth: number;
    channels: number;
    durationSeconds: number;
    filePath: string;
    sha256: string;
    renderedAt: string;
  } | null;
  masterTimeline: ReconciledMasterTimeline | null;
  /** Automated production chain status (align -> subtitles -> 4 masters). */
  productionStatus?: {
    state: 'running' | 'done' | 'failed';
    stage: string;
    message?: string;
    error?: string | null;
    completed?: string[];
    startedAt?: string;
    updatedAt?: string;
  };
  /** Background caption alignment status (vocal isolation + speech alignment). */
  alignmentStatus?: {
    state: 'running' | 'done' | 'failed';
    message?: string;
    code?: string;
    startedAt?: string;
    updatedAt?: string;
    alignedLineCount?: number;
  };
  stems: {
    hasSeparateStems: boolean;
    vocalStemPath?: string;
    instrumentalStemPath?: string;
  };
  qualityAnomalies: AIQualityAnomaly[];
  downstreamStatus: {
    timestampsValid: boolean;
    subtitlesValid: boolean;
    videoValid: boolean;
    approvalStatus:
      | 'draft'
      | 'assembly_pending_review'
      | 'ready_for_video'
      | 'approved_for_publishing'
      | 'published';
  };
  publishingTx: PublishingTransactionRecord | null;
  video?: {
    status: 'PENDING' | 'RENDERING' | 'RENDERED' | 'FAILED';
    renderedAt?: string;
    activeFormat?: 'lyric_master' | 'clean_cinematic';
    activeOrientation?: 'landscape' | 'portrait';
    partA?: VideoPartAThumbnailConfig;
    partB?: VideoPartBSongConfig;
    partC?: VideoPartCPromoConfig;
    legacyPartA?: any;
    legacyPartB?: any;
    formats: Record<
      string,
      {
        format: string;
        outputPath: string;
        sha256?: string;
        durationSeconds: number;
        hasBurnedSubtitles: boolean;
        partASeconds?: number;
        partBSeconds?: number;
        partCSeconds?: number;
        width?: number;
        height?: number;
      }
    >;
  };
  createdAt: string;
  updatedAt: string;
}
