import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  PipelineDraft,
  AudioAssemblyEDL,
  VariantSource,
  AssemblyRevisionRecord,
  ReconciledMasterTimeline,
} from '@/server/types/pipeline-draft';

export const BASE_DATA_DIR = path.resolve(process.cwd(), '.data', 'pipeline-drafts');

export function isValidDraftId(draftId: string): boolean {
  if (!draftId || typeof draftId !== 'string') return false;
  return /^draft_\d+_[a-f0-9]+$/i.test(draftId.trim());
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getDraftDir(draftId: string): string {
  return path.join(BASE_DATA_DIR, draftId);
}

export function getDraftJsonPath(draftId: string): string {
  return path.join(getDraftDir(draftId), 'draft.json');
}

export function getDraftAudioDir(draftId: string): string {
  const dir = path.join(getDraftDir(draftId), 'audio');
  ensureDir(dir);
  return dir;
}

export function computeFileSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export const pipelineDraftStorage = {
  createDraft(params: {
    title: string;
    slug?: string;
    lyricsText?: string;
    primaryLanguage?: string;
    initialSourceAssetId?: string;
  }): PipelineDraft {
    ensureDir(BASE_DATA_DIR);
    const draftId = `draft_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Clean and validate title: prevent raw Suno URLs or fragmented UUIDs from being the title
    let rawTitle = String(params.title || '').trim();
    const uuidMatch = rawTitle.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    const isUrl = rawTitle.includes('suno.com') || rawTitle.startsWith('http://') || rawTitle.startsWith('https://');

    let cleanTitle = rawTitle;
    if (isUrl || (uuidMatch && rawTitle.length <= 42) || !rawTitle) {
      const assetSnippet = uuidMatch ? uuidMatch[0].slice(0, 8) : (params.initialSourceAssetId ? params.initialSourceAssetId.slice(0, 8) : 'new');
      cleanTitle = `Suno Release (${assetSnippet})`;
    }

    const slug = (params.slug || cleanTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `release-${draftId}`;

    const now = new Date().toISOString();
    const draft: PipelineDraft = {
      draftId,
      slug,
      title: cleanTitle,
      primaryLanguage: params.primaryLanguage || 'ur',
      availableLanguages: ['ur', 'en', 'en-rom', 'hi'],
      canonicalLyrics: {
        text: params.lyricsText || '',
        language: params.primaryLanguage || 'ur',
        status: 'DRAFT',
      },
      variants: {},
      activeVariantId: '',
      assembly: {
        version: 1,
        updatedAt: now,
        segments: [],
      },
      currentRevision: 1,
      assemblyRevisions: [],
      masterAudio: null,
      masterTimeline: null,
      stems: {
        hasSeparateStems: false,
      },
      qualityAnomalies: [],
      downstreamStatus: {
        timestampsValid: false,
        subtitlesValid: false,
        videoValid: false,
        approvalStatus: 'draft',
      },
      video: {
        status: 'PENDING',
        renderedAt: now,
        partA: {
          enabled: true,
          durationSeconds: 5.0,
          sourceType: 'uploaded_image',
          audioPolicy: 'suno_starts_at_part_b',
        },
        partB: {
          enabled: true,
          canvaDesignId: 'DAHa7St5CYs',
          canvaUrl: 'https://canva.link/ezqj8ymddv6yl2d',
          title: 'Part B Background Theme',
          sourceDurationSeconds: 4.0,
          targetDurationSeconds: 285.16,
          playbackMode: 'seamless_loop',
          hasBurnedSubtitles: true,
        },
        partC: {
          enabled: true,
          canvaDesignId: 'DAHa7eJOcbI',
          canvaUrl: 'https://canva.link/qvmwwc830dm623g',
          title: 'Part 2',
          sceneCount: 19,
          durationSeconds: 608.0,
          formattedDuration: '10:08',
          width: 1920,
          height: 1080,
          hasAudio: true,
          validationStatus: 'VALID',
          audioMode: 'preserve_canva_audio',
          playbackMode: 'full_19_scenes',
        },
        formats: {},
      },
      publishingTx: null,
      createdAt: now,
      updatedAt: now,
    };

    this.saveDraft(draft);
    console.log(`[pipelineDraftStorage] Created draft ${draftId} ("${cleanTitle}") in ${getDraftDir(draftId)}`);
    return draft;
  },

  getDraft(draftId: string): PipelineDraft | null {
    if (!isValidDraftId(draftId)) {
      console.warn(`[pipelineDraftStorage] Rejected lookup for invalid draftId format: "${draftId}"`);
      return null;
    }
    const jsonPath = getDraftJsonPath(draftId);
    const exists = fs.existsSync(jsonPath);
    console.log(`[pipelineDraftStorage] getDraft("${draftId}") -> exists: ${exists} (${jsonPath})`);
    if (!exists) return null;

    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const draft = JSON.parse(raw) as PipelineDraft;

      // Invariant: Ensure Part A background theme and Part B Canva video are always present
      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: draft.updatedAt || new Date().toISOString(),
          formats: {},
        };
      }
      if (!draft.video.partA) {
        draft.video.partA = {
          enabled: true,
          durationSeconds: 5.0,
          sourceType: 'uploaded_image',
          audioPolicy: 'suno_starts_at_part_b',
        };
      }
      if (!draft.video.partB) {
        draft.video.partB = {
          enabled: true,
          canvaDesignId: 'DAHa7St5CYs',
          canvaUrl: 'https://canva.link/ezqj8ymddv6yl2d',
          title: 'Part B Background Theme',
          sourceDurationSeconds: 4.0,
          targetDurationSeconds: 285.16,
          playbackMode: 'seamless_loop',
          hasBurnedSubtitles: true,
        };
      }
      if (!draft.video.partC) {
        draft.video.partC = {
          enabled: true,
          canvaDesignId: 'DAHa7eJOcbI',
          canvaUrl: 'https://canva.link/qvmwwc830dm623g',
          title: 'Part 2',
          sceneCount: 19,
          durationSeconds: 608.0,
          formattedDuration: '10:08',
          width: 1920,
          height: 1080,
          hasAudio: true,
          validationStatus: 'VALID',
          audioMode: 'preserve_canva_audio',
          playbackMode: 'full_19_scenes',
        };
      }

      return draft;
    } catch (err) {
      console.error(`[pipelineDraftStorage] Error reading draft ${draftId}:`, err);
      return null;
    }
  },

  saveDraft(draft: PipelineDraft): void {
    const draftDir = getDraftDir(draft.draftId);
    ensureDir(draftDir);

    draft.updatedAt = new Date().toISOString();
    const targetPath = getDraftJsonPath(draft.draftId);
    const tmpPath = `${targetPath}.tmp_${Date.now()}`;

    fs.writeFileSync(tmpPath, JSON.stringify(draft, null, 2), 'utf8');
    fs.renameSync(tmpPath, targetPath);
    console.log(`[pipelineDraftStorage] Persisted draft ${draft.draftId} to disk.`);
  },

  listDrafts(): PipelineDraft[] {
    ensureDir(BASE_DATA_DIR);
    const dirs = fs.readdirSync(BASE_DATA_DIR);
    const drafts: PipelineDraft[] = [];

    for (const dir of dirs) {
      const draftPath = path.join(BASE_DATA_DIR, dir, 'draft.json');
      if (fs.existsSync(draftPath)) {
        try {
          const raw = fs.readFileSync(draftPath, 'utf8');
          drafts.push(JSON.parse(raw));
        } catch {}
      }
    }

    return drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  addVariant(draftId: string, variant: VariantSource): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    draft.variants[variant.variantId] = variant;
    if (!draft.activeVariantId) {
      draft.activeVariantId = variant.variantId;
    }

    // If assembly is empty, seed it with this initial variant
    if (draft.assembly.segments.length === 0) {
      draft.assembly.segments = [
        {
          segmentId: `seg_1_${variant.variantId}`,
          sourceVariantId: variant.variantId,
          sourceInSeconds: 0,
          sourceOutSeconds: variant.durationSeconds,
          destinationStartSeconds: 0,
          transition: { type: 'cut' },
          trackType: 'full_mix',
          enabled: true,
        },
      ];
      draft.assembly.updatedAt = new Date().toISOString();
    }

    this.saveDraft(draft);
    return draft;
  },

  updateAssembly(
    draftId: string,
    newEDL: AudioAssemblyEDL,
    changeNote: string = 'Assembly updated'
  ): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    const now = new Date().toISOString();

    // Snapshot current revision for rollback
    const revisionRecord: AssemblyRevisionRecord = {
      revision: draft.currentRevision,
      updatedAt: now,
      changeNote,
      edl: JSON.parse(JSON.stringify(draft.assembly)),
      timelineSnapshot: draft.masterTimeline ? JSON.parse(JSON.stringify(draft.masterTimeline)) : undefined,
      masterWavPath: draft.masterAudio?.filePath,
      masterDurationSeconds: draft.masterAudio?.durationSeconds,
      masterSha256: draft.masterAudio?.sha256,
    };

    draft.assemblyRevisions.push(revisionRecord);
    draft.currentRevision += 1;
    newEDL.version = draft.currentRevision;
    newEDL.updatedAt = now;
    draft.assembly = newEDL;

    // INVARIATION CASCADE: Invalidate all downstream dependent assets
    draft.masterAudio = null;
    draft.masterTimeline = null;
    draft.downstreamStatus.timestampsValid = false;
    draft.downstreamStatus.subtitlesValid = false;
    draft.downstreamStatus.videoValid = false;
    draft.downstreamStatus.approvalStatus = 'assembly_pending_review';

    this.saveDraft(draft);
    return draft;
  },

  rollbackAssembly(draftId: string, targetRevision: number): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    const target = draft.assemblyRevisions.find((r) => r.revision === targetRevision);
    if (!target) throw new Error(`Revision ${targetRevision} not found`);

    const now = new Date().toISOString();

    // Snapshot current before rolling back
    draft.assemblyRevisions.push({
      revision: draft.currentRevision,
      updatedAt: now,
      changeNote: `Rollback to revision ${targetRevision}`,
      edl: JSON.parse(JSON.stringify(draft.assembly)),
      timelineSnapshot: draft.masterTimeline ? JSON.parse(JSON.stringify(draft.masterTimeline)) : undefined,
      masterWavPath: draft.masterAudio?.filePath,
      masterDurationSeconds: draft.masterAudio?.durationSeconds,
      masterSha256: draft.masterAudio?.sha256,
    });

    draft.currentRevision += 1;
    draft.assembly = {
      ...JSON.parse(JSON.stringify(target.edl)),
      version: draft.currentRevision,
      updatedAt: now,
    };

    if (target.timelineSnapshot) {
      draft.masterTimeline = JSON.parse(JSON.stringify(target.timelineSnapshot));
      draft.downstreamStatus.timestampsValid = true;
    } else {
      draft.masterTimeline = null;
      draft.downstreamStatus.timestampsValid = false;
    }

    if (target.masterWavPath && fs.existsSync(target.masterWavPath)) {
      draft.masterAudio = {
        format: 'wav',
        sampleRate: 48000,
        bitDepth: 16,
        channels: 2,
        durationSeconds: target.masterDurationSeconds || 0,
        filePath: target.masterWavPath,
        sha256: target.masterSha256 || computeFileSha256(target.masterWavPath),
        renderedAt: now,
      };
    } else {
      draft.masterAudio = null;
    }

    draft.downstreamStatus.subtitlesValid = false;
    draft.downstreamStatus.videoValid = false;
    draft.downstreamStatus.approvalStatus = 'assembly_pending_review';

    this.saveDraft(draft);
    return draft;
  },

  commitMasterRender(
    draftId: string,
    masterWavPath: string,
    durationSeconds: number,
    timeline: ReconciledMasterTimeline
  ): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    const now = new Date().toISOString();
    draft.masterAudio = {
      format: 'wav',
      sampleRate: 48000,
      bitDepth: 16,
      channels: 2,
      durationSeconds,
      filePath: masterWavPath,
      sha256: computeFileSha256(masterWavPath),
      renderedAt: now,
    };

    draft.masterTimeline = timeline;
    // "Valid timing" must mean real timed words exist, not merely that a timeline object exists.
    const hasTimedWords = Boolean(timeline?.lines?.some((l: any) => l.words?.length));
    draft.downstreamStatus.timestampsValid = hasTimedWords;
    if (!hasTimedWords) {
      draft.downstreamStatus.subtitlesValid = false;
      draft.downstreamStatus.videoValid = false;
    }
    draft.downstreamStatus.approvalStatus = 'assembly_pending_review';

    // Dynamic duration matching: Part B background duration automatically matches approved master audio
    if (draft.video?.partB) {
      draft.video.partB.targetDurationSeconds = durationSeconds;
    }
    if (draft.video?.partA) {
      draft.video.partA.playbackDurationSeconds = durationSeconds;
    }

    this.saveDraft(draft);
    return draft;
  },

  deleteDraft(draftId: string): boolean {
    const dir = getDraftDir(draftId);
    if (!fs.existsSync(dir)) {
      return false;
    }

    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
      return true;
    } catch (err: any) {
      // Secondary fallback on Windows using PowerShell Remove-Item
      try {
        const { execSync } = require('node:child_process');
        execSync(`powershell -NoProfile -Command "Remove-Item -LiteralPath '${dir.replace(/'/g, "''")}' -Force -Recurse"`);
        if (!fs.existsSync(dir)) {
          return true;
        }
      } catch {}

      throw new Error(
        `Failed to delete draft ${draftId}: Files inside the draft directory may be locked by an active video render, preview stream, or playback process. Please stop any active render and try again. Details: ${err.message}`
      );
    }
  },

  clearAllDrafts(): number {
    ensureDir(BASE_DATA_DIR);
    const dirs = fs.readdirSync(BASE_DATA_DIR);
    let count = 0;
    for (const d of dirs) {
      const fullPath = path.join(BASE_DATA_DIR, d);
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          count++;
        }
      } catch {}
    }
    return count;
  },
};
