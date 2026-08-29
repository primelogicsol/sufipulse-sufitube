async function runAudit() {
  try {
    const res = await fetch('http://localhost:3005/api/releases');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const releases = await res.json();
    
    let total = releases.length;
    let ytLinked = 0;
    let legacy = 0;
    let profilesCompleted = 0;
    let profilesIncomplete = 0;
    let apiFailures = 0;
    let nonEmbeddable = 0;
    let regionRestricted = 0;

    let missing = {
      title: 0, description: 0, publishedAt: 0, viewCount: 0,
      language: 0, audioLanguage: 0, category: 0, captions: 0,
      recordingDate: 0, license: 0
    };

    console.log(`Auditing ${total} releases...`);

    for (const r of releases) {
      if (!r.youtubeId || r.youtubeId === '') {
        legacy++;
        continue;
      }
      ytLinked++;
      
      try {
        const metaRes = await fetch(`http://localhost:3005/api/youtube/video-metadata?youtubeId=${r.youtubeId}`);
        if (!metaRes.ok) {
          apiFailures++;
          continue;
        }
        const meta = await metaRes.json();
        
        let isComplete = true;
        if (!meta.title) { missing.title++; isComplete = false; }
        if (!meta.description) { missing.description++; isComplete = false; }
        if (!meta.publishedAt) { missing.publishedAt++; isComplete = false; }
        if (meta.viewCount === undefined) { missing.viewCount++; isComplete = false; }
        if (!meta.defaultLanguage) { missing.language++; }
        if (!meta.defaultAudioLanguage) { missing.audioLanguage++; }
        if (!meta.categoryId) { missing.category++; isComplete = false; }
        if (meta.captionsAvailable === undefined) { missing.captions++; }
        if (!meta.recordingDate) { missing.recordingDate++; }
        if (!meta.license) { missing.license++; isComplete = false; }

        if (meta.embeddable === false) nonEmbeddable++;
        if (meta.regionRestriction && (meta.regionRestriction.allowed || meta.regionRestriction.blocked)) regionRestricted++;

        if (isComplete) profilesCompleted++;
        else profilesIncomplete++;
        
      } catch (e) {
        apiFailures++;
      }
    }

    console.log("=== CATALOG AUDIT ===");
    console.log("Total releases:", total);
    console.log("YouTube-linked:", ytLinked);
    console.log("Legacy/audio:", legacy);
    console.log("Profiles completed:", profilesCompleted);
    console.log("Profiles incomplete:", profilesIncomplete);
    console.log("API failures:", apiFailures);
    console.log("Non-embeddable:", nonEmbeddable);
    console.log("Region restricted:", regionRestricted);
    console.log("Missing Stats:", missing);

  } catch(e) {
    console.error("Audit failed", e);
  }
}

runAudit();
