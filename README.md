# Brady Haftarah Trainer

An interactive, static haftarah trainer for **I Kings 7:40–45**, patterned after the Brady Torah trainer.

Open `index.html` directly, or serve the folder locally. To publish with GitHub Pages, enable Pages for the repository's main branch.

- Select words in one verse to save a phrase.
- Select a highlighted phrase to record or play it, or hover over it to play its saved recording.
- Select a verse number to play its recorded phrases in order.
- Phrase groupings and recordings are shared through dedicated tables and a dedicated Storage bucket in the `bnaimitzvah` Supabase project.
- Recording requests 48 kHz mono audio, disables browser voice processing where supported, and preserves a short tail so final syllables are not clipped.
- Verse playback trims 120 ms from that safety tail between phrases for a tighter cadence.
