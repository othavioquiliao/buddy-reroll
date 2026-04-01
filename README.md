# buddy-reroll

Reroll your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) `/buddy` companion to any species, rarity, eye, hat, and shiny combination.

## Install

```bash
# Recommended: install and run with Bun
bun install -g buddy-reroll

# One-off execution
bunx buddy-reroll
```

`buddy-reroll` is a Bun-based CLI. The package can be published through npm-compatible registries, but execution still requires `bun` to be installed because the runtime uses `Bun.hash()`.

If you install the package with `npm` or `pnpm`, that only changes the package manager used to place files on disk. It does not replace the Bun runtime requirement.

Optional runtime overrides:

- `CLAUDE_BINARY_PATH` forces a specific Claude Code binary path when auto-discovery via `PATH` is not enough.
- `CLAUDE_CONFIG_DIR` forces a specific Claude config directory when you do not want the default home-based lookup.

## Usage

```bash
# Interactive mode (recommended)
buddy-reroll

# Non-interactive
buddy-reroll --species dragon --rarity legendary --eye ✦ --hat propeller --shiny

# Partial spec (unspecified fields are left random)
buddy-reroll --species cat --rarity epic

# Show current companion
buddy-reroll --current

# Restore original binary
buddy-reroll --restore
```

## Options

| Flag | Values |
|---|---|
| `--species` | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk |
| `--rarity` | common, uncommon, rare, epic, legendary |
| `--eye` | `·` `✦` `×` `◉` `@` `°` |
| `--hat` | none, crown, tophat, propeller, halo, wizard, beanie, tinyduck |
| `--shiny` | `--shiny` / `--no-shiny` |

## Requirements

- [Bun](https://bun.sh) runtime (uses `Bun.hash()` to match Claude Code's internal hashing)
- Claude Code

## Runtime Notes

- `buddy-reroll` is intentionally Bun-only in runtime for now. `npm` and `pnpm` are not drop-in runtime replacements.
- `buddy-reroll` first tries to discover Claude Code dynamically from `PATH`, then checks user-scoped install locations derived from the current OS.
- `--current`, `--help`, and `--list` work with read-only/system-managed Claude installs.
- `--restore` and any reroll command require write access to the real Claude binary because the tool creates `<binary>.backup` and patches the executable in place.

## Troubleshooting

If you see a message saying the Claude install is not writable, `buddy-reroll` successfully found Claude Code but cannot patch that installation as the current user. This is common when Claude was installed as a system package and the real binary lives in a root-owned directory outside your user-writable paths.

For fully automatic local validation, run:

```bash
bun run verify
```

This command runs the basic CLI checks, discovers Claude dynamically, and only runs the `--current` smoke check when both the binary and config were found on the machine.

## License

MIT
