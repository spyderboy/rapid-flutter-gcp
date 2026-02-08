# Troubleshooting Guide

This guide provides solutions to common issues you might encounter when setting up or working with this starter kit.

---

## General Issues

### `node: --test is not allowed in NODE_OPTIONS`

**Problem:** When running `npm test` or `node --test ...`, you encounter an error indicating `--test` is not allowed in `NODE_OPTIONS`.
**Solution:** This typically happens if your `NODE_OPTIONS` environment variable is set globally with options that conflict with Node.js's test runner. Check your system's `NODE_OPTIONS` environment variable and clear it, or temporarily unset it for your terminal session:
*   **Windows (Command Prompt):** `set NODE_OPTIONS=`
*   **Windows (PowerShell):** `Remove-Item Env:\NODE_OPTIONS`
*   **Linux/macOS:** `unset NODE_OPTIONS`

### Command Not Found / Tooling Issues

**Problem:** A CLI command (e.g., `gh`, `netlify`, `flutter`, `gcloud`) is not recognized, even after running `bootstrap.mjs`.
**Solution:**
1.  **Rerun Bootstrap:** Ensure you've run `node scripts/bootstrap.mjs` successfully.
2.  **Check PATH:** Verify that the installation directories of your CLIs are included in your system's `PATH` environment variable. Sometimes a terminal restart is needed after installation or `PATH` modification.
3.  **Authentication:** Some CLIs require authentication (`gh auth login`, `netlify login`, `gcloud auth login`). The `bootstrap.mjs` script will print reminders for these.
4.  **Windows Specific:** If using `winget` or `choco`, ensure they are installed and working correctly.
5.  **Reinstall:** If all else fails, try reinstalling the problematic CLI.

---

## Project Creation (`new-project.mjs`) Issues

### `gh repo create` Fails

**Problem:** The `gh repo create` command fails during `new-project.mjs` execution.
**Solution:**
1.  **GitHub CLI Installed:** Ensure `gh` is installed and updated (`node scripts/bootstrap.mjs`).
2.  **Authenticated:** Run `gh auth login` and ensure you are authenticated to GitHub.
3.  **Permissions:** If creating in an organization, ensure your GitHub token has sufficient permissions (`repo`, `admin:org`).
4.  **Naming Conflict:** Check if a repository with the same name already exists in your user account or organization.
5.  **Network:** Verify your internet connection.

### `flutter create` Fails

**Problem:** `flutter create apps/client` fails.
**Solution:**
1.  **Flutter Installed:** Ensure Flutter is installed and configured (`node scripts/bootstrap.mjs`).
2.  **Flutter Doctor:** Run `flutter doctor` in your terminal to identify any missing SDKs, toolchains, or configurations. Install/fix any reported issues.
3.  **Paths:** Ensure the Flutter SDK is correctly added to your system's `PATH`.

### `npm install` / `npm run build` Fails in `functions/api`

**Problem:** Node.js package installation or build steps fail in the `functions/api` directory.
**Solution:**
1.  **Node.js/npm Installed:** Ensure Node.js and npm are installed and updated (`node scripts/bootstrap.mjs`).
2.  **Node Version:** The `netlify.toml` specifies `NODE_VERSION`. Ensure your local Node.js version is compatible, or update it.
3.  **Dependencies:** Check for network issues preventing package downloads.
4.  **TypeScript Errors:** If `npm run build` fails, review the output for TypeScript compilation errors (e.g., missing types, syntax issues).

---

## Deployment Issues

### Netlify Build Fails

**Problem:** Your Netlify deploy fails after pushing to GitHub.
**Solution:**
1.  **Check Netlify Logs:** Go to your Netlify dashboard, navigate to the site, and inspect the deploy logs for detailed error messages.
2.  **`netlify.toml`:** Verify that `netlify.toml` is correctly configured (`base`, `command`, `publish` paths).
    *   `base = "apps/client"`
    *   `command = "flutter build web --release"`
    *   `publish = "build/web"`
3.  **Dependencies:** Ensure all Flutter dependencies are specified in `apps/client/pubspec.yaml` and Node dependencies in `functions/api/package.json`.
4.  **Flutter Web Build:** Try running `flutter build web --release` locally in `apps/client` to confirm it builds successfully outside of Netlify.
5.  **SPA Redirect:** Ensure the SPA redirect is present in `netlify.toml` to prevent 404s on refresh for Flutter routes.

### GCP Deployment Fails (`deploy-api.mjs`)

**Problem:** Deploying your API to Google Cloud Functions or Cloud Run fails.
**Solution:**
1.  **GCP CLI Installed & Authenticated:** Ensure `gcloud` is installed and you are authenticated (`gcloud auth login`) and have selected the correct project (`gcloud config set project <id>`).
2.  **Permissions:** Verify your GCP service account or user has sufficient permissions to deploy Cloud Functions/Cloud Run services in the target project.
3.  **Project ID:** Double-check that the `GCP_PROJECT` environment variable (or `--project` flag) is correctly set to your Google Cloud Project ID.
4.  **Region:** Ensure the `--region` specified is valid and matches where you intend to deploy.
5.  **API Enabled:** Confirm that the Cloud Functions API and/or Cloud Run API are enabled in your GCP project.
6.  **Build Errors:** Ensure the API builds successfully locally (`cd functions/api && npm run build`).

---

## Reporting Issues

If you encounter an issue not covered here, please:
1.  **Check Logs:** Provide full console output or build logs.
2.  **Describe Steps:** Detail the steps to reproduce the problem.
3.  **Environment:** Include your OS, Node.js version, Flutter version, and CLI tool versions (`node scripts/bootstrap.mjs` will list versions).
4.  **Submit:** Create an issue on the project's GitHub repository.
