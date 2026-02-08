#!/usr/bin/env node
import { exec } from "child_process";
import os from "os";
import ora from 'ora';

/**
 * Executes a shell command asynchronously and streams its output to the console.
 *
 * @param {string} cmd - The command string to execute.
 * @param {object} [options] - Options for the command execution.
 * @param {boolean} [options.silent=false] - If true, suppresses console output (stdout/stderr) from the command itself.
 * @returns {Promise<string>} A promise that resolves with the stdout of the command, or rejects on error.
 */
function run(cmd, { silent = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!silent) console.log(`\n> ${cmd}`);
    const child = exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${cmd}`);
        if (stdout) console.error(stdout);
        if (stderr) console.error(stderr);
        reject(error);
      } else {
        if (!silent && stdout) console.log(stdout);
        resolve(stdout);
      }
    });

    if (!silent) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }
  });
}

/**
 * Checks if a command can be successfully executed without producing output.
 *
 * @param {string} cmd - The command to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the command can run, false otherwise.
 */
async function canRun(cmd) {
  try {
    await run(cmd, { silent: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a given command/executable exists in the system's PATH.
 *
 * @param {string} cmd - The command to check for existence.
 * @returns {Promise<boolean>} A promise that resolves to true if the command exists, false otherwise.
 */
async function exists(cmd) {
  const platform = os.platform();
  if (platform === "win32") return await canRun(`where ${cmd}`);
  return await canRun(`command -v ${cmd}`);
}

/**
 * Detects the primary package manager available on the current operating system.
 *
 * @returns {Promise<{kind: "winget" | "choco" | "brew" | "apt" | "none"}>} A promise that resolves with an object indicating the package manager kind.
 */
async function detectPkgMgr() {
  const platform = os.platform();
  if (platform === "win32") {
    if (await exists("winget")) return { kind: "winget" };
    if (await exists("choco")) return { kind: "choco" };
    return { kind: "none" };
  }
  if (platform === "darwin") return await exists("brew") ? { kind: "brew" } : { kind: "none" };
  if (await exists("apt-get")) return { kind: "apt" };
  return { kind: "none" };
}

/**
 * Executes a shell command with a progress spinner for visual feedback.
 *
 * @param {string} cmd - The command string to execute.
 * @param {string} message - The message to display next to the spinner.
 * @param {object} [options] - Options for the command execution.
 * @param {boolean} [options.silent=false] - If true, suppresses console output (stdout/stderr) from the command itself.
 * @returns {Promise<string>} A promise that resolves with the stdout of the command, or rejects on error.
 */
async function runWithSpinner(cmd, message, { silent = false } = {}) {
  const spinner = ora(message).start();
  try {
    const result = await run(cmd, { silent });
    spinner.succeed(message + ' Done.');
    return result;
  } catch (error) {
    spinner.fail(message + ' Failed.');
    throw error;
  }
}

/**
 * Ensures a tool is installed or updated using Winget.
 *
 * @param {string} cmd - The command name (e.g., 'git').
 * @param {string} id - The Winget package ID (e.g., 'Git.Git').
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function ensureWinget(cmd, id) {
  const message = `Ensuring ${cmd} (${id}) is installed and updated`;
  if (!(await exists(cmd))) {
    await runWithSpinner(`winget install --id ${id} -e --source winget`, `Installing ${cmd} (${id})`);
  } else {
    try {
      await runWithSpinner(`winget upgrade --id ${id} -e --source winget`, `Upgrading ${cmd} (${id})`);
    } catch (e) {
      console.log(`(winget: no update or non-fatal exit for ${id})`);
    }
  }
}

/**
 * Ensures a tool is installed or updated using Chocolatey.
 *
 * @param {string} cmd - The command name (e.g., 'git').
 * @param {string} pkg - The Chocolatey package name (e.g., 'git').
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function ensureChoco(cmd, pkg) {
  const message = `Ensuring ${cmd} (${pkg}) is installed and updated`;
  if (!(await exists(cmd))) {
    await runWithSpinner(`choco install ${pkg} -y`, `Installing ${cmd} (${pkg})`);
  } else {
    await runWithSpinner(`choco upgrade ${pkg} -y`, `Upgrading ${cmd} (${pkg})`);
  }
}

/**
 * Ensures a package is installed or updated using the detected package manager.
 *
 * @param {object} mgr - The detected package manager object (e.g., {kind: "winget"}).
 * @param {string} cmd - The command name (e.g., 'git').
 * @param {object} pkgInfo - Package information for different managers.
 * @param {string} pkgInfo.wingetId - Winget package ID.
 * @param {string} pkgInfo.chocoPkg - Chocolatey package name.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function ensurePkg(mgr, cmd, { wingetId, chocoPkg }) {
  if (mgr.kind === "winget") return await ensureWinget(cmd, wingetId);
  if (mgr.kind === "choco") return await ensureChoco(cmd, chocoPkg);
  throw new Error("No supported package manager found (need winget/choco).");
}

/**
 * Ensures a global npm package is installed and updated.
 *
 * @param {string} cmd - The command name provided by the npm package (e.g., 'netlify').
 * @param {string} pkg - The npm package name (e.g., 'netlify-cli').
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function ensureNpmGlobal(cmd, pkg) {
  const message = `Ensuring ${pkg} is installed and updated globally`;
  if (!(await exists("npm"))) throw new Error("npm not found. Ensure node is installed first.");
  if (!(await exists(cmd))) {
    await runWithSpinner(`npm i -g ${pkg}`, `Installing ${pkg} globally`);
  } else {
    await runWithSpinner(`npm i -g ${pkg} @latest`, `Upgrading ${pkg} globally`);
  }
}

/**
 * Ensures Flutter is installed and updated, preferring `flutter upgrade` if already present.
 *
 * @param {object} mgr - The detected package manager object.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function ensureFlutter(mgr) {
  const message = `Ensuring Flutter is installed and updated`;
  if (!(await exists("flutter"))) {
    if (mgr.kind === "winget") {
      await runWithSpinner(`winget install --id Flutter.Flutter -e --source winget`, `Installing Flutter via winget`);
    } else if (mgr.kind === "choco") {
      await runWithSpinner(`choco install flutter -y`, `Installing Flutter via chocolatey`);
    } else {
      throw new Error("Flutter missing and no installer configured.");
    }
  } else {
    await runWithSpinner(`flutter upgrade`, `Upgrading Flutter SDK`);
  }
}

/**
 * Ensures Python and pipx are installed and updated.
 *
 * @param {object} mgr - The detected package manager object.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function ensurePythonAndPipx(mgr) {
  // Python installation/update
  const pythonCmd = "python";
  const pythonId = "Python.Python.3.12";
  
  if (!(await exists(pythonCmd))) {
    try {
      await runWithSpinner(`winget install --id ${pythonId} -e --source winget`, `Installing Python via winget`);
    } catch {
      console.log("(Python install skipped: no mapping or installer issue)");
    }
  } else {
    try {
      await runWithSpinner(`python -m pip install --upgrade pip`, `Upgrading pip`);
    } catch {}
  }

  // Pipx installation/update
  const pipxCmd = "pipx";
  const pipxId = "Python.Pipx";
  
  if (!(await exists(pipxCmd))) {
    try {
      await runWithSpinner(`winget install --id ${pipxId} -e --source winget`, `Installing pipx via winget`);
    } catch {
      console.log("(pipx install skipped)");
    }
    await runWithSpinner(`pipx install pipx`, `Installing pipx`); // Ensure pipx is installed through pip, or via a spinner
  } else {
    try {
      await runWithSpinner(`pipx --version`, `Verifying pipx version`);
    } catch {}
  }
}

/**
 * Ensures Aider is installed and updated using pipx or pip.
 *
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function ensureAider() {
  const message = `Ensuring Aider is installed and updated`;
  if (await exists("pipx")) {
    const listed = await canRun(`pipx list | findstr /i aider-chat`); 
    if (listed) {
      await runWithSpinner(`pipx upgrade aider-chat`, `Upgrading Aider via pipx`);
    } else {
      await runWithSpinner(`pipx install aider-chat`, `Installing Aider via pipx`);
    }
    return;
  }
  if (await exists("python")) {
    await runWithSpinner(`python -m pip install --upgrade aider-chat`, `Installing/Upgrading Aider via pip`);
  } else {
    console.log("(aider skipped: python not found)");
  }
}

/**
 * Prints the versions of various installed command-line tools.
 *
 * @returns {Promise<void>} A promise that resolves when all versions have been attempted to print.
 */
async function printVersions() {
  const checks = [
    ["git", "--version"],
    ["node", "--version"],
    ["npm", "--version"],
    ["gh", "--version"],
    ["netlify", "--version"],
    ["gcloud", "--version"],
    ["flutter", "--version"],
    ["aider", "--version"],
    ["ollama", "--version"],
  ];
  for (const [c, arg] of checks) {
    if (!(await exists(c))) continue;
    try {
      await run(`${c} ${arg}`);
    } catch {}
  }
}

/**
 * Provides hints for authenticating with various CLIs.
 *
 * @returns {void}
 */
function authHints() {
  console.log("\nAuth checks (run if needed):");
  console.log("  gh auth status");
  console.log("  netlify status");
  console.log("  gcloud auth list");
}

/**
 * Main function to orchestrate the bootstrapping process.
 * Detects OS and package manager, then ensures all required tools are installed and updated in parallel where possible.
 *
 * @returns {Promise<void>} A promise that resolves when the bootstrapping process is complete.
 */
async function main() {
  const mgr = await detectPkgMgr();
  console.log(`Bootstrap: OS=${os.platform()} pkgmgr=${mgr.kind}`);

  await Promise.all([
    ensurePkg(mgr, "git", { wingetId: "Git.Git", chocoPkg: "git" }),
    ensurePkg(mgr, "node", { wingetId: "OpenJS.NodeJS.LTS", chocoPkg: "nodejs-lts" }),
    ensurePkg(mgr, "gh", { wingetId: "GitHub.cli", chocoPkg: "gh" }),
    ensureNpmGlobal("netlify", "netlify-cli"),
    ensurePkg(mgr, "gcloud", { wingetId: "Google.CloudSDK", chocoPkg: "google-cloud-sdk" }),
    ensureFlutter(mgr),
  ]);

  await ensurePythonAndPipx(mgr);
  await ensureAider();

  console.log("\nVersions:");
  await printVersions();

  authHints();
  console.log("\nDone.");
}

main();