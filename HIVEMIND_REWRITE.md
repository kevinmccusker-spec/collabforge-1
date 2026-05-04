# CollabForge: Hive Mind Rewrite Spec

## Philosophy

CollabForge is Leonard Cohen's Tower of Song made real — a Greenwich 
Village coffeehouse for unfinished songs. Originators release their 
work to the human hive mind. Anyone can build from any version. 
Chains track lineage. Engagement filters quality. No approval gates 
after the initial upload.

The platform serves any stage of the songwriting process: sketches, 
AI experiments, half-finished demos, polished works seeking covers, 
lyrics looking for music. Comments, lyric suggestions, and craft 
feedback are first-class features. Some songs get finished by others. 
Some get the feedback the artist needs to finish themselves.

All work is welcome — human-made, AI-assisted, hybrid — with honest 
disclosure of AI tool use. The community decides what resonates 
through engagement.

## Core Model

### Upload Types
- Audio (demo, sketch, or finished version)
- Lyrics / poem (with optional "needs music" tag)

### AI Disclosure (required at upload)
- Human-made
- AI-assisted (some AI tools used)
- Pure AI (primarily AI-generated)

### The Chain
- Originator (A) is always at the root of every chain descending from their work
- Any contributor can build from any existing version (no approval needed)
- The chain records lineage: A → B → C → D, etc.
- Chains can branch infinitely from any node
- Each version stores a parent_version_id; originals have no parent

### Splits
- Equal split among all chain members for any given version
- 2-person chain: 50/50
- 3-person chain: 33/33/33
- 4-person chain: 25/25/25/25
- A is always included in every downstream chain

### Contribution Notes
- Each contributor adds a short note describing what they did
- Examples: "added vocals," "rewrote bridge," "electronic remix," 
  "set lyrics to music"
- Displayed on the placard alongside name and split

### No Approvals
- Originator uploads and is done — no babysitting
- All derivative versions go live immediately
- Plays, likes, and comments are the quality filter
- Bad versions stay visible (history matters) but fade from attention
- Good versions rise through engagement

### Community Enforcement
- Placard is the source of truth for splits and lineage
- Honest AI disclosure is the social contract
- Community calls out bad-faith actors via comments
- No platform refereeing of disputes

## Data Model Changes
## Data Model Changes

### `songs` table

**Remove:**
- `split_offer` (no more 10-50% selection at upload)
- `is_complete` (no more "Mark Complete" — no approval gates)

**Add:**
- `ai_disclosure` enum: `'human_made'`, `'ai_assisted'`, `'pure_ai'` — required at upload
- `content_type` enum: `'audio'`, `'lyrics'` — supports lyrics-as-seed uploads
- `lyrics_text` text (nullable) — populated when `content_type = 'lyrics'`
- `needs_music` boolean (default false) — true when lyrics are looking for a melody

### `versions` table

**Remove:**
- `approved` (no approvals)
- `approved_at` (no approvals)
- Any other approval-related columns or state

**Add:**
- `parent_version_id` (foreign key to `versions.id`, nullable) — null when built directly from the original song; populated when built from another version
- `parent_song_id` (foreign key to `songs.id`, required) — always points to the root song A
- `ai_disclosure` enum: `'human_made'`, `'ai_assisted'`, `'pure_ai'` — required at upload
- `contribution_notes` text — short description of what this contributor did 
  (e.g., "added vocals," "rewrote bridge," "electronic remix")

### `comments` table

No structural changes. Comments remain keyed to `song_id`. One unified thread 
per song covers conversation about the original and all derivative versions.

### `version_likes` table

No structural changes. Likes per version drive the engagement filter — 
most-liked versions surface to the top of a song's chain.

### `lyric_suggestions` table

Already exists from prior session. May be deprecated once lyrics-as-uploads 
are first-class via `songs.content_type = 'lyrics'`. Decide during migration 
whether to keep, merge, or drop.

### Migration Notes

- Pre-launch with no real user data: schema changes can be applied directly 
  without complex data migration
- All approval-related columns can be dropped cleanly
- `lyrics_suggestions` table may be retired or merged into `comments` / `songs`
- RLS policies for approve/reject can be removed entirely
- New RLS policies needed for: 
  - Anyone can insert a version with any `parent_version_id` or `parent_song_id` 
    (no approval needed)
  - Original artist can edit their own song's metadata only, not derivative versions
  - Comments remain world-readable, authenticated-write

### Chain Walking

The chain is computed on read, not stored. To assemble the placard for any 
version, walk backward via `parent_version_id` until reaching null, then 
the chain root is the original song (referenced via `parent_song_id`).

A version's full chain = [original song A] + [all ancestor versions] + [this version]

Equal split is calculated from chain length: `1 / chain.length` per member.

## UI Changes
(to be filled in next)

## Files to Change
(to be filled in next)

## Build Order
See logical phases:
1. Foundation: spec, schema, remove approval machinery
2. Core Logic: chain walker, split calculator, placard generator
3. Upload Flow: new upload form, "build from this version" action
4. Display: version display with disclosure, engagement sort
5. Polish: ToS, marketing copy, seed catalog

## ToS / Copy Updates
- Placard is source of truth for splits
- Honest AI disclosure required, community-enforced
- Platform records lineage, does not enforce or arbitrate
- Mechanical licenses for covers of copyrighted material 
  are uploader's responsibility
- 18+ or parental consent for accounts
- DMCA agent registered, takedowns processed promptly

## Seeding Plan
- Founder catalog: phone recordings + Suno-finished versions, 
  fully disclosed, demonstrating the chain from day one
- A few lyrics-only uploads to seed the lyrics garden
- Mix of stages: rough demos, polished tracks, AI-assisted, 
  human-only — show the platform's full range
