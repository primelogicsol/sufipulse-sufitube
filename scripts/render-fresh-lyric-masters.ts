import { renderMasterVideoForDraft } from '../server/services/master-video-service';

async function main() {
  console.log('--- Rendering Landscape Lyric Master (16:9) ---');
  const landscapeRes = await renderMasterVideoForDraft('draft_1794752884539_0eb391d5', {
    format: 'lyric_master',
    orientation: 'landscape',
  });
  console.log('Landscape rendered successfully:', landscapeRes.outputPath, `${landscapeRes.durationSeconds}s`);

  console.log('--- Rendering Portrait Lyric Master (9:16) ---');
  const portraitRes = await renderMasterVideoForDraft('draft_1794752884539_0eb391d5', {
    format: 'lyric_master',
    orientation: 'portrait',
  });
  console.log('Portrait rendered successfully:', portraitRes.outputPath, `${portraitRes.durationSeconds}s`);
}

main().catch(err => {
  console.error('Render error:', err);
  process.exit(1);
});
