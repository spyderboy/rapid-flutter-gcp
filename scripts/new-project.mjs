#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { buildRepoName, validateRepoName } from "./_naming.mjs";
import { netlifyToml, gitignore, readme } from "./_templates.mjs";
import { loadConfig } from './_config.mjs';

/**
 * Executes a shell command synchronously and streams its output.
 * @param {string} cmd - The command string to execute.
 * @param {object} [opts] - Options for `execSync`.
 */
function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

/**
 * Checks if a command can be successfully executed without producing output (synchronously).
 * @param {string} cmd - The command to check.
 * @returns {boolean} True if the command can run, false otherwise.
 */
function canRun(cmd) {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a command/executable exists on the system's PATH (synchronously).
 * @param {string} cmd - The command to check for existence.
 * @returns {boolean} True if the command exists, false otherwise.
 */
function existsCmd(cmd) {
  if (os.platform() === "win32") return canRun(`where ${cmd}`);
  return canRun(`command -v ${cmd}`);
}

/**
 * Parses command-line arguments into an object.
 * Supports `--key value` and `--flag` (boolean true).
 * @param {string[]} argv - Array of command-line arguments (e.g., process.argv.slice(2)).
 * @returns {object} An object containing parsed arguments.
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

/**
 * Ensures a directory exists, creating it and any necessary parent directories.
 * @param {string} p - The path to the directory.
 */
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/**
 * Writes content to a file, ensuring its parent directory exists.
 * @param {string} p - The path to the file.
 * @param {string} content - The content to write.
 */
function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

/**
 * Prints an error message and exits the process with a non-zero code.
 * @param {string} msg - The error message.
 */
function fail(msg) {
  console.error(`\nERROR: ${msg}`);
  process.exit(1);
}

/**
 * Requires a command-line tool to be present, failing if it's missing.
 * @param {string} cmd - The command to check for.
 */
function requireCmd(cmd) {
  if (!existsCmd(cmd)) fail(`Missing required CLI: ${cmd}. Run scripts/bootstrap.mjs first.`);
}

// --- templates for generated helper scripts ---

/**
 * Generates the content for a root `.env.example` file.
 * @returns {string} The content of the `.env.example` file.
 */
function rootEnvExample() {
  return `# Shared defaults used by scripts/deploy-api.mjs (and functions/api/scripts/deploy.mjs)
GCP_PROJECT=your-gcp-project-id
GCP_REGION=us-east1
GCP_SERVICE=api
GCP_ENTRY_POINT=handler
`;
}

/**
 * Generates the content for the root deploy-api.mjs helper script.
 * This script acts as a wrapper to call the API's internal deploy script.
 * @returns {string} The content of the deploy-api.mjs file.
 */
function deployApiScript() {
  return `#!/usr/bin/env node
import { execSync } from "child_process";
import path from "path";

function run(cmd, cwd) {
  console.log("\\n> " + cmd);
  execSync(cmd, { stdio: "inherit", cwd });
}

const args = process.argv.slice(2).join(" ");
const apiDir = path.resolve("functions/api");

run(\`node scripts/deploy.mjs \${args}\`, apiDir);
`;
}

/**
 * Generates the content for the smoke.mjs helper script.
 * Performs basic sanity checks on the project structure and build status.
 * @returns {string} The content of the smoke.mjs file.
 */
function smokeScript() {
  return `#!/usr/bin/env node
import fs from "fs";
import { exec } from "child_process";
import path from "path";

/**
 * Asserts a condition, logging success or failure and exiting on failure.
 * @param {boolean} cond - The condition to check.
 * @param {string} msg - The message to display.
 */
function ok(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("OK:", msg);
}

/**
 * Runs an asynchronous shell command.
 * @param {string} cmd - The command to execute.
 * @param {string} cwd - The current working directory for the command.
 * @returns {Promise<boolean>} Resolves to true if the command succeeds, false otherwise.
 */
function runAsync(cmd, cwd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(\`Command failed: \${cmd}\n\${stderr}\`);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Checks if the Flutter application at the given path builds successfully.
 * @param {string} projectPath - The path to the Flutter project.
 * @returns {Promise<boolean>} True if the build succeeds, false otherwise.
 */
async function canBuildFlutter(projectPath) {
  return await runAsync("flutter build web --release", projectPath);
}

/**
 * Checks if the API application at the given path builds successfully.
 * @param {string} projectPath - The path to the API project.
 * @returns {Promise<boolean>} True if the build succeeds, false otherwise.
 */
async function canBuildApi(projectPath) {
  return await runAsync("npm run build", projectPath);
}

/**
 * Main function to perform smoke tests.
 */
async function main() { // Make main async
  ok(fs.existsSync("apps/client/pubspec.yaml"), "Flutter app exists at apps/client");
  ok(fs.existsSync("functions/api/package.json"), "API exists at functions/api");
  ok(fs.existsSync("netlify.toml"), "netlify.toml exists");
  ok(fs.existsSync(".gitignore"), ".gitignore exists");

  // Check that dependencies are installed
  ok(fs.existsSync(path.join("apps/client", ".dart_tool")), "Flutter dependencies installed");
  ok(fs.existsSync(path.join("functions/api", "node_modules")), "API dependencies installed");

  // Check that builds work
  ok(await canBuildFlutter("apps/client"), "Flutter app builds");
  ok(await canBuildApi("functions/api"), "API builds");

  console.log("\\nSmoke checks passed.");
}

main(); // Call the async main
`;
}

/**
 * Generates the content for the zip-flutter.mjs helper script.
 * Creates a ZIP archive of essential Flutter source files for sharing.
 * @returns {string} The content of the zip-flutter.mjs file.
 */
function zipFlutterScript() {
  return `#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Executes a shell command synchronously.
 * @param {string} cmd - The command string to execute.
 */
function run(cmd) {
  console.log("\\n> " + cmd);
  execSync(cmd, { stdio: "inherit" });
}

/**
 * Checks if a path exists.
 * @param {string} p - The path to check.
 * @returns {boolean} True if the path exists, false otherwise.
 */
function exists(p) {
  return fs.existsSync(p);
}

const outDir = path.resolve("artifacts");
if (!exists(outDir)) fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const zipPath = path.join(outDir, 'flutter-source-' + stamp + '.zip');

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
  const tmp = path.join(outDir, 'tmp-flutter-' + stamp);
  fs.mkdirSync(tmp, { recursive: true });

  for (const rel of include) {
    const src = path.join(base, rel);
    const dst = path.join(tmp, rel);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      // robocopy handles dirs better on Windows
      run('robocopy "' + src + '" "' + dst + '" /E /NFL /NDL /NJH /NJS /NC /NS /NP');
    } else {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }

  // Create zip
  // -Force overwrites if needed
  run('powershell -NoProfile -Command "Compress-Archive -Path ''' + tmp + '\\\\*'' -DestinationPath ''' + zipPath + ''' -Force"');

  // Cleanup temp folder
  run('powershell -NoProfile -Command "Remove-Item -Recurse -Force ''' + tmp + '''"');

  console.log("\\nCreated:", zipPath);
  process.exit(0);
}

// mac/linux fallback: use zip if available
try {
  execSync("zip -v", { stdio: "ignore" });
} catch {
  console.error("zip command not found (non-Windows). Install zip or run on Windows.");
  process.exit(1);
}

const args = include.map((p) => '"' + p + '"').join(" ");
run('cd "' + base + '" && zip -r "' + zipPath + '" ' + args + ' -x "build/*" ".dart_tool/*"');
console.log("\\nCreated:", zipPath);
`;
}

// --- templates for functions/api scaffold ---

/**
 * Generates the content for the API's package.json file.
 * @param {string} repoName - The name of the repository, used for the API's package name.
 * @returns {string} The content of the package.json file.
 */
function apiPackageJson(repoName) {
  return JSON.stringify(
    {
      name: `${repoName}-api`,
      private: true,
      version: "0.0.0",
      type: "module",
      main: "dist/index.js",
      scripts: {
        "dev:ts": "tsx watch src/index.ts",
        build: "tsc -p tsconfig.json",
        start: "node dist/index.js",
        lint: "eslint .",
        format: "prettier -w .",
        "deploy:functions": "node scripts/deploy.mjs --target functions",
        "deploy:run": "node scripts/deploy.mjs --target run"
      },
      dependencies: {
        "@google-cloud/functions-framework": "^3.5.0",
        dotenv: "^16.4.5"
      },
      devDependencies: {
        "@eslint/js": "^9.10.0",
        "@types/node": "^22.5.5",
        eslint: "^9.10.0",
        globals: "^15.9.0",
        prettier": "^3.3.3",
        tsx": "^4.19.0",
        typescript": "^5.6.3"
      }
    },
    null,
    2
  ).concat("\n");
}

/**
 * Generates the content for the API's tsconfig.json file.
 * @returns {string} The content of the tsconfig.json file.
 */
function apiTsconfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
`;
}

/**
 * Generates the content for the API's eslint.config.js file.
 * @returns {string} The content of the eslint.config.js file.
 */
function apiEslintConfig() {
  return `import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      "no-unused-vars": "off"
    }
  }
];
`;
}

/**
 * Generates the content for the API's .prettierrc file.
 * @returns {string} The content of the .prettierrc file.
 */
function apiPrettier() {
  return `{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100
}
`;
}

/**
 * Generates the content for the API's src/index.ts file.
 * This is a basic Google Cloud Functions-compatible HTTP handler.
 * @returns {string} The content of the src/index.ts file.
 */
function apiIndexTs() {
  return `import "dotenv/config";
