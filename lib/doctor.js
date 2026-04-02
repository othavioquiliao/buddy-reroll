import { homedir } from "os";
import { join } from "path";
import {
  getClaudeBinaryOverride,
  getClaudeConfigDir,
  findBinaryPath,
  findConfigPath,
  getPatchability,
  isSystemManagedPath,
  getNativeInstallPath,
  traceAllCandidates,
} from "./runtime.js";

function buildStatus(binaryPath, configPath, patchability) {
  if (!binaryPath && !configPath) return "missing-binary-and-config";
  if (!binaryPath) return "missing-binary";
  if (!configPath) return "missing-config";
  if (!patchability.ok) return "read-only";
  return "ready";
}

function detectInstallType(binaryPath) {
  if (!binaryPath) return "unknown";

  const home = homedir();
  const nativeVersionsDir = join(home, ".local", "share", "claude", "versions");
  const nativeBin = getNativeInstallPath();

  if (binaryPath.startsWith(nativeVersionsDir) || binaryPath === nativeBin) return "native";
  if (isSystemManagedPath(binaryPath)) return "system-package";
  if (binaryPath.startsWith(home)) return "user-managed";
  return "unknown";
}

function collectWarnings(binaryPath, patchability, autoUpdaterDisabled, installType) {
  const warnings = [];

  if (autoUpdaterDisabled) {
    warnings.push(
      "DISABLE_AUTOUPDATER is set — Claude Code will not auto-update. " +
      "After manual updates the companion resets and buddy-reroll must run again."
    );
  }

  if (installType === "system-package") {
    warnings.push(
      `Binary is system-managed (${binaryPath}). ` +
      "System packages (AUR, Homebrew, Nix, Snap) install root-owned binaries that buddy-reroll cannot patch. " +
      "Switch to the native installer for a user-writable binary: curl -fsSL https://claude.ai/install.sh | sh"
    );
  }

  if (!patchability.ok && patchability.message && installType !== "system-package") {
    warnings.push(patchability.message);
  }

  return warnings;
}

function buildNextStep(status, installType) {
  switch (status) {
    case "missing-binary-and-config":
      return "Install Claude Code, make sure `claude` is discoverable on PATH, or set `CLAUDE_BINARY_PATH` and `CLAUDE_CONFIG_DIR`.";
    case "missing-binary":
      return "Make sure `claude` is discoverable on PATH or set `CLAUDE_BINARY_PATH` to the real Claude executable.";
    case "missing-config":
      return "Open Claude Code once so it writes config, or point `CLAUDE_CONFIG_DIR` to the correct config directory.";
    case "read-only":
      if (installType === "system-package") {
        return "Switch to the native installer for a user-writable binary: " +
          "(1) remove the system package, " +
          "(2) run: curl -fsSL https://claude.ai/install.sh | sh, " +
          "(3) re-run: bunx buddy-reroll";
      }
      return "Use a user-writable Claude install, or point `CLAUDE_BINARY_PATH` to a writable Claude binary copy; `--current` can still work with a read-only install.";
    default:
      return "`--current` and reroll commands are ready to run on this machine.";
  }
}

export function getDoctorReport() {
  const binaryOverride = getClaudeBinaryOverride();
  const configDir = getClaudeConfigDir();
  const binaryPath = findBinaryPath();
  const configPath = findConfigPath();
  const patchability = binaryPath
    ? getPatchability(binaryPath)
    : { ok: false, message: "Claude Code binary path is missing.", backupPath: null };
  const autoUpdaterDisabled = Boolean(process.env.DISABLE_AUTOUPDATER);
  const installType = detectInstallType(binaryPath);
  const status = buildStatus(binaryPath, configPath, patchability);

  let resolveChain = [];
  try {
    const traces = traceAllCandidates();
    if (traces.length > 0) resolveChain = traces[0].chain;
  } catch {}

  const warnings = collectWarnings(binaryPath, patchability, autoUpdaterDisabled, installType);

  return {
    status,
    binaryOverride,
    configDir,
    binaryPath,
    configPath,
    patchability,
    canRunCurrent: Boolean(binaryPath && configPath),
    autoUpdaterDisabled,
    installType,
    resolveChain,
    warnings,
    nextStep: buildNextStep(status, installType),
  };
}

export function formatDoctorReport(report, title = "Doctor report") {
  const home = homedir();
  const shortenPath = (p) => (p && p.startsWith(home) ? "~" + p.slice(home.length) : p);

  const lines = [
    title,
    `  Status:          ${report.status}`,
    `  Binary override: ${report.binaryOverride ?? "not set"}`,
    `  Config dir:      ${report.configDir}`,
    `  Binary path:     ${report.binaryPath ?? "not found"}`,
    `  Config path:     ${report.configPath ?? "not found"}`,
    `  Read current:    ${report.canRunCurrent ? "yes" : "no"}`,
    `  Install type:    ${report.installType}`,
    `  Auto-update:     ${report.autoUpdaterDisabled ? "disabled (DISABLE_AUTOUPDATER is set)" : "enabled"}`,
  ];

  if (report.resolveChain.length > 1) {
    lines.push(`  Resolve chain:   ${report.resolveChain.map(shortenPath).join(" → ")}`);
  }

  if (report.binaryPath) {
    lines.push(`  Patchability:    ${report.patchability.ok ? "writable" : "read-only"}`);
    lines.push(`  Backup path:     ${report.patchability.backupPath ?? "not available"}`);
  } else {
    lines.push("  Patchability:    not available");
    lines.push("  Backup path:     not available");
  }

  for (const warning of report.warnings) {
    lines.push(`  ⚠ ${warning}`);
  }

  lines.push(`  Next step:       ${report.nextStep}`);
  return lines.join("\n");
}
