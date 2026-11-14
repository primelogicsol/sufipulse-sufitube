# SufiPulse USA organic distribution engine

This is a scalable **campaign compiler**, not an unauthorized social-account bot. It turns existing full-length SufiPulse YouTube recordings into scheduled drafts for owned/authorized accounts and opt-in communities. It does not make any posts, drive automated playback, fake likes, or impersonate people.

## Run

```bash
node scripts/distribution/build-organic-campaign.mjs --input /path/to/current-release-export.json --out ./distribution-output --days 30 --start 2026-11-16
```

The input is either a JSON array or `{ "releases": [...] }`, `{ "data": { "releases": [...] } }`, or `{ "items": [...] }`. Each item needs `title`, `youtubeId` or `youtube_video_id` (YouTube URL also accepted), and `status: "published"`. Draft/unpublished material is excluded. The checked-in `.data/cms-releases.json` can be empty; use the **runtime export** when it is.

Generated outputs:

- `organic-publishing-queue.csv`: date, platform, full YouTube watch URL, theme, platform-specific copy, permission and approval state
- `normalized-full-song-catalog.json`: deduplicated and normalized original song IDs
- `campaign-summary.json`: exact counts by platform

All resulting messages are **drafts**, not sent. Import the queue into a scheduler for authorized social accounts, and use a manually approved partner workflow for community placements.

## Publication adapters required before live use

1. Facebook Pages: Meta Graph API with page access token, page-management permissions and API rate limits.
2. Instagram professional accounts: Meta Instagram publishing capabilities; direct full-length YouTube links in captions may not be clickable, so test channel/profile link and never promise cross-platform view transfers.
3. Threads: authorized API publishing, subject to current platform restrictions.
4. WhatsApp Business: approved messaging templates where required, lawful recipient opt-in, STOP handling and messaging rate limits. Never message scraped phone numbers.
5. Community partners: opt-in, admin-approved distribution; do not publish to third-party accounts without explicit authorization.

Store OAuth tokens server-side with encryption and rotation. Use auditable queues with dedupe keys `{channel}:{videoId}:{date}`, per-platform daily caps, retry with backoff, and a permanent suppression list for unsubscribed recipients. Do not add passwords, access tokens or personal recipient lists to GitHub.

## Measurement

Baseline from the connected YouTube Brand Account (91052), Oct 15–Nov 13, 2026: 360 views; Related Video 22; YouTube Search 94; Srinagar city report 13 views. These are reports with geographic and surface limitations, not proof of suppression.

Compare 14- and 30-day actual YouTube Analytics:
- external source referrals attributable to each authorized channel;
- YouTube Suggested Video and Browse traffic independently (they are not the same as website clicks);
- watch time and average view percentage by recording;
- India and Srinagar reporting, with privacy/aggregation caveats;
- subscriber changes, organic shares and opt-outs.

Exclude bots, incentivized/artificial engagement, autoplay loops and spam. Do not promise algorithm ranking or recommendations.

## Rollout sequence

**Stage A:** Run the compiler from a current CMS export, inspect all titles and URLs, and confirm only public existing full songs are included.

**Stage B:** Connect publishing accounts and implement the platform adapters with security, consent and policy checks.

**Stage C:** Enable a capped pilot, record delivery and engagement, then expand only on measured real audience response.

This branch deliberately does not edit any frozen release records, run automatic social publishing, or alter the existing studio workflow.
