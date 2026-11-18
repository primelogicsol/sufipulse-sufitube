import { renderMasterVideoForDraft } from '../server/services/master-video-service';

async function main() {
  const draftId = 'draft_1794752884539_0eb391d5';
  console.log('Rendering Landscape Lyric...');
  const res1 = await renderMasterVideoForDraft(draftId, { format: 'lyric_master', orientation: 'landscape' });
  console.log('Landscape Lyric result:', res1.verified, res1.outputPath);

  console.log('Rendering Portrait Lyric...');
  const res2 = await renderMasterVideoForDraft(draftId, { format: 'lyric_master', orientation: 'portrait' });
  console.log('Portrait Lyric result:', res2.verified, res2.outputPath);
}

main().catch(err => {
  console.error('Render error:', err);
  process.exit(1);
});
