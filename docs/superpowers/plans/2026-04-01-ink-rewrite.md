# Ink Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace @clack/prompts interactive mode with Ink (React for CLI) providing a persistent companion preview that updates in real-time across all selection steps.

**Architecture:** Split index.js into 3 files: `sprites.js` (shared sprite data/render), `ui.jsx` (Ink interactive app), `index.js` (core logic + non-interactive mode). The Ink app manages all selection state in one React tree so the PreviewCard updates instantly. bruteForce becomes async with periodic yields so Ink can re-render the spinner.

**Tech Stack:** Bun, ink 6.x, react 19.x, @inkjs/ui 2.x, chalk 5.x

---

### Task 1: Swap dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove old deps, add new ones**

Run:
```bash
cd /Users/kang/Project/buddy-reroll && bun remove @clack/prompts && bun add ink react @inkjs/ui
```

- [ ] **Step 2: Update `"files"` array in package.json**

Change `"files": ["index.js"]` to `"files": ["index.js", "ui.jsx", "sprites.js"]`.

- [ ] **Step 3: Verify**

Run: `bun run index.js --help`
Expected: May fail because index.js still imports @clack/prompts. That's OK — we'll fix it in Task 3.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: swap @clack/prompts for ink + react + @inkjs/ui"
```

---

### Task 2: Create sprites.js

**Files:**
- Create: `sprites.js`

Extract sprite data and render functions from `index.js` into a shared module. This file exports everything that both `index.js` (non-interactive `formatCompanionCard`) and `ui.jsx` (PreviewCard) need.

- [ ] **Step 1: Create sprites.js**

Create `/Users/kang/Project/buddy-reroll/sprites.js` with the following content. Note: `RARITY_COLORS` stores string names (not chalk functions) so both chalk and Ink `<Text color={}>` can use them.

```js
import chalk from "chalk";

export const RARITY_STARS = {
  common: "★",
  uncommon: "★★",
  rare: "★★★",
  epic: "★★★★",
  legendary: "★★★★★",
};

export const RARITY_COLORS = {
  common: "white",
  uncommon: "greenBright",
  rare: "blueBright",
  epic: "magentaBright",
  legendary: "yellowBright",
};

export const HAT_LINES = {
  none: "",
  crown: "   \\^^^/    ",
  tophat: "   [___]    ",
  propeller: "    -+-     ",
  halo: "   (   )    ",
  wizard: "    /^\\     ",
  beanie: "   (___)    ",
  tinyduck: "    ,>      ",
};

export const BODIES = {
  duck: [
    ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--´    "],
    ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--´~   "],
    ["            ", "    __      ", "  <({E} )___  ", "   (  .__>  ", "    `--´    "],
  ],
  goose: [
    ["            ", "     ({E}>    ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
    ["            ", "    ({E}>     ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
    ["            ", "     ({E}>>   ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
  ],
  blob: [
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (      )  ", "   `----´   "],
    ["            ", "  .------.  ", " (  {E}  {E}  ) ", " (        ) ", "  `------´  "],
    ["            ", "    .--.    ", "   ({E}  {E})   ", "   (    )   ", "    `--´    "],
  ],
  cat: [
    ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  ω  )   ", '  (")_(")   '],
    ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  ω  )   ", '  (")_(")~  '],
    ["            ", "   /\\-/\\    ", "  ( {E}   {E})  ", "  (  ω  )   ", '  (")_(")   '],
  ],
  dragon: [
    ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-´  "],
    ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (        ) ", "  `-vvvv-´  "],
    ["   ~    ~   ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-´  "],
  ],
  octopus: [
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  \\/\\/\\/\\/  "],
    ["     o      ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
  ],
  owl: [
    ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   `----´   "],
    ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   .----.   "],
    ["            ", "   /\\  /\\   ", "  (({E})(-))  ", "  (  ><  )  ", "   `----´   "],
  ],
  penguin: [
    ["            ", "  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---´     "],
    ["            ", "  .---.     ", "  ({E}>{E})     ", " |(   )|    ", "  `---´     "],
    ["  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---´     ", "   ~ ~      "],
  ],
  turtle: [
    ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "  ``    ``  "],
    ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "   ``  ``   "],
    ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[======]\\ ", "  ``    ``  "],
  ],
  snail: [
    ["            ", " {E}    .--.  ", "  \\  ( @ )  ", "   \\_`--´   ", "  ~~~~~~~   "],
    ["            ", "  {E}   .--.  ", "  |  ( @ )  ", "   \\_`--´   ", "  ~~~~~~~   "],
    ["            ", " {E}    .--.  ", "  \\  ( @  ) ", "   \\_`--´   ", "   ~~~~~~   "],
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
    ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------´  "],
    ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   Oo   ) ", "  `------´  "],
    ["    ~  ~    ", "  u______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------´  "],
  ],
  cactus: [
    ["            ", " n  ____  n ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
    ["            ", "    ____    ", " n |{E}  {E}| n ", " |_|    |_| ", "   |    |   "],
    [" n        n ", " |  ____  | ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
  ],
  robot: [
    ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------´  "],
    ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ -==- ]  ", "  `------´  "],
    ["     *      ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------´  "],
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
    ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------´  "],
    ["            ", "  /\\    /|  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------´  "],
    ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------´~ "],
  ],
};

