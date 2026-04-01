# Sprite Preview for buddy-reroll CLI

## Summary

Add ASCII sprite preview rendering to buddy-reroll so users can visually see their companion before and after rerolling. Sprites are ported from Claude Code's `src/buddy/sprites.ts` and colorized per rarity using `chalk`.

## Scope

Three integration points in the existing CLI:

1. **Current companion display** -- show sprite card when viewing current companion
2. **Species selection** -- sequential browsing with sprite preview during interactive mode
3. **New companion display** -- show sprite card for the reroll result

## Data

### Sprite Data (from Claude Code `sprites.ts`)

- `BODIES`: 18 species, each with 3 animation frames, each frame is 5 lines x 12 chars wide
- `HAT_LINES`: 8 hat types, each a single 12-char string
- Eyes use `{E}` placeholder in sprite strings, replaced at render time
- Only frame 0 is used (no animation in CLI context)

### Rarity Colors (from Claude Code dark ANSI theme)

Mapped via `chalk` to match Claude Code's `RARITY_COLORS` -> dark ANSI theme:

| Rarity    | Theme key    | chalk              |
|-----------|--------------|--------------------|
| common    | inactive     | `chalk.white`      |
| uncommon  | success      | `chalk.greenBright` |
| rare      | permission   | `chalk.blueBright`  |
| epic      | autoAccept   | `chalk.magentaBright` |
| legendary | warning      | `chalk.yellowBright` |

## Functions

### `renderSprite(bones, frame = 0) -> string[]`

Ported directly from Claude Code. Logic:
1. Look up `BODIES[species][frame]`
2. Replace all `{E}` with `bones.eye`
3. If `bones.hat !== 'none'` and line 0 is blank, replace line 0 with `HAT_LINES[hat]`
4. If line 0 is blank and ALL frames have blank line 0, drop it (avoid wasted row)
5. Return array of strings

### `colorizeSprite(lines, rarity) -> string[]`

Apply rarity color to each line using chalk.

### `formatCompanionCard(result) -> string`

Replaces existing `formatRoll()`. Renders a side-by-side layout:

```
   /^\  /^\       dragon / rare
  <  *  *  >     eye:* / hat:crown
  (   ~~   )     ★★★
   `-vvvv-´
  DEBUGGING  ████████░░  80
  PATIENCE   ████░░░░░░  40
  CHAOS      ██████░░░░  60
  WISDOM     █████████░  90
  SNARK      ███░░░░░░░  30
```

Left side: colorized sprite (rarity color). Right side: metadata + rarity stars.
Below sprite: stat bars (also rarity-colored).

Displayed via `p.note()` for both "Current companion" and "New companion".

### Rarity Stars

Ported from `RARITY_STARS` in types.ts:

```
common: ★, uncommon: ★★, rare: ★★★, epic: ★★★★, legendary: ★★★★★
```

## Species Selection UX

Replace `p.select()` for species with a sequential browse loop:

```
loop:
  1. Render sprite of SPECIES[currentIndex] with current eye (default) via p.note()
  2. p.select() with options:
     - "Yes, pick this one"
     - "Next species"  
     - "Previous species"
     - "Jump to..." (opens p.select with full species list)
  3. On "Yes" -> return species
  4. On "Next" -> currentIndex = (currentIndex + 1) % 18, continue loop
  5. On "Previous" -> currentIndex = (currentIndex - 1 + 18) % 18, continue loop
  6. On "Jump to..." -> p.select() full list, set currentIndex, continue loop
  7. On cancel -> exit
```

- Starts at `currentIndex = indexOf(currentRoll.species)` (user's current species)
- Shows `speciesName (N/18)` in the note title
- Sprite rendered with a default eye (`·`) and no hat during browsing (final eye/hat chosen later)

## Shiny

Shiny has no visual sprite effect (consistent with Claude Code CLI). Displayed as text label only in the metadata section of the card (e.g., `shiny` appended to the attribute line).

## Non-interactive Mode

`formatCompanionCard()` used for both `--current` output and search result output. Same card layout, but without `p.note()` wrapper -- just `console.log()`.

## Dependency

Add `chalk` to `package.json` dependencies:

```json
"chalk": "^5.4.0"
```

## Changes Summary

| File      | Change |
|-----------|--------|
| index.js  | Add BODIES, HAT_LINES, RARITY_STARS, RARITY_CHALK constants |
| index.js  | Add renderSprite(), colorizeSprite(), formatCompanionCard() |
| index.js  | Replace formatRoll() calls with formatCompanionCard() |
| index.js  | Replace species p.select() with sequential browse loop |
| package.json | Add chalk dependency |
