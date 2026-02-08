#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

function run(cmd) {
  console.log("
> " + cmd);
  execSync(cmd, { stdio: "inherit" });
}

function exists(p) {
  return fs.existsSync(p);
}

const outDir = path.resolve("artifacts");
if (!exists(outDir)) fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const zipPath = path.join(outDir, `flutter-source-${stamp}.zip`);

const base = path.resolve("apps/client");
if (!exists(base)) {
  console.error("apps/client not found.");
  process.exit(1);
}

// what to include
const include = [
  "lib",
  "pubspec.yaml",
  "pubspec.lock",
  "analysis_options.yaml",
  "web",
  "assets"
].filter((p) => exists(path.join(base, p)));

if (include.length === 0) {
  console.error("Nothing found to zip.");
  process.exit(1);
}

if (os.platform() === "win32") {
  // Use PowerShell Compress-Archive
  // We'll copy selected files into a temp folder to avoid pulling in build artifacts.
  const tmp = path.join(outDir, `tmp-flutter-${stamp}`);
  fs.mkdirSync(tmp, { recursive: true });

  for (const rel of include) {
    const src = path.join(base, rel);
    const dst = path.join(tmp, rel);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      // robocopy handles dirs better on Windows
      run(`robocopy "${src}" "${dst}" /E /NFL /NDL /NJH /NJS /NC /NS /NP`);
    } else {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }

  // Create zip
  // -Force overwrites if needed
  run(`powershell -NoProfile -Command "Compress-Archive -Path '${tmp}\*' -DestinationPath '${zipPath}' -Force"`);

  // Cleanup temp folder
  run(`powershell -NoProfile -Command "Remove-Item -Recurse -Force '${tmp}'"`);

  console.log("
Created:", zipPath);
  process.exit(0);
}

// mac/linux fallback: use zip if available
try {
  execSync("zip -v", { stdio: "ignore" });
} catch {
  console.error("zip command not found (non-Windows). Install zip or run on Windows.");
  process.exit(1);
}

const args = include.map((p) => `"${p}"`).join(" ");
run(`cd "${base}" && zip -r "${zipPath}" ${args} -x "build/*" ".dart_tool/*"`);
console.log("
Created:", zipPath);