export function renderSprite(bones, frame = 0) {
  const frames = BODIES[bones.species];
  const body = frames[frame % frames.length].map((line) => line.replaceAll("{E}", bones.eye));
  const lines = [...body];
  if (bones.hat !== "none" && !lines[0].trim()) {
    lines[0] = HAT_LINES[bones.hat];
  }
  if (!lines[0].trim() && frames.every((f) => !f[0].trim())) lines.shift();
  return lines;
}

export function colorizeSprite(lines, rarity) {
  const colorFn = chalk[RARITY_COLORS[rarity]] ?? chalk.white;
  return lines.map((line) => colorFn(line));
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd /Users/kang/Project/buddy-reroll && bun -e "import { renderSprite, RARITY_COLORS } from './sprites.js'; console.log(RARITY_COLORS); console.log(renderSprite({ species: 'dragon', eye: '✦', hat: 'crown' }).join('\\n'))"`
Expected: Prints color map and dragon sprite with crown hat and ✦ eyes.

- [ ] **Step 3: Commit**

```bash
git add sprites.js
git commit -m "feat: extract sprites.js shared module"
```

---

### Task 3: Refactor index.js — remove clack, import from sprites.js

**Files:**
- Modify: `index.js`

Remove all @clack/prompts and @clack/core code. Import sprite functions from sprites.js. Make bruteForce async with onProgress callback. Replace interactiveMode with a placeholder that will call ui.jsx (wired up in Task 7).

- [ ] **Step 1: Replace imports**

Remove these lines:
```js
import * as p from "@clack/prompts";
import { Prompt, isCancel } from "@clack/core";
```

Add this import after `import chalk from "chalk";`:
```js
import { renderSprite, colorizeSprite, RARITY_STARS, RARITY_COLORS } from "./sprites.js";
```

- [ ] **Step 2: Remove sprite data and functions that are now in sprites.js**

Remove these blocks from index.js (they now live in sprites.js):
- `RARITY_STARS` constant (lines 45-51)
- `RARITY_CHALK` constant (lines 53-59)
- `HAT_LINES` constant (lines 61-70)
- `BODIES` constant (lines 72-163)
- `renderSprite` function (lines 165-174)
- `colorizeSprite` function (lines 176-179)

- [ ] **Step 3: Update formatCompanionCard to use RARITY_COLORS instead of RARITY_CHALK**

In the `formatCompanionCard` function, replace:
```js
  const colorFn = RARITY_CHALK[result.rarity] ?? chalk.white;
```
with:
```js
  const colorFn = chalk[RARITY_COLORS[result.rarity]] ?? chalk.white;
```

- [ ] **Step 4: Remove the entire clack-based interactive mode code**

Remove these blocks:
- The `// ── Species browse` section: `S_BAR`, `S_BAR_END`, `S_DIAMOND`, `S_DIAMOND_OPEN` constants and the entire `browseSpecies` function
- The entire `interactiveMode` function

- [ ] **Step 5: Make bruteForce async with onProgress callback**

Replace the `bruteForce` function with this async version:

```js
async function bruteForce(userId, target, onProgress) {
  const startTime = Date.now();
  let checked = 0;

  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  const suffixLen = SALT_LEN - "friend-2026-".length;
  if (suffixLen > 0 && suffixLen <= 4) {
    const gen = function* (prefix, depth) {
      if (depth === 0) { yield prefix; return; }
      for (const ch of chars) yield* gen(prefix + ch, depth - 1);
    };
    for (const suffix of gen("", suffixLen)) {
      const salt = `friend-2026-${suffix}`;
      checked++;
      const r = rollFrom(salt, userId);
      if (matches(r, target)) return { salt, result: r, checked, elapsed: Date.now() - startTime };
    }
  }

  for (let i = 0; i < 1_000_000_000; i++) {
    const salt = String(i).padStart(SALT_LEN, "x");
    checked++;
    const r = rollFrom(salt, userId);
    if (matches(r, target)) return { salt, result: r, checked, elapsed: Date.now() - startTime };

    if (checked % 100_000 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
    if (checked % 5_000_000 === 0) {
      if (onProgress) onProgress(checked, Date.now() - startTime);
    }
  }

  return null;
}
```

Key changes: `async function`, `await setTimeout(0)` every 100K iterations to yield to event loop, `onProgress` callback instead of `spinner`.

- [ ] **Step 6: Add placeholder interactiveMode that imports ui.jsx**

Add this function where interactiveMode was:

```js
async function interactiveMode(binaryPath, configPath, userId) {
  const binaryData = readFileSync(binaryPath);
  const currentSalt = findCurrentSalt(binaryData, userId);
  if (!currentSalt) {
    console.error("✗ Could not find companion salt in binary.");
    process.exit(1);
  }
  const currentRoll = rollFrom(currentSalt, userId);

  const { runInteractiveUI } = await import("./ui.jsx");
  await runInteractiveUI({
    currentRoll,
    currentSalt,
    binaryPath,
    configPath,
    userId,
    bruteForce,
    patchBinary,
    resignBinary,
    clearCompanion,
    isClaudeRunning,
    rollFrom,
    matches,
    SPECIES,
    RARITIES,
    RARITY_LABELS,
    EYES,
    HATS,
  });
}
```

Note: We pass constants (SPECIES, RARITIES, etc.) as well so ui.jsx doesn't need to duplicate them.

- [ ] **Step 7: Update nonInteractiveMode bruteForce call**

The `bruteForce` call in `nonInteractiveMode` is now async. Change `nonInteractiveMode` from a regular function to an `async function`, and add `await` before the bruteForce call:

```js
async function nonInteractiveMode(args, binaryPath, configPath, userId) {
```

Change `const found = bruteForce(userId, target, null);` to `const found = await bruteForce(userId, target, null);`

Also in `main()`, change `nonInteractiveMode(args, ...)` to `await nonInteractiveMode(args, ...)`.

- [ ] **Step 8: Verify non-interactive mode still works**

Run: `bun run index.js --current`
Expected: Shows companion card with sprite preview (using sprites.js imports).

Run: `bun run index.js --help`
Expected: Help text displays.

- [ ] **Step 9: Commit**

```bash
git add index.js
git commit -m "refactor: remove clack, import from sprites.js, async bruteForce"
```

---

### Task 4: Create ui.jsx — App shell, PreviewCard, ActionStep

**Files:**
- Create: `ui.jsx`

- [ ] **Step 1: Create ui.jsx with full App component**

Create `/Users/kang/Project/buddy-reroll/ui.jsx`:

```jsx
import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import { ConfirmInput, Spinner } from "@inkjs/ui";
import { renderSprite, RARITY_STARS, RARITY_COLORS } from "./sprites.js";
import { existsSync, copyFileSync, readFileSync } from "fs";

// ── PreviewCard ─────────────────────────────────────────────────────────

function PreviewCard({ species, rarity, eye, hat, shiny, stats }) {
  const color = RARITY_COLORS[rarity] ?? "white";
  const stars = RARITY_STARS[rarity] ?? "";
  const sprite = renderSprite({ species, eye, hat });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={color} paddingX={1}>
      <Box>
        <Box flexDirection="column">
          {sprite.map((line, i) => (
            <Text key={i} color={color}>{line}</Text>
          ))}
        </Box>
        <Box flexDirection="column" marginLeft={2}>
          <Text>{species} / {rarity}{shiny ? " / shiny" : ""}</Text>
          <Text dimColor>eye:{eye} / hat:{hat}</Text>
          <Text>{stars}</Text>
        </Box>
      </Box>
      {stats && (
        <Box flexDirection="column" marginTop={1}>
          {Object.entries(stats).map(([k, v]) => (
            <Text key={k}>
              <Text>{k.padEnd(10)} </Text>
              <Text color={color}>{"█".repeat(Math.round(v / 10))}</Text>
              <Text dimColor>{"░".repeat(10 - Math.round(v / 10))}</Text>
              <Text> {String(v).padStart(3)}</Text>
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Step Components ─────────────────────────────────────────────────────

function ActionStep({ onSelect }) {
  const options = [
    { label: "Reroll companion", value: "reroll" },
    { label: "Restore original", value: "restore" },
    { label: "Show current", value: "current" },
  ];
  const [idx, setIdx] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) setIdx((idx - 1 + options.length) % options.length);
    if (key.downArrow) setIdx((idx + 1) % options.length);
    if (key.return) onSelect(options[idx].value);
  });

  return (
    <Box flexDirection="column">
      <Text bold>What would you like to do?</Text>
      {options.map((opt, i) => (
        <Text key={opt.value}>
          <Text color={i === idx ? "cyan" : undefined}>{i === idx ? "❯ " : "  "}{opt.label}</Text>
        </Text>
      ))}
    </Box>
  );
}

function SpeciesStep({ speciesList, current, onChange, onSubmit }) {
  const [idx, setIdx] = useState(Math.max(0, speciesList.indexOf(current)));

  useInput((input, key) => {
    if (key.leftArrow || key.upArrow) {
      const next = (idx - 1 + speciesList.length) % speciesList.length;
      setIdx(next);
      onChange(speciesList[next]);
    }
    if (key.rightArrow || key.downArrow) {
      const next = (idx + 1) % speciesList.length;
      setIdx(next);
      onChange(speciesList[next]);
    }
    if (key.return) {
      onSubmit();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Species: <Text color="cyan">{speciesList[idx]}</Text> <Text dimColor>({idx + 1}/{speciesList.length})</Text></Text>
      <Text dimColor>← → navigate  /  enter select</Text>
    </Box>
  );
}

function SelectStep({ label, options, defaultValue, onChange, onSubmit }) {
  const [idx, setIdx] = useState(Math.max(0, options.findIndex((o) => o.value === defaultValue)));

  useInput((input, key) => {
    if (key.upArrow || key.leftArrow) {
      const next = (idx - 1 + options.length) % options.length;
      setIdx(next);
      onChange(options[next].value);
    }
    if (key.downArrow || key.rightArrow) {
      const next = (idx + 1) % options.length;
      setIdx(next);
      onChange(options[next].value);
    }
    if (key.return) {
      onSubmit();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      {options.map((opt, i) => (
        <Text key={opt.value}>
          <Text color={i === idx ? "cyan" : undefined}>{i === idx ? "❯ " : "  "}{opt.label}</Text>
        </Text>
      ))}
      <Text dimColor>↑ ↓ navigate  /  enter select</Text>
    </Box>
  );
}

function ShinyStep({ onSelect }) {
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text bold>Shiny?</Text>
        <ConfirmInput
          defaultChoice="cancel"
          onConfirm={() => onSelect(true)}
          onCancel={() => onSelect(false)}
        />
      </Box>
    </Box>
  );
}

function ConfirmStep({ target, claudeRunning, onConfirm, onCancel }) {
  return (
    <Box flexDirection="column">
      <Text>Target: {target.species} / {target.rarity} / eye:{target.eye} / hat:{target.hat}{target.shiny ? " / shiny" : ""}</Text>
      {claudeRunning && <Text color="yellow">⚠ Claude Code appears to be running. Quit it before patching.</Text>}
      <Box gap={1}>
        <Text bold>Search and apply?</Text>
        <ConfirmInput onConfirm={onConfirm} onCancel={onCancel} />
      </Box>
    </Box>
  );
}

function SearchStep({ userId, target, bruteForce, onFound, onFail }) {
  const [progress, setProgress] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = await bruteForce(userId, target, (checked, elapsed) => {
        if (!cancelled) {
          setProgress(`${(checked / 1e6).toFixed(0)}M salts checked (${(elapsed / 1000).toFixed(1)}s)`);
        }
      });
      if (cancelled) return;
      if (found) onFound(found);
      else onFail();
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <Box gap={1}>
      <Spinner label={progress || "Searching for matching salt..."} />
    </Box>
  );
}

function ResultStep({ result, onConfirm, onCancel }) {
  return (
    <Box flexDirection="column">
      <Text bold color="green">Found!</Text>
      <Box gap={1} marginTop={1}>
        <Text bold>Apply patch?</Text>
        <ConfirmInput onConfirm={onConfirm} onCancel={onCancel} />
      </Box>
    </Box>
  );
}

function DoneStep({ messages }) {
  return (
    <Box flexDirection="column">
      {messages.map((msg, i) => (
        <Text key={i} color="green">✓ {msg}</Text>
      ))}
      <Text bold marginTop={1}>Done! Restart Claude Code and run /buddy to hatch your new companion.</Text>
    </Box>
  );
}

// ── Main App ────────────────────────────────────────────────────────────

function App({ opts }) {
  const { exit } = useApp();
  const {
    currentRoll, currentSalt, binaryPath, configPath, userId,
    bruteForce, patchBinary, resignBinary, clearCompanion, isClaudeRunning,
    rollFrom, matches, SPECIES, RARITIES, RARITY_LABELS, EYES, HATS,
  } = opts;

  const [step, setStep] = useState("action");
  const [species, setSpecies] = useState(currentRoll.species);
  const [rarity, setRarity] = useState(currentRoll.rarity);
  const [eye, setEye] = useState(currentRoll.eye);
  const [hat, setHat] = useState(currentRoll.hat);
  const [shiny, setShiny] = useState(currentRoll.shiny);
  const [found, setFound] = useState(null);
  const [doneMessages, setDoneMessages] = useState([]);

  // Show stats only when we have a search result
  const showStats = step === "result" || step === "done";
  const displayRoll = found ? found.result : { species, rarity, eye, hat, shiny };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold dimColor>buddy-reroll</Text>

      <PreviewCard
        species={displayRoll.species}
        rarity={displayRoll.rarity}
        eye={displayRoll.eye}
        hat={displayRoll.hat}
        shiny={displayRoll.shiny}
        stats={showStats ? displayRoll.stats : null}
      />

      <Box marginTop={1}>
        {step === "action" && (
          <ActionStep onSelect={(action) => {
            if (action === "current") {
              setStep("showCurrent");
            } else if (action === "restore") {
              const backupPath = binaryPath + ".backup";
              if (!existsSync(backupPath)) {
                console.error("No backup found.");
                exit();
                return;
              }
              copyFileSync(backupPath, binaryPath);
              resignBinary(binaryPath);
              clearCompanion(configPath);
              setDoneMessages(["Restored! Restart Claude Code and run /buddy."]);
              setStep("done");
            } else {
              setStep("species");
            }
          }} />
        )}

        {step === "showCurrent" && (
          <Box flexDirection="column">
            <Text color="green">Current companion shown above.</Text>
          </Box>
        )}

        {step === "species" && (
          <SpeciesStep
            speciesList={SPECIES}
            current={species}
            onChange={(s) => setSpecies(s)}
            onSubmit={() => setStep("rarity")}
          />
        )}

        {step === "rarity" && (
          <SelectStep
            label="Rarity"
            options={RARITIES.map((r) => ({ label: RARITY_LABELS[r], value: r }))}
            defaultValue={rarity}
            onChange={(r) => {
              setRarity(r);
              if (r === "common") setHat("none");
            }}
            onSubmit={() => setStep("eye")}
          />
        )}

        {step === "eye" && (
          <SelectStep
            label="Eye"
            options={EYES.map((e) => ({ label: e, value: e }))}
            defaultValue={eye}
            onChange={setEye}
            onSubmit={() => {
              if (rarity === "common") {
                setStep("shiny");
              } else {
                setStep("hat");
              }
            }}
          />
        )}

        {step === "hat" && (
          <SelectStep
            label="Hat"
            options={HATS.map((h) => ({ label: h, value: h }))}
            defaultValue={hat === "none" ? "crown" : hat}
            onChange={setHat}
            onSubmit={() => setStep("shiny")}
          />
        )}

        {step === "shiny" && (
          <ShinyStep onSelect={(s) => {
            setShiny(s);
            const target = { species, rarity, eye, hat: rarity === "common" ? "none" : hat, shiny: s };
            if (matches(currentRoll, target)) {
              setDoneMessages(["Already matching! No changes needed."]);
              setStep("done");
            } else {
              setStep("confirm");
            }
          }} />
        )}

        {step === "confirm" && (
          <ConfirmStep
            target={{ species, rarity, eye, hat: rarity === "common" ? "none" : hat, shiny }}
            claudeRunning={isClaudeRunning()}
            onConfirm={() => setStep("search")}
            onCancel={() => exit()}
          />
        )}

        {step === "search" && (
          <SearchStep
            userId={userId}
            target={{ species, rarity, eye, hat: rarity === "common" ? "none" : hat, shiny }}
            bruteForce={bruteForce}
            onFound={(f) => {
              setFound(f);
              setStep("result");
            }}
            onFail={() => {
              console.error("No matching salt found. Try relaxing constraints.");
              exit();
            }}
          />
        )}

        {step === "result" && (
          <ResultStep
            result={found}
            onConfirm={() => {
              const msgs = [];
              const backupPath = binaryPath + ".backup";
              if (!existsSync(backupPath)) {
                copyFileSync(binaryPath, backupPath);
                msgs.push(`Backup saved to ${backupPath}`);
              }
              const count = patchBinary(binaryPath, currentSalt, found.salt);
              msgs.push(`Patched ${count} occurrence(s)`);
              if (resignBinary(binaryPath)) {
                msgs.push("Binary re-signed (ad-hoc codesign)");
              }
              clearCompanion(configPath);
              msgs.push("Companion data cleared");
              setDoneMessages(msgs);
              setStep("done");
            }}
            onCancel={() => exit()}
          />
        )}

        {step === "done" && <DoneStep messages={doneMessages} />}
      </Box>
    </Box>
  );
}

// Handle Ctrl+C to exit gracefully
function AppWrapper({ opts }) {
  const { exit } = useApp();
  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
    }
  });
  return <App opts={opts} />;
}

// ── Export ───────────────────────────────────────────────────────────────

export async function runInteractiveUI(opts) {
  const { waitUntilExit } = render(<AppWrapper opts={opts} />);
  await waitUntilExit();
}
```

- [ ] **Step 2: Verify syntax**

Run: `bun run index.js --help`
Expected: Help text prints (ui.jsx is only imported dynamically for interactive mode).

- [ ] **Step 3: Commit**

```bash
git add ui.jsx
git commit -m "feat: create ui.jsx with full Ink interactive app"
```

---

### Task 5: End-to-end verification

- [ ] **Step 1: Verify non-interactive mode**

Run: `bun run index.js --current`
Expected: Companion card with sprite, metadata, and stat bars. Uses sprites.js imports.

Run: `bun run index.js --help`
Expected: Help text unchanged.

Run: `bun run index.js --list`
Expected: Available options list unchanged.

- [ ] **Step 2: Verify interactive mode launches**

Run: `bun run index.js`
Expected: Ink app renders with:
- "buddy-reroll" header
- PreviewCard showing current companion sprite
- ActionStep with "Reroll companion" / "Restore original" / "Show current"

- [ ] **Step 3: Test species browsing**

In the interactive mode, select "Reroll companion". Then:
- Press ← → arrow keys to browse species
- Verify the PreviewCard sprite changes in-place
- Press Enter to confirm species

- [ ] **Step 4: Test full flow**

Continue through rarity → eye → hat → shiny → confirm. Verify:
- PreviewCard color changes when rarity is selected
- PreviewCard eyes change when eye is selected
- PreviewCard hat appears when hat is selected
- Spinner shows during search with progress updates
- Result card shows with full stats after search

- [ ] **Step 5: Fix any issues found during testing**

If issues are found, fix them and re-verify.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Ink rewrite with persistent preview"
```