import { HttpFunction } from "@google-cloud/functions-framework";

export const handler: HttpFunction = (req, res) => {
  res.setHeader("content-type", "application/json");
  res.status(200).send(JSON.stringify({ ok: true, path: req.url }));
};
`;
}

/**
 * Generates the content for the API's scripts/deploy.mjs file.
 * Handles deployment to Google Cloud Functions or Cloud Run with dry-run support.
 * @returns {string} The content of the deploy.mjs file for the API.
 */
function apiDeployScript() {
  return `#!/usr/bin/env node
import { execSync } from "child_process";

/**
 * Executes a shell command synchronously.
 * If dryRun is enabled, it only logs the command without executing it.
 * @param {string} cmd - The command string to execute.
 */
function run(cmd) {
  console.log("\\n> " + cmd);
  if (dryRun) {
    console.log("Would run (dry-run):", cmd);
    return;
  }
  execSync(cmd, { stdio: "inherit" });
}

/**
 * Retrieves a command-line argument by key.
 * @param {string} key - The key of the argument (e.g., "target").
 * @param {*} def - The default value if the argument is not found.
 * @returns {*} The argument value or the default value.
 */
function getArg(key, def) {
  const ix = process.argv.indexOf("--" + key);
  if (ix === -1) return def;
  const v = process.argv[ix + 1];
  if (!v || v.startsWith("--")) return def;
  return v;
}

