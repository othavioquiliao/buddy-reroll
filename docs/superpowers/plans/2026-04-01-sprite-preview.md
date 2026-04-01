# Sprite Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ASCII sprite preview rendering to buddy-reroll so users can see their companion visually before and after rerolling.

**Architecture:** Port sprite data and render logic from Claude Code's `src/buddy/sprites.ts` into `index.js`. Add `chalk` for rarity-based colorization. Replace `formatRoll()` with `formatCompanionCard()` that shows sprite + metadata side-by-side. Replace species `p.select()` with sequential browse loop showing sprites.

**Tech Stack:** Bun, @clack/prompts, chalk 5.x

---

### Task 1: Add chalk dependency

**Files:**
- Modify: `package.json:27-29`
- Modify: `index.js:8`

- [ ] **Step 1: Install chalk**

Run: `cd /Users/kang/Project/buddy-reroll && bun add chalk`
Expected: chalk added to package.json dependencies and bun.lock updated

- [ ] **Step 2: Add chalk import to index.js**

Add after the existing `@clack/prompts` import at line 8:

```js
import chalk from "chalk";
```

- [ ] **Step 3: Verify import works**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js --help`
Expected: Help text prints without errors

- [ ] **Step 4: Commit**

```bash
cd /Users/kang/Project/buddy-reroll
git add package.json bun.lock index.js
git commit -m "feat: add chalk dependency for sprite colorization"
```

---

### Task 2: Add sprite data constants

**Files:**
- Modify: `index.js` (add after existing constants block, ~line 33)

- [ ] **Step 1: Add RARITY_STARS and RARITY_CHALK constants**

Insert after the `RARITY_LABELS` block (after line 41):

```js
const RARITY_STARS = {
  common: "\u2605",
  uncommon: "\u2605\u2605",
  rare: "\u2605\u2605\u2605",
  epic: "\u2605\u2605\u2605\u2605",
  legendary: "\u2605\u2605\u2605\u2605\u2605",
};

const RARITY_CHALK = {
  common: chalk.white,
  uncommon: chalk.greenBright,
  rare: chalk.blueBright,
  epic: chalk.magentaBright,
  legendary: chalk.yellowBright,
};
```

- [ ] **Step 2: Add HAT_LINES constant**

Insert after `RARITY_CHALK`:

```js
const HAT_LINES = {
  none: "",
  crown: "   \\^^^/    ",
  tophat: "   [___]    ",
  propeller: "    -+-     ",
  halo: "   (   )    ",
  wizard: "    /^\\     ",
  beanie: "   (___)    ",
  tinyduck: "    ,>      ",
};
```

- [ ] **Step 3: Add BODIES constant**

Insert after `HAT_LINES`. This is the full 18-species sprite data ported from Claude Code's `sprites.ts`. Each species has 3 frames, each frame is 5 lines of 12 chars. Only frame 0 is used at render time, but all frames are included to preserve the `renderSprite` line-0-blank check across all frames.

```js
const BODIES = {
  duck: [
    ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--\u00b4    "],
    ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--\u00b4~   "],
    ["            ", "    __      ", "  <({E} )___  ", "   (  .__>  ", "    `--\u00b4    "],
  ],
  goose: [
    ["            ", "     ({E}>    ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
    ["            ", "    ({E}>     ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
    ["            ", "     ({E}>>   ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
  ],
  blob: [
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (      )  ", "   `----\u00b4   "],
    ["            ", "  .------.  ", " (  {E}  {E}  ) ", " (        ) ", "  `------\u00b4  "],
    ["            ", "    .--.    ", "   ({E}  {E})   ", "   (    )   ", "    `--\u00b4    "],
  ],
  cat: [
    ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  \u03c9  )   ", '  (")_(")   '],
    ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  \u03c9  )   ", '  (")_(")~  '],
    ["            ", "   /\\-/\\    ", "  ( {E}   {E})  ", "  (  \u03c9  )   ", '  (")_(")   '],
  ],
  dragon: [
    ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-\u00b4  "],
    ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (        ) ", "  `-vvvv-\u00b4  "],
    ["   ~    ~   ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-\u00b4  "],
  ],
  octopus: [
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  \\/\\/\\/\\/  "],
    ["     o      ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
  ],
  owl: [
    ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   `----\u00b4   "],
    ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   .----.   "],
    ["            ", "   /\\  /\\   ", "  (({E})(-))  ", "  (  ><  )  ", "   `----\u00b4   "],
  ],
  penguin: [
    ["            ", "  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---\u00b4     "],
    ["            ", "  .---.     ", "  ({E}>{E})     ", " |(   )|    ", "  `---\u00b4     "],
    ["  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---\u00b4     ", "   ~ ~      "],
  ],
  turtle: [
    ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "  ``    ``  "],
    ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "   ``  ``   "],
    ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[======]\\ ", "  ``    ``  "],
  ],
  snail: [
    ["            ", " {E}    .--.  ", "  \\  ( @ )  ", "   \\_`--\u00b4   ", "  ~~~~~~~   "],
    ["            ", "  {E}   .--.  ", "  |  ( @ )  ", "   \\_`--\u00b4   ", "  ~~~~~~~   "],
    ["            ", " {E}    .--.  ", "  \\  ( @  ) ", "   \\_`--\u00b4   ", "   ~~~~~~   "],
  ],
  ghost: [
    ["            ", "   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  ~`~``~`~  "],
    ["            ", "   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  `~`~~`~`  "],
    ["    ~  ~    ", "   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  ~~`~~`~~  "],
  ],
  axolotl: [
    ["            ", "}~(______)~{", "}~({E} .. {E})~{", "  ( .--. )  ", "  (_/  \\_)  "],
    ["            ", "~}(______){~", "~}({E} .. {E}){~", "  ( .--. )  ", "  (_/  \\_)  "],
    ["            ", "}~(______)~{", "}~({E} .. {E})~{", "  (  --  )  ", "  ~_/  \\_~  "],
  ],
  capybara: [
    ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------\u00b4  "],
    ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   Oo   ) ", "  `------\u00b4  "],
    ["    ~  ~    ", "  u______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------\u00b4  "],
  ],
  cactus: [
    ["            ", " n  ____  n ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
    ["            ", "    ____    ", " n |{E}  {E}| n ", " |_|    |_| ", "   |    |   "],
    [" n        n ", " |  ____  | ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
  ],
  robot: [
    ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------\u00b4  "],
    ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ -==- ]  ", "  `------\u00b4  "],
    ["     *      ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------\u00b4  "],
  ],
  rabbit: [
    ["            ", "   (\\__/)   ", "  ( {E}  {E} )  ", " =(  ..  )= ", '  (")__(")  '],
    ["            ", "   (|__/)   ", "  ( {E}  {E} )  ", " =(  ..  )= ", '  (")__(")  '],
    ["            ", "   (\\__/)   ", "  ( {E}  {E} )  ", " =( .  . )= ", '  (")__(")  '],
  ],
  mushroom: [
    ["            ", " .-o-OO-o-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
    ["            ", " .-O-oo-O-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
    ["   . o  .   ", " .-o-OO-o-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
  ],
  chonk: [
    ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------\u00b4  "],
    ["            ", "  /\\    /|  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------\u00b4  "],
    ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------\u00b4~ "],
  ],
};
```

- [ ] **Step 4: Verify no syntax errors**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js --help`
Expected: Help text prints without errors

- [ ] **Step 5: Commit**

```bash
cd /Users/kang/Project/buddy-reroll
git add index.js
git commit -m "feat: add sprite data constants (BODIES, HAT_LINES, RARITY_STARS, RARITY_CHALK)"
```

---

### Task 3: Add renderSprite and colorizeSprite functions

**Files:**
- Modify: `index.js` (add after the new constants, before the `// ── PRNG` section)

- [ ] **Step 1: Add renderSprite function**

Insert after the BODIES constant:

```js
function renderSprite(bones, frame = 0) {
  const frames = BODIES[bones.species];
  const body = frames[frame % frames.length].map((line) => line.replaceAll("{E}", bones.eye));
  const lines = [...body];
  if (bones.hat !== "none" && !lines[0].trim()) {
    lines[0] = HAT_LINES[bones.hat];
  }
  if (!lines[0].trim() && frames.every((f) => !f[0].trim())) lines.shift();
  return lines;
}
```

- [ ] **Step 2: Add colorizeSprite function**

Insert after `renderSprite`:

```js
function colorizeSprite(lines, rarity) {
  const colorFn = RARITY_CHALK[rarity] ?? chalk.white;
  return lines.map((line) => colorFn(line));
}
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js --help`
Expected: Help text prints without errors. The new functions exist but aren't called yet.

- [ ] **Step 4: Commit**

```bash
cd /Users/kang/Project/buddy-reroll
git add index.js
git commit -m "feat: add renderSprite and colorizeSprite functions"
```

---

### Task 4: Replace formatRoll with formatCompanionCard

**Files:**
- Modify: `index.js:284-292` (replace `formatRoll` function)

- [ ] **Step 1: Replace formatRoll with formatCompanionCard**

Replace the entire `formatRoll` function (lines 284-292) with:

```js
function formatCompanionCard(result) {
  const sprite = renderSprite({ species: result.species, eye: result.eye, hat: result.hat });
  const colored = colorizeSprite(sprite, result.rarity);
  const colorFn = RARITY_CHALK[result.rarity] ?? chalk.white;
  const stars = RARITY_STARS[result.rarity] ?? "";

  const meta = [];
  meta.push(`${result.species} / ${result.rarity}${result.shiny ? " / shiny" : ""}`);
  meta.push(`eye:${result.eye} / hat:${result.hat}`);
  meta.push(stars);

  const lines = [];
  const spriteWidth = 14;
  for (let i = 0; i < colored.length; i++) {
    const right = meta[i] ?? "";
    lines.push(`  ${colored[i]}${" ".repeat(Math.max(0, spriteWidth - sprite[i].length))}${right}`);
  }

  for (const [k, v] of Object.entries(result.stats)) {
    const bar = colorFn("\u2588".repeat(Math.round(v / 10)) + "\u2591".repeat(10 - Math.round(v / 10)));
    lines.push(`  ${k.padEnd(10)} ${bar} ${String(v).padStart(3)}`);
  }

  return lines.join("\n");
}
```

- [ ] **Step 2: Update all formatRoll call sites to formatCompanionCard**

There are 4 call sites. Find-and-replace each `formatRoll(` with `formatCompanionCard(`:

1. In `interactiveMode`, the "Current companion" note: `p.note(formatCompanionCard(currentRoll), "Current companion");`
2. In `interactiveMode`, the "New companion" note: `p.note(formatCompanionCard(found.result), "New companion");`
3. In `nonInteractiveMode`, the `--current` output: `console.log(formatCompanionCard(result));`
4. In `nonInteractiveMode`, the search result output: `console.log(formatCompanionCard(found.result));`

- [ ] **Step 3: Verify current companion display**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js --current`
Expected: Companion displayed with ASCII sprite on the left, metadata on the right, colored stat bars below. No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/kang/Project/buddy-reroll
git add index.js
git commit -m "feat: replace formatRoll with formatCompanionCard showing sprite preview"
```

---

### Task 5: Add species browse loop

**Files:**
- Modify: `index.js` — replace the species `p.select()` block in `interactiveMode` (lines 336-345)

- [ ] **Step 1: Add browseSpecies helper function**

Insert before the `interactiveMode` function:

```js
async function browseSpecies(startSpecies) {
  let idx = SPECIES.indexOf(startSpecies);
  if (idx === -1) idx = 0;

  while (true) {
    const species = SPECIES[idx];
    const sprite = renderSprite({ species, eye: "\u00b7", hat: "none" });
    const colored = colorizeSprite(sprite, "common");
    p.note(colored.join("\n"), `${species} (${idx + 1}/${SPECIES.length})`);

    const action = await p.select({
      message: "Select this species?",
      options: [
        { value: "yes", label: "Yes, pick this one" },
        { value: "next", label: "Next species \u2192" },
        { value: "prev", label: "\u2190 Previous species" },
        { value: "jump", label: "Jump to..." },
      ],
    });
    if (p.isCancel(action)) return null;

    if (action === "yes") return species;
    if (action === "next") { idx = (idx + 1) % SPECIES.length; continue; }
    if (action === "prev") { idx = (idx - 1 + SPECIES.length) % SPECIES.length; continue; }
    if (action === "jump") {
      const picked = await p.select({
        message: "Jump to species",
        options: SPECIES.map((s, i) => ({
          value: i,
          label: s,
          hint: s === SPECIES[idx] ? "current" : undefined,
        })),
        initialValue: idx,
      });
      if (p.isCancel(picked)) return null;
      idx = picked;
    }
  }
}
```

- [ ] **Step 2: Replace species p.select in interactiveMode**

Replace lines 336-345 (the species select block):

```js
  const species = await p.select({
    message: "Species",
    options: SPECIES.map((s) => ({
      value: s,
      label: s,
      hint: s === currentRoll.species ? "current" : undefined,
    })),
    initialValue: currentRoll.species,
  });
  if (p.isCancel(species)) { p.cancel(); process.exit(0); }
```

With:

```js
  const species = await browseSpecies(currentRoll.species);
  if (species === null) { p.cancel(); process.exit(0); }
```

- [ ] **Step 3: Verify interactive species browsing**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js`
Expected:
1. Current companion shows with sprite card
2. Select "Reroll companion"
3. Species browser shows ASCII sprite with `speciesName (N/18)` title
4. "Next species" cycles forward, "Previous species" cycles backward
5. "Jump to..." shows full list
6. "Yes, pick this one" proceeds to rarity selection

- [ ] **Step 4: Commit**

```bash
cd /Users/kang/Project/buddy-reroll
git add index.js
git commit -m "feat: add species browse loop with sprite preview"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Verify --current flag**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js --current`
Expected: Companion card with sprite, metadata, and colored stat bars displayed.

- [ ] **Step 2: Verify --help flag**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js --help`
Expected: Help text displays correctly (unchanged).

- [ ] **Step 3: Verify interactive mode full flow**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js`
Expected:
1. "Current companion" shows sprite card
2. Select "Reroll companion"
3. Species browser works with sprite previews
4. Rarity/eye/hat/shiny selection works
5. "Search and apply?" confirmation shows target summary
6. After search, "New companion" shows sprite card
7. (Skip actual patching — cancel before apply if desired)

- [ ] **Step 4: Verify --list flag**

Run: `cd /Users/kang/Project/buddy-reroll && bun run index.js --list`
Expected: Available options list displays correctly (unchanged).
