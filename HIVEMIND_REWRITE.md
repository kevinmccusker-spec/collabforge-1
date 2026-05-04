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
(to be filled in next, together)

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