const target = getArg("target", "functions"); // functions | run
const service = getArg("service", process.env.GCP_SERVICE || "api");
const region = getArg("region", process.env.GCP_REGION || "us-east1");
const project = getArg("project", process.env.GCP_PROJECT || "");
const entry = getArg("entry", process.env.GCP_ENTRY_POINT || "handler");
const source = ".";
const dryRun = getArg("dryRun", false);

if (!project) {
  console.log("\\nMissing project. Set GCP_PROJECT env var or pass --project <id>.");
  process.exit(1);
}

run(\`gcloud config set project \${project}\`);

if (target === "functions") {
  run(
    [
      \`gcloud functions deploy \${service}\`,
      "--gen2",
      \`--region=\${region}\`,
      "--runtime=nodejs20",
      \`--source=\${source}\`,
      \`--entry-point=\${entry}\`,
      "--trigger-http",
      "--allow-unauthenticated"
    ].join(" ")
  );
  process.exit(0);
}

if (target === "run") {
  run(
    [
      \`gcloud run deploy \${service}\`,
      \`--region=\${region}\`,
      \`--source=\${source}\`,
      "--allow-unauthenticated"
    ].join(" ")
  );
  process.exit(0);
}

console.log(\`Unknown --target "\${target}" (use "functions" or "run")\`);
process.exit(1);
`;
}

// --- main ---

/**
 * Main function to orchestrate the new project creation process.
 * Parses arguments, validates repo name, creates GitHub repo, scaffolds Flutter and API projects,
 * generates config files, and performs initial git operations.
 * @returns {void}
 */
