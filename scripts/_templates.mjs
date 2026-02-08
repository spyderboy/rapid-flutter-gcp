// scripts/_templates.mjs

/**
 * Generates the content for a `netlify.toml` configuration file.
 * Configures Netlify for a Flutter web build with a Single Page Application (SPA) redirect.
 *
 * @param {object} [options] - Options for the Netlify configuration.
 * @param {string} [options.nodeVersion="20"] - The Node.js version to use in the Netlify build environment.
 * @returns {string} The content of the `netlify.toml` file.
 */
export function netlifyToml({ nodeVersion = "20" } = {}) {
  // Flutter web build outputs to apps/client/build/web
  return `
[build]
  base = "apps/client"
  command = "flutter build web --release"
  publish = "build/web"

[build.environment]
  NODE_VERSION = "${nodeVersion}"

# SPA redirect so Flutter web routes don't 404
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`.trimStart();
}

/**
 * Generates the content for a comprehensive `.gitignore` file.
 * Includes common ignores for Flutter, Node.js, IDEs, and OS-specific files.
 *
 * @returns {string} The content of the `.gitignore` file.
 */
export function gitignore() {
  // Flutter + Node + common IDE/editor + OS noise
  return `
# --- Flutter/Dart ---
.dart_tool/
.packages
.pub/
.pub-cache/
build/
.flutter-plugins
.flutter-plugins-dependencies
*.iml

# Flutter web build artifacts (already covered by build/ but keep explicit)
apps/client/build/

# --- Node ---
node_modules/
dist/
coverage/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# --- Env ---
.env
.env.*
!.env.example

# --- IDE/Editor ---
.vscode/
.idea/
*.swp

# --- OS ---
.DS_Store
Thumbs.db

# --- Project local artifacts ---
artifacts/
tmp/
`.trimStart();
}

/**
 * Generates the content for a basic `README.md` file.
 * Provides an overview of the monorepo structure and basic development commands.
 *
 * @param {object} options - Options for the README content.
 * @param {string} options.repoName - The name of the repository.
 * @returns {string} The content of the `README.md` file.
 */
export function readme({ repoName }) {
  return `
# ${repoName}

Monorepo layout:

- \`apps/client\`: Flutter app (web + mobile)
- \`functions/api\`: Node functions (deploy to GCP)

## Local dev

### Flutter
\`\`\`bash
cd apps/client
flutter pub get
flutter run
\`\`\`

### Functions
\`\`\`bash
cd functions/api
npm install
npm run dev
\`\`\`

## Deploy

- Web: Netlify builds from \`apps/client\` and publishes \`apps/client/build/web\`
- API: Deploy \`functions/api\` to Google Cloud Functions / Cloud Run (your choice)
`.trimStart();
}