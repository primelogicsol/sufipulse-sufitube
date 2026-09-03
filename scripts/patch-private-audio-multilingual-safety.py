from pathlib import Path

path = Path('app/api/admin/releases/[id]/audio-alignment/route.ts')
text = path.read_text()
marker = "    let captionText: ReturnType<typeof resolveCaptionText>;\n"

if 'confirmTranslationReset' in text:
    print('multilingual safety already present')
    raise SystemExit(0)

if marker not in text:
    raise SystemExit('caption text marker not found')

block = """    const existingTranslatedLanguages = Object.entries(release.subtitleTranslations || {})
      .filter(([code, map]) =>
        normalizeLanguage(code) !== language &&
        map &&
        typeof map === 'object' &&
        Object.keys(map).length > 0
      )
      .map(([code]) => code);

    if (
      existingCueCount > 0 &&
      existingTranslatedLanguages.length > 0 &&
      body.confirmTranslationReset !== true
    ) {
      return NextResponse.json(
        {
          error:
            'This release already has translated caption tracks. Replacing master timing would invalidate their cue IDs. ' +
            'Master timing was not changed. Use a controlled translation-remap workflow, or explicitly confirm a translation reset only if those tracks may be discarded.',
          existingTranslatedLanguages,
          existingCueCount,
          imported: true,
          appliedToMasterTiming: false,
          source: adminSummary(record),
          requiresTranslationResetConfirmation: true,
        },
        { status: 409 }
      );
    }

"""

path.write_text(text.replace(marker, block + marker, 1))
print('patched multilingual timing replacement safety')
