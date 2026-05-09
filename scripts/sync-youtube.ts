#!/usr/bin/env ts-node
/**
 * YouTube Metadata Synchronization Script
 *
 * This script synchronizes video metadata between the local CMS and YouTube.
 * It treats the local CMS as the source of truth.
 *
 * Usage:
 * ts-node scripts/sync-youtube.ts --all
 * ts-node scripts/sync-youtube.ts --id <youtube-video-id>
 *
 * Prerequisites:
 * 1. A Google Cloud project with the YouTube Data API v3 enabled.
 * 2. OAuth 2.0 credentials (client_id, client_secret) for an installed application.
 *    - The credentials must have the `https://www.googleapis.com/auth/youtube.upload` scope.
 * 3. A `google-auth.json` file in the project root containing the OAuth credentials.
 *    - This file should also store the refresh token once obtained.
 */

import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import { cmsServerStorage } from '../lib/cms-storage-server'; // Adjust path as needed

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = path.join(process.cwd(), 'google-auth-token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'google-auth.json');

async function loadCredentials() {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error loading credentials file:', err);
    throw new Error('Please create a google-auth.json file with your OAuth 2.0 credentials.');
  }
}

async function getAuthenticatedClient() {
  const credentials = await loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try {
    const token = await fs.readFile(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (err) {
    console.log('No existing token found. Please authenticate.');
    // In a real CLI, you would implement getAccessToken(oAuth2Client) here.
    // This would involve prompting the user to visit an auth URL and enter a code.
    throw new Error('Authentication required. This script does not yet support the interactive auth flow.');
  }

  return oAuth2Client;
}

async function syncVideo(youtubeId: string) {
  console.log(`
--- Syncing video: ${youtubeId} ---`);

  const release = cmsServerStorage.getReleaseByYoutubeId(youtubeId);
  if (!release) {
    console.log(`Video with ID ${youtubeId} not found in local CMS. Skipping.`);
    return;
  }

  const oAuth2Client = await getAuthenticatedClient();
  const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });

  try {
    // 1. Fetch current video details from YouTube
    const { data: { items } } = await youtube.videos.list({
      part: ['snippet', 'status'],
      id: [youtubeId],
    });

    if (!items || items.length === 0) {
      console.log(`Video not found on YouTube. Skipping.`);
      return;
    }

    const ytVideo = items[0];
    const snippet = ytVideo.snippet;

    // 2. Compare metadata and prepare update
    const updatePayload: any = {};
    let needsUpdate = false;

    // Compare title
    if (snippet.title !== release.title) {
      console.log(`Title differs. CMS: "${release.title}", YT: "${snippet.title}"`);
      updatePayload.title = release.title;
      needsUpdate = true;
    }

    // Compare description
    if (snippet.description !== release.description) {
      console.log(`Description differs.`);
      updatePayload.description = release.description;
      needsUpdate = true;
    }

    // Compare tags (YouTube API returns tags, CMS might not have a dedicated field)
    // For this example, we'll assume release.tags is an array of strings.
    const cmsTags = release.tags || [];
    const ytTags = snippet.tags || [];
    if (JSON.stringify(cmsTags.sort()) !== JSON.stringify(ytTags.sort())) {
      console.log(`Tags differ.`);
      updatePayload.tags = cmsTags;
      needsUpdate = true;
    }

    // 3. Perform update if needed
    if (needsUpdate) {
      console.log(`Updating metadata on YouTube...`);
      await youtube.videos.update({
        part: ['snippet'],
        requestBody: {
          id: youtubeId,
          snippet: {
            ...snippet,
            ...updatePayload,
            // You must also include the categoryId when updating
            categoryId: snippet.categoryId,
          },
        },
      });
      console.log(`✅ Successfully updated metadata for ${youtubeId}`);
    } else {
      console.log(`✅ Metadata is already in sync for ${youtubeId}`);
    }
  } catch (err: any) {
    console.error(`Failed to sync video ${youtubeId}:`, err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const allFlagIndex = args.indexOf('--all');
  const idFlagIndex = args.indexOf('--id');

  if (allFlagIndex !== -1) {
    console.log('Syncing all releases...');
    const releases = cmsServerStorage.getAllReleases();
    for (const release of releases) {
      if (release.youtubeId) {
        await syncVideo(release.youtubeId);
      }
    }
  } else if (idFlagIndex !== -1 && args[idFlagIndex + 1]) {
    const videoId = args[idFlagIndex + 1];
    await syncVideo(videoId);
  } else {
    console.log('Usage:');
    console.log('  ts-node scripts/sync-youtube.ts --all');
    console.log('  ts-node scripts/sync-youtube.ts --id <youtube-video-id>');
  }
}

main().catch(console.error);
