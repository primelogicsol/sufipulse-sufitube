export function applyCanonicalLyricsWorkflow(existingLyrics: any, incomingLyrics: any, actorId: string, now: string) {
  if (!incomingLyrics) return undefined;

  delete incomingLyrics.reviewedAt;
  delete incomingLyrics.reviewedBy;
  delete incomingLyrics.approvedAt;
  delete incomingLyrics.approvedBy;

  if (!incomingLyrics.languages || !Array.isArray(incomingLyrics.languages)) {
    incomingLyrics.languages = [];
  }
  if (!incomingLyrics.primaryLanguage) {
    incomingLyrics.primaryLanguage = 'ur';
  }
  const langSet = new Set(incomingLyrics.languages);
  langSet.add(incomingLyrics.primaryLanguage);
  incomingLyrics.languages = Array.from(langSet);

  const oldL = existingLyrics;
  const newL = incomingLyrics;

  const isNewLyrics = !oldL;
  const textChanged = oldL && oldL.text !== newL.text;
  const primaryLangChanged = oldL && oldL.primaryLanguage !== newL.primaryLanguage;
  
  const oldLangsStr = oldL ? JSON.stringify([...(oldL.languages || [])].sort()) : '';
  const newLangsStr = JSON.stringify([...newL.languages].sort());
  const langsChanged = oldL && oldLangsStr !== newLangsStr;

  const contentChanged = isNewLyrics || textChanged || primaryLangChanged || langsChanged;

  if (contentChanged) {
    newL.status = 'DRAFT';
  } else if (oldL) {
    if (oldL.status === 'DRAFT' && newL.status === 'REVIEWED') {
      newL.reviewedAt = now;
      newL.reviewedBy = actorId;
    } else if (oldL.status === 'REVIEWED' && newL.status === 'APPROVED') {
      newL.reviewedAt = oldL.reviewedAt; 
      newL.reviewedBy = oldL.reviewedBy; 
      newL.approvedAt = now;
      newL.approvedBy = actorId;
    } else if (newL.status === oldL.status) {
      if (oldL.reviewedAt) newL.reviewedAt = oldL.reviewedAt;
      if (oldL.reviewedBy) newL.reviewedBy = oldL.reviewedBy;
      if (oldL.approvedAt) newL.approvedAt = oldL.approvedAt;
      if (oldL.approvedBy) newL.approvedBy = oldL.approvedBy;
    } else if (newL.status === 'DRAFT') {
       // Explicit demotion
    } else {
      newL.status = oldL.status;
      if (oldL.reviewedAt) newL.reviewedAt = oldL.reviewedAt;
      if (oldL.reviewedBy) newL.reviewedBy = oldL.reviewedBy;
      if (oldL.approvedAt) newL.approvedAt = oldL.approvedAt;
      if (oldL.approvedBy) newL.approvedBy = oldL.approvedBy;
    }
  }

  return newL;
}
