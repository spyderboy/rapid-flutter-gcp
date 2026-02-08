#!/usr/bin/env node
import { execSync } from "child_process";
import os from "os";
import { tools } from "./_tooling.config.mjs";

function run(cmd, { silent = false } = {}) {
  if (!silent) console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: silent ? "pipe" : "inherit" });
}

function canRun(cmd) {
  try { execSync(cmd, { stdio: "ignore" }); return true; }
  catch { return false; }
}

function exists(cmd) {
  const platform = os.platform();
  if (platform === "win32") return canRun(`where ${cmd}`);
  return canRun(`command -v ${cmd}`);
}

function detectPkgMgr() {
  const platform = os.platform();
  if (platform === "win32") {
    if (exists("winget")) return { kind: "winget" };
    if (exists("choco")) return { kind: "choco" };
    return { kind: "none" };
  }
  if (platform === "darwin") return exists("brew") ? { kind: "brew" } : { kind: "none" };
  // linux
  if (exists("apt-get")) return { kind: "apt" };
  return { kind: "none" };
}

function installOrUpdateWithMgr(mgr, tool) {
  if (mgr.kind === "winget") {
    const id = tool?.win?.winget;
    if (!id) throw new Error(`No winget id for ${tool.key}`);
    if (!exists(tool.cmd)) {
      run(`winget install --id ${id} -e --source winget`);
    } else {
      // winget upgrade sometimes returns non-zero when nothing to do; treat as non-fatal
      try { run(`winget upgrade --id ${id} -e --source winget`); }
      catch { console.log(`(winget: no update or non-fatal exit for ${id})`); }
    }
    return;
  }

  if (mgr.kind === "choco") {
    const pkg = tool?.win?.choco;
    if (!pkg) throw new Error(`No choco package for ${tool.key}`);
    if (!exists(tool.cmd)) {
      run(`choco install ${pkg} -y`);
    } else {
      run(`choco upgrade ${pkg} -y`);
    }
    return;
  }

  if (mgr.kind === "brew") {
    // add brew mapping later if you want mac support
    throw new Error("brew mappings not configured yet.");
  }

  if (mgr.kind === "apt") {
    // add apt mapping later if you want linux support
    throw new Error("apt mappings not configured yet.");
  }

  throw new Error("No supported package manager found (need winget/choco/brew/apt).");
}

function ensureNpmGlobal(pkg, cmd) {
  if (!exists("npm")) throw new Error("npm not found. Ensure node is installed first.");
  if (!exists(cmd)) run(`npm i -g ${pkg}`);
  else run(`npm i -g ${pkg}@latest`);
}

function ensureFlutter(mgr) {
  if (!exists("flutter")) {
    // Install flutter. If you prefer winget, do it here.
    // If you prefer zip-based Flutter, you can detect and prompt; but we’ll install via mgr for robustness.
    if (mgr.kind === "winget") run(`winget install --id Flutter.Flutter -e --source winget`);
    else if (mgr.kind === "choco") run(`choco install flutter -y`);
    else throw new Error("Flutter missing and no installer configured for this OS.");
  } else {
    // Update Flutter regardless of installation method (zip/git/winget)
    run(`flutter upgrade`);
  }
}

function ensurePythonPackage(tool) {
  // Prefer pipx if installed, otherwise fallback to python -m pip
  if (exists("pipx")) {
    // If aider is already installed via pipx, upgrade; otherwise install
    // pipx list output is text; keep it simple:
    const listed = canRun(`pipx list | findstr /i ${tool.pythonPackage}`);
    if (listed) run(`pipx upgrade ${tool.pythonPackage}`);
    else run(`pipx install ${tool.pythonPackage}`);
    return;
  }

  if (!exists("python")) {
    console.log("(python not found; skipping python-package installs)");
    return;
  }

  // Ensure pip available + upgrade the package
  run(`python -m pip install --upgrade pip`);
  run(`python -m pip install --upgrade ${tool.pythonPackage}`);
}

function printVersions() {
  const cmds = [
    ["git", "--version"],
    ["node", "--version"],
    ["npm", "--version"],
    ["gh", "--version"],
    ["netlify", "--version"],
    ["gcloud", "--version"],
    ["flutter", "--version"],
    ["aider", "--version"],
  ];
  for (const [c, arg] of cmds) {
    if (!exists(c)) continue;
    try { run(`${c} ${arg}`); } catch { /* ignore */ }
  }
}

function authHints() {
  console.log("\nAuth checks (run if needed):");
  console.log("  gh auth status");
  console.log("  netlify status");
  console.log("  gcloud auth list");
}

function main() {
  const mgr = detectPkgMgr();
  console.log(`Bootstrap: OS=${os.platform()} pkgmgr=${mgr.kind}\n`);

  // Ensure core tools first (order matters)
  const ordered = [...tools].sort((a, b) => {
    const order = ["git","node","gh","netlify","gcloud","flutter","python","pipx","aider"];
    return order.indexOf(a.key) - order.indexOf(b.key);
  });

  for (const t of ordered) {
    // Special handlers
    if (t.npmGlobal) {
      ensureNpmGlobal(t.npmGlobal, t.cmd);
      continue;
    }
    if (t.flutter) {
      ensureFlutter(mgr);
      continue;
    }
    if (t.pythonPackage) {
      ensurePythonPackage(t);
      continue;
    }

    // Regular CLI via package manager (skip optionals if no mapping)
    if (!t.win?.winget && !t.win?.choco) {
      if (!t.optional) console.log(`(no installer mapping for ${t.key}; skipping)`);
      continue;
    }
    installOrUpdateWithMgr(mgr, t);
  }

  console.log("\nVersions:");
  printVersions();
  authHints();

  console.log("\nDone.");
}

main();