function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig(); // Load config

  // Required CLIs
  requireCmd("git");
  requireCmd("gh");
  requireCmd("flutter");
  requireCmd("node");
  requireCmd("npm");

  const wantNetlify = args.netlify || config.defaults.netlify;
  if (wantNetlify) requireCmd("netlify");

  // If deploying, gcloud required (but we don't force it for scaffold-only)
  const wantGcp = args.gcp || (config.defaults.gcp && config.defaults.gcp.project) ? String(args.gcp || config.defaults.gcp.project) : "";
  if (wantGcp && !existsCmd("gcloud")) {
    fail("You passed --gcp but gcloud is missing. Run scripts/bootstrap.mjs first.");
  }

  // Naming inputs
  const repoName = buildRepoName({
    raw: args.repo,
    prefix: args.prefix,
    project: args.project,
    description: args.description,
    service: args.service,
    type: args.type,
    team: args.team,
    component: args.component
  });

  const v = validateRepoName(repoName);
  if (!v.ok) {
    console.error(`\nRepo name "${repoName}" violates rules:`);
    for (const e of v.errors) console.error(`- ${e}`);
    process.exit(1);
  }

  const org = args.org || config.defaults.org || "";
  const visibility = (args.private || config.defaults.private) ? "private" : "public";
  const ghName = org ? `${org}/${repoName}` : repoName;

  const targetDir = path.resolve(args.dir || repoName);
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    fail(`Target directory not empty: ${targetDir}`);
  }

  // Create GitHub repo + clone
  run(`gh repo create ${ghName} --${visibility} --clone`);

  // gh clones into ./repoName by default
  const clonedPath = path.resolve(repoName);
  if (!fs.existsSync(clonedPath)) {
    fail(`Expected cloned folder "${repoName}" was not created. Check gh CLI output.`);
  }

  // Move if user requested different --dir
  if (path.resolve(targetDir) !== clonedPath) {
    fs.renameSync(clonedPath, targetDir);
  }

  process.chdir(targetDir);

  // Monorepo base dirs
  ensureDir("apps");
  ensureDir("functions");
  ensureDir("scripts");
  ensureDir("artifacts");

  // Flutter app at apps/client
  if (!fs.existsSync("apps/client")) {
    run(`flutter create apps/client --platforms=android,ios,web`);
  }

  // API TypeScript scaffold at functions/api
  ensureDir("functions/api/src");
  ensureDir("functions/api/scripts");

  if (!fs.existsSync("functions/api/package.json")) {
    writeFile("functions/api/package.json", apiPackageJson(repoName));
    writeFile("functions/api/tsconfig.json", apiTsconfig());
    writeFile("functions/api/eslint.config.js", apiEslintConfig());
    writeFile("functions/api/.prettierrc", apiPrettier());
    writeFile("functions/api/src/index.ts", apiIndexTs());
    writeFile("functions/api/scripts/deploy.mjs", apiDeployScript());
    writeFile("functions/api/.env.example", "NODE_ENV=development\n");
  }

  // Root config files
  writeFile("netlify.toml", netlifyToml({ nodeVersion: args.node || "20" }));
  writeFile(".gitignore", gitignore());
  writeFile("README.md", readme({ repoName }));
  writeFile(".env.example", rootEnvExample());

  // Generate helper scripts into the new repo
  writeFile("scripts/zip-flutter.mjs", zipFlutterScript());
  writeFile("scripts/deploy-api.mjs", deployApiScript());
  writeFile("scripts/smoke.mjs", smokeScript());

  // Make scripts executable on *nix
  if (os.platform() !== "win32") {
    try {
      run("chmod +x scripts/*.mjs functions/api/scripts/*.mjs");
    } catch {
      // non-fatal
    }
  }

  // Install + build API
  run(`cd functions/api && npm install`);
  run(`cd functions/api && npm run build`);

  // Git add/commit/push
  run(`git add -A`);
  run(`git commit -m "chore: initial scaffold"`);
  if (!args.skipPush) {
    run(`git push -u origin main`);
  }

  // Optional Netlify site creation/link
  if (wantNetlify) {
    const nlName = args["netlify-name"] ? `--name ${nlName}` : "";
    run(`netlify sites:create ${nlName}`);
    run(`netlify link`);
    run(`netlify status`);
  }

  console.log(`\n✅ Created repo: ${ghName}`);
  console.log(`📁 Location: ${targetDir}`);
  console.log(`🌐 Flutter: apps/client`);
  console.log(`🧩 API (TS): functions/api`);
  console.log(`🛠  Helpers: scripts/zip-flutter.mjs, scripts/deploy-api.mjs, scripts/smoke.mjs`);

  console.log("\nQuick commands:");
  console.log("  node scripts/smoke.mjs");
  console.log("  node scripts/zip-flutter.mjs");
  console.log("  node scripts/deploy-api.mjs --target functions --project <id> --region us-east1 --service api");
  console.log("  cd apps/client && flutter run");
  console.log("  cd functions/api && npm run dev:ts");
}

main();