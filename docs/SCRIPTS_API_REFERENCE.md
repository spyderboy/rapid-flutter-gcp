# Scripts API Reference

This document provides an overview and usage details for the helper scripts available in this starter kit.

## `scripts/bootstrap.mjs`

**Purpose:** Installs and updates all necessary CLIs and tools on your development machine. This script should be run once when setting up a new machine, or periodically to ensure all tools are up-to-date.

**Usage:**
```bash
node scripts/bootstrap.mjs
```

**Behavior:**
*   Detects your operating system (Windows, macOS, Linux).
*   Identifies the appropriate package manager (winget, choco, brew, apt).
*   Checks for the existence of required CLIs: `git`, `node`, `gh` (GitHub CLI), `netlify` (Netlify CLI), `gcloud` (GCP CLI), `flutter`, `python`, `pipx`, `aider`, `ollama`.
*   If a tool is missing, it attempts to install it using the detected package manager or a specific tool's installer (e.g., `npm` for `netlify-cli`, `flutter upgrade` for Flutter).
*   If a tool exists, it attempts to upgrade it to the latest version.
*   Provides progress indicators for installations and upgrades using `ora`.
*   Prints installed tool versions at the end.
*   Provides hints for authentication (e.g., `gh auth login`, `netlify login`, `gcloud auth login`).

**Arguments:** None directly supported for behavior modification.

## `scripts/new-project.mjs`

**Purpose:** Automates the creation of a new monorepo project, including GitHub repository setup, Flutter app scaffolding, Node.js API scaffolding, and configuration file generation.

**Usage:**
```bash
node scripts/new-project.mjs [options]
```

**Configuration:**
Defaults for options can be set in the `.rapid-dev.json` file at the root of the starter kit. Command-line arguments will always override these defaults.

**Options:**

*   `--repo <name>`: Directly specify the full repository name (e.g., `my-cool-project`). Overrides other naming arguments.
*   `--project <name>`: Base project name (e.g., `ecom`, `website`). Used with `--description`, `--service`, `--type`.
*   `--description <text>`: Description for general project names (e.g., `frontend`, `backend`).
*   `--service <name>`: Service name for API projects (e.g., `order`, `user-auth`).
*   `--type <text>`: Type for service projects (e.g., `api`, `service`).
*   `--team <name>`: Team name for component projects.
*   `--component <name>`: Component name for component projects.
*   `--org <githubOrg>`: GitHub organization to create the repository under. If omitted, the repo is created under your user account.
*   `--private`: Creates a private GitHub repository. (Default: public). This can be set as a default in `.rapid-dev.json`.
*   `--netlify`: Configures and links a Netlify site for the project. (Default: false). This can be set as a default in `.rapid-dev.json`.
*   `--netlify-name <name>`: Specify a custom name for the Netlify site.
*   `--gcp <type>`: Scaffolds GCP deployment wiring. Currently not fully implemented, but sets up the placeholder. (Possible values: `functions`, `run`). This can be set as a default in `.rapid-dev.json`.
*   `--node <version>`: Node.js version for Netlify build environment (e.g., `18`, `20`). (Default: 20).
*   `--dir <path>`: Specifies the directory to create the project in. (Default: current directory + repo name).
*   `--skipPush`: Skips the initial `git push -u origin main` command. Useful for local-only testing.

**Naming Conventions Enforcement:**
The script enforces strict naming rules defined in `scripts/_naming.mjs`:
*   Lowercase letters and hyphens only.
*   No uppercase, underscores, or spaces.
*   No double hyphens, leading/trailing hyphens.
*   Avoids versioning tokens (e.g., `v1`, `final`, `latest`).
*   Requires at least two segments (e.g., `project-description`).

**Generated Structure:**
*   `apps/client/`: Flutter web/mobile application.
*   `functions/api/`: Node.js/TypeScript API with ESLint, Prettier, tsconfig, and deploy scripts.
*   `netlify.toml`: Netlify build configuration for Flutter web.
*   `.gitignore`: Comprehensive gitignore for Flutter, Node, and common tools.
*   `README.md`: Project overview and development instructions.
*   `.env.example`: Template for environment variables.
*   `scripts/`: Contains `zip-flutter.mjs`, `deploy-api.mjs`, `smoke.mjs`.

## `scripts/zip-flutter.mjs`

**Purpose:** Creates a ZIP archive of the core Flutter source code (`apps/client/lib`, `pubspec.yaml`, etc.) suitable for sharing, particularly with LLMs, by excluding build artifacts and other non-essential files.

**Usage:**
```bash
node scripts/zip-flutter.mjs
```

**Output:**
Creates a file like `artifacts/flutter-source-<timestamp>.zip` in the `artifacts/` directory.

## `scripts/deploy-api.mjs`

**Purpose:** A root-level wrapper script to deploy the Node.js API (located in `functions/api/`) to Google Cloud. It delegates to the API's internal deploy script.

**Usage:**
```bash
node scripts/deploy-api.mjs [options]
```

**Options:**
See `functions/api/scripts/deploy.mjs` for detailed options, which can include `--target`, `--service`, `--region`, `--project`, `--entry`, and `--dryRun`.

**Example:**
```bash
node scripts/deploy-api.mjs --target functions --project your-gcp-project-id --region us-east1 --service api
```

## `scripts/smoke.mjs`

**Purpose:** Performs a series of quick checks to verify the basic structure and functionality of the newly created project. Useful for initial sanity checks.

**Usage:**
```bash
node scripts/smoke.mjs
```

**Checks Performed:**
*   Presence of core project files (`pubspec.yaml`, `package.json`, `netlify.toml`, `.gitignore`).
*   Installation of Flutter dependencies (`.dart_tool`).
*   Installation of API dependencies (`node_modules`).
*   Successful build of the Flutter app (web release).
*   Successful build of the Node.js API.

**Output:**
Prints "OK:" for successful checks and "FAIL:" for failures, exiting with an error code on the first failure.
