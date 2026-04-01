#!/usr/bin/env bun

import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { findBinaryPath, findConfigPath, getClaudeBinaryOverride, getClaudeConfigDir, getPatchability } from "../lib/runtime.js";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const entrypoint = join(rootDir, "index.js");

function log(message) {
  process.stdout.write(`${message}\n`);
}

function runCurrentSmokeCheck() {
  execFileSync("bun", [entrypoint, "--current"], {
    cwd: rootDir,
    stdio: "inherit",
  });
}

function main() {
  const binaryPath = findBinaryPath();
  const configPath = findConfigPath();

  log("Runtime verification");
  log(`  Binary override: ${getClaudeBinaryOverride() ?? "not set"}`);
  log(`  Config dir:      ${getClaudeConfigDir()}`);
  log(`  Binary path:     ${binaryPath ?? "not found"}`);
  log(`  Config path:     ${configPath ?? "not found"}`);

  if (!binaryPath || !configPath) {
    log("  Skipping --current smoke check because Claude Code runtime was not fully discovered on this machine.");
    process.exit(0);
  }

  const patchability = getPatchability(binaryPath);
  log(`  Patchability:    ${patchability.ok ? "writable" : "read-only"}`);
  if (!patchability.ok) {
    log(`  Note:            ${patchability.message}`);
  }

  runCurrentSmokeCheck();
}

main();
