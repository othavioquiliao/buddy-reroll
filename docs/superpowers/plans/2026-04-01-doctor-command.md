# Doctor Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-facing `--doctor` command that reports runtime discovery and troubleshooting details using the same diagnostic source as automated verification.

**Architecture:** Extract the runtime diagnosis currently embedded in `scripts/verify-runtime.js` into a small shared helper module. Route both CLI `--doctor` and the verification script through that helper so discovery, patchability, and user messaging stay aligned.

**Tech Stack:** Bun, Node-compatible stdlib modules, existing CLI entrypoint in `index.js`

---

### Task 1: Add shared doctor diagnostics

**Files:**
- Create: `lib/doctor.js`
- Modify: `lib/runtime.js`

- [ ] Add a small helper that returns runtime diagnosis fields for `binaryOverride`, `configDir`, `binaryPath`, `configPath`, `patchability`, and whether the runtime is complete enough to run `--current`.
- [ ] Keep `lib/runtime.js` as the source of binary/config discovery and reuse its existing functions instead of moving behavior.

### Task 2: Expose `--doctor` in the CLI

**Files:**
- Modify: `index.js`

- [ ] Add `--doctor` to argument parsing and help text.
- [ ] Print a read-only diagnosis summary and exit without patching or brute force.
- [ ] Keep the output action-oriented so a user can tell whether the issue is discovery, config, or permissions.

### Task 3: Reuse doctor diagnostics in verification

**Files:**
- Modify: `scripts/verify-runtime.js`

- [ ] Replace the script-local discovery formatting with the shared helper.
- [ ] Continue running the `--current` smoke check only when binary and config were discovered.

### Task 4: Document and verify

**Files:**
- Modify: `README.md`

- [ ] Document `--doctor` as the recommended troubleshooting command.
- [ ] Run smoke verification with `node --check`, `bun index.js --doctor`, and `bun run verify`.
