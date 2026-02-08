# Migration Guide

This guide helps you migrate an existing Flutter application or Node.js backend into this monorepo starter kit structure. The goal is to adapt your existing codebase to fit the `apps/client` (Flutter) and `functions/api` (Node.js/TypeScript) layout.

---

## Migrating an Existing Flutter Application

If you have a standalone Flutter project, follow these steps to integrate it into `apps/client`.

1.  **Prepare Your Existing Project:**
    *   Ensure your Flutter project is healthy and builds independently.
    *   Clean your project: `cd your-flutter-app && flutter clean`.
    *   Remove any `.git` directory within your Flutter app if it's a separate repository.

2.  **Integrate into Monorepo:**
    *   Create the `apps/client` directory if it doesn't exist: `mkdir -p apps/client`.
    *   Move all contents of your existing Flutter project into `apps/client`:
        ```bash
        mv your-flutter-app/* apps/client/
        mv your-flutter-app/.flutter-plugins apps/client/ # if exists
        # etc. for any hidden files/folders
        ```
    *   **Important:** You might need to manually move hidden files (`.idea/`, `.vscode/`, `.settings/`) if `mv` doesn't pick them up by default.

3.  **Adjust `pubspec.yaml` (if necessary):**
    *   Verify the `name` field in `apps/client/pubspec.yaml` is appropriate for your client app within the monorepo.
    *   Ensure all dependencies are correctly listed.

4.  **Flutter Web Setup:**
    *   If your existing app doesn't have web support enabled, add it:
        ```bash
        cd apps/client
        flutter create . --platforms=web --force # '.' to create in current dir
        ```
        This will add the necessary `web/` folder and update your project files. Review any changes carefully.

5.  **Test the Integrated Flutter App:**
    *   From the monorepo root:
        ```bash
        cd apps/client
        flutter pub get
        flutter run
        ```
    *   Verify that your application runs as expected.

---

## Migrating an Existing Node.js Backend/API

If you have a standalone Node.js (Express, Fastify, Serverless, etc.) project, follow these steps to integrate it into `functions/api`.

1.  **Prepare Your Existing Project:**
    *   Ensure your Node.js project is healthy and runs independently.
    *   Clean your project: `cd your-node-app && rm -rf node_modules dist`.
    *   Remove any `.git` directory within your Node.js app if it's a separate repository.

2.  **Integrate into Monorepo:**
    *   Create the `functions/api` directory if it doesn't exist: `mkdir -p functions/api`.
    *   Move all core source files, `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, etc., from your existing project into `functions/api`.
        ```bash
        mv your-node-app/* functions/api/
        mv your-node-app/.* functions/api/ # for hidden files like .env
        ```
    *   **Important:** Pay close attention to your main entry file. This template assumes `src/index.ts` with an `HttpFunction` handler. You might need to adapt your entry point to this pattern if deploying to Google Cloud Functions (Generation 2).

3.  **Update `package.json`:**
    *   Merge your existing `dependencies` and `devDependencies` from your old `package.json` into the `functions/api/package.json` that `new-project.mjs` generates (or create one if `new-project.mjs` hasn't run).
    *   Ensure the `scripts` section is compatible. This template provides `dev:ts`, `build`, `start`, `lint`, `format`, and deploy scripts. Adapt or add your own as needed.
    *   Add `@google-cloud/functions-framework` if you intend to use Google Cloud Functions Gen 2.

4.  **Configure TypeScript (if applicable):**
    *   Adjust `functions/api/tsconfig.json` to match your project's `rootDir`, `outDir`, and other compiler options.
    *   Ensure your `.gitignore` correctly ignores `node_modules` and `dist` within `functions/api`.

5.  **Adapt Entry Point for GCP (Cloud Functions / Cloud Run):**
    *   The template's `functions/api/src/index.ts` uses `@google-cloud/functions-framework`'s `HttpFunction` interface.
    *   If your existing API uses a framework like Express, you can typically adapt it:
        ```typescript
        // functions/api/src/index.ts (example with Express)
        import express from 'express';
        import { HttpFunction } from '@google-cloud/functions-framework';

        const app = express();
        app.get('/', (req, res) => res.send('Hello from Express!'));
        // ... your other routes

        export const handler: HttpFunction = (req, res) => {
          // Functions Framework provides res.end directly,
          // but you can often pass req/res to your Express app
          app(req, res);
        };
        ```
    *   For Cloud Run, you might just keep your standard Express app and have `npm run start` run it as a web server. The deploy script handles deploying from source.

6.  **Test the Integrated API:**
    *   From the monorepo root:
        ```bash
        cd functions/api
        npm install
        npm run dev:ts # or npm run start if not using tsx
        ```
    *   Verify your API responds as expected.

---

## Integrating Configuration Files (`.rapid-dev.json`)

If you had project-specific defaults you wish to carry over:

1.  **Review `.rapid-dev.json`:** Examine the `defaults` structure in the monorepo's `.rapid-dev.json`.
2.  **Populate:** Add your desired default `org`, `private`, `netlify` settings, and `gcp` project/region to this file. Command-line arguments will always override these defaults.

---

## Updating Existing `.gitignore` / `netlify.toml`

*   **`.gitignore`:** Compare your existing `.gitignore` with the one provided by the template. The template's `.gitignore` (`scripts/_templates.mjs`) is comprehensive for Flutter, Node.js, and common development artifacts. You might want to merge specific rules from your old file.
*   **`netlify.toml`:** If you had a custom `netlify.toml`, you will need to adapt it. The template assumes `apps/client` as the base and `build/web` for publishing, with an SPA redirect. Adjust your build commands and publish directories as needed.

---

By following these steps, you should be able to integrate your existing projects into this monorepo structure, leveraging its standardized tooling and deployment patterns.
