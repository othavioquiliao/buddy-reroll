# Ink Rewrite: Interactive Mode with Persistent Preview

## Summary

Replace @clack/prompts interactive mode with Ink (React for CLI) to provide a persistent companion preview that updates in real-time as the user selects species, rarity, eye, hat, and shiny attributes. Core logic (PRNG, salt detection, binary patching) remains unchanged. Non-interactive mode remains unchanged.

## Architecture

### File Structure

```
index.js      — Entry point + core logic + non-interactive mode
ui.jsx        — Ink App component (interactive mode UI)
sprites.js    — BODIES, HAT_LINES, renderSprite, colorizeSprite (shared)
```

Rationale: JSX belongs in `.jsx` files. Sprite data (~400 lines) is shared between `index.js` (non-interactive `formatCompanionCard`) and `ui.jsx` (PreviewCard component). `package.json` `"files"` array updated to include all three.

### Dependencies

Remove:
- `@clack/prompts`
- `@clack/core`

Add:
- `ink` (React terminal renderer)
- `react` (required by Ink)
- `@inkjs/ui` (Select, ConfirmInput, Spinner components)

Keep:
- `chalk` (used by non-interactive mode's `formatCompanionCard` and `colorizeSprite`)

## sprites.js — Shared Module

Extracted from current `index.js`. Exports:

- `BODIES` — 18 species x 3 frames x 5 lines sprite data
- `HAT_LINES` — 8 hat overlay strings
- `RARITY_STARS` — `{ common: "★", ..., legendary: "★★★★★" }`
- `RARITY_COLORS` — `{ common: "white", uncommon: "greenBright", rare: "blueBright", epic: "magentaBright", legendary: "yellowBright" }`
- `renderSprite(bones, frame)` — eye substitution, hat overlay, blank-line trim
- `colorizeSprite(lines, rarity)` — apply chalk color per line (for non-interactive mode)

`RARITY_COLORS` stores color name strings (not chalk functions) so both chalk (non-interactive) and Ink `<Text color={}>` (interactive) can use them.

## ui.jsx — Ink App

### Exported Function

```js
export async function runInteractiveUI(opts)
```

`opts` contains:
- `currentRoll` — current companion bones (from current salt)
- `currentSalt` — current salt string
- `binaryPath`, `configPath`, `userId` — paths and identity
- `bruteForce(userId, target, onProgress)` — salt search (callback-based progress)
- `patchBinary(binaryPath, oldSalt, newSalt)` — binary patch
- `resignBinary(binaryPath)` — macOS codesign
- `clearCompanion(configPath)` — clear config
- `isClaudeRunning()` — process check
- `rollFrom(salt, userId)` — compute roll from salt
- `matches(roll, target)` — check if roll matches target

Returns: `{ patched: boolean }` or exits on cancel.

Uses `ink`'s `render()` with `waitUntilExit()` to run the Ink app and await completion.

Exit mechanism: Components call `useApp().exit()` from Ink to unmount the app. Cancel (Ctrl+C or user decline) and DoneStep both call `exit()`. The resolved value is communicated via a ref or closure that `runInteractiveUI` reads after `waitUntilExit()` resolves.

### Component Tree

```
<App>
  <PreviewCard />       — persistent companion preview (always visible)
  {step === "action"    && <ActionStep />}
  {step === "species"   && <SpeciesStep />}
  {step === "rarity"    && <RarityStep />}
  {step === "eye"       && <EyeStep />}
  {step === "hat"       && <HatStep />}
  {step === "shiny"     && <ShinyStep />}
  {step === "confirm"   && <ConfirmStep />}
  {step === "search"    && <SearchStep />}
  {step === "result"    && <ResultStep />}
  {step === "done"      && <DoneStep />}
</App>
```

### App State

```js
const [step, setStep] = useState("action");
const [species, setSpecies] = useState(currentRoll.species);
const [rarity, setRarity] = useState(currentRoll.rarity);
const [eye, setEye] = useState(currentRoll.eye);
const [hat, setHat] = useState(currentRoll.hat);
const [shiny, setShiny] = useState(currentRoll.shiny);
```

Each setter triggers React re-render → PreviewCard updates instantly.

### PreviewCard Component

Renders current selection as sprite + metadata side-by-side:

```jsx
<Box flexDirection="column" borderStyle="round" borderColor={rarityColor}>
  <Box>
    <Text color={rarityColor}>{spriteText}</Text>
    <Box flexDirection="column" marginLeft={2}>
      <Text>{species} / {rarity}{shiny ? " / shiny" : ""}</Text>
      <Text dimColor>eye:{eye} / hat:{hat}</Text>
      <Text>{stars}</Text>
    </Box>
  </Box>
</Box>
```

- `spriteText` = `renderSprite({ species, eye, hat }).join("\n")`
- `rarityColor` = `RARITY_COLORS[rarity]`
- `stars` = `RARITY_STARS[rarity]`
- Stat bars are NOT shown during selection (stats depend on brute-forced salt, not chosen yet)
- Stat bars shown only in ResultStep after search completes

### Step Components

**ActionStep** — Initial action selection (reroll / restore / show current):
- Uses `<Select>` from `@inkjs/ui`
- "Show current" → display current roll card with stats, then exit
- "Restore" → restore backup, exit
- "Reroll" → proceed to species step

**SpeciesStep** — Left/right arrow key browsing:
- `useInput` hook: left/right arrows change species index
- Up/down arrows also supported (same behavior)
- Counter text: `"duck (1/18)"`
- Hint text: `"← → navigate / enter select"`
- Enter confirms → next step

**RarityStep** — `<Select>` with 5 rarity options:
- Labels include weight: `"Common (60%)"`, etc.
- `onChange` updates rarity state → PreviewCard color changes instantly
- Enter confirms → next step (skip HatStep if common)

**EyeStep** — `<Select>` with 6 eye options:
- Labels show the eye character: `"·"`, `"✦"`, etc.
- `onChange` updates eye → PreviewCard eyes change

**HatStep** — `<Select>` with 8 hat options:
- Skipped entirely if rarity is "common" (common always gets hat=none)
- `onChange` updates hat → PreviewCard hat appears

**ShinyStep** — `<ConfirmInput>`:
- "Shiny?" yes/no
- Updates shiny state

**ConfirmStep** — Final confirmation before search:
- Shows target summary
- Checks if Claude Code is running (warning if so)
- `<ConfirmInput>` to proceed or cancel

**SearchStep** — Brute-force salt search:
- Runs `bruteForce()` in background
- Shows `<Spinner>` with progress: "5M salts checked (2.3s)"
- `bruteForce` calls `onProgress(checked, elapsed)` callback for updates
- On success → ResultStep with found salt and roll
- On failure → error message and exit

**ResultStep** — Show result with full stats:
- PreviewCard now shows the ACTUAL result (not target, but real roll from found salt)
- Stat bars displayed (stats are now known)
- `<ConfirmInput>` to apply patch or cancel

**DoneStep** — Post-patch summary:
- "Patched N occurrence(s)"
- "Binary re-signed"
- "Companion data cleared"
- "Restart Claude Code and run /buddy"
- Exit

## index.js Changes

### Remove
- `import * as p from "@clack/prompts"`
- `import { Prompt, isCancel } from "@clack/core"`
- `browseSpecies()` function
- `formatRoll()` (already replaced by `formatCompanionCard`)
- `S_BAR`, `S_BAR_END`, `S_DIAMOND`, `S_DIAMOND_OPEN` constants

### Move to sprites.js
- `RARITY_STARS`, `RARITY_CHALK` (renamed to `RARITY_COLORS`), `HAT_LINES`, `BODIES`
- `renderSprite()`, `colorizeSprite()`

### Keep in index.js
- Shebang, imports (fs, path, os, etc.)
- All constants (RARITIES, SPECIES, EYES, HATS, etc.)
- PRNG functions (mulberry32, hashString, pick, rollRarity, rollFrom)
- Path detection (findBinaryPath, findConfigPath, getUserId)
- Salt detection (findCurrentSalt)
- Brute-force (bruteForce) — modified to accept `onProgress` callback
- Binary patch (patchBinary, resignBinary, clearCompanion)
- `isClaudeRunning()`
- `matches()`
- `formatCompanionCard()` — for non-interactive mode (imports from sprites.js)
- Non-interactive mode (nonInteractiveMode)
- Main function

### Modify
- `interactiveMode()` → replaced with call to `runInteractiveUI()` from ui.jsx
- `bruteForce()` — add optional `onProgress` callback parameter for Ink Spinner updates. The existing spinner parameter is removed (was @clack/prompts spinner). `onProgress(checked, elapsed)` is called every 5M iterations.
- `formatCompanionCard()` — import renderSprite/colorizeSprite from sprites.js instead of local

## Non-interactive Mode

No changes except `formatCompanionCard` now imports sprite functions from `sprites.js`.

## package.json Changes

```json
{
  "files": ["index.js", "ui.jsx", "sprites.js"],
  "dependencies": {
    "chalk": "^5.6.2",
    "ink": "^6.0.0",
    "react": "^19.0.0",
    "@inkjs/ui": "^2.0.0"
  }
}
```

Remove `@clack/prompts` from dependencies.
