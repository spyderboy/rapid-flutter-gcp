# Project Name

Monorepo for a Flutter web/mobile app and a Node-based API deployed to Google Cloud.

---

## Structure



apps/
client/ # Flutter app (web + mobile)
functions/
api/ # Node/TypeScript API for GCP
scripts/
*.mjs # Helper scripts (zip, deploy, smoke tests)
netlify.toml # Netlify build configuration


---

## Prerequisites

Install and authenticate the required tools:



node scripts/bootstrap.mjs


Then log in if needed:



gh auth login
netlify login
gcloud auth login


---

## Local Development

### Flutter app (web or mobile)



cd apps/client
flutter pub get
flutter run


To run web specifically:



flutter run -d chrome


---

### API (TypeScript)



cd functions/api
npm install
npm run dev:ts


This starts a local dev server with auto-reload.

---

## Testing

Run tests for the helper scripts:

\`\`\`bash
npm test
\`\`\`

---

## Deployments

### Web (Netlify)

Netlify is configured to:

- Build from: `apps/client`
- Command: `flutter build web --release`
- Publish: `apps/client/build/web`

Deploy via:



git push


(or use Netlify CLI)

---

### API (Google Cloud)

Set environment variables (or copy from `.env.example`):



GCP_PROJECT=your-project-id
GCP_REGION=us-east1
GCP_SERVICE=api
GCP_ENTRY_POINT=handler


#### Deploy as Cloud Functions (default)



cd functions/api
npm run deploy:functions


Or from repo root:



node scripts/deploy-api.mjs --target functions --project your-project-id --region us-east1 --service api


---

#### Deploy as Cloud Run service



cd functions/api
npm run deploy:run


Or:



node scripts/deploy-api.mjs --target run --project your-project-id --region us-east1 --service api


---

## Helper Scripts

All helper scripts live in the root `scripts/` folder.

### Smoke test
Verifies project structure, dependency installation, and build success:



node scripts/smoke.mjs


---

### Zip Flutter source (for LLMs or sharing)
Creates a zip of the Flutter source without build artifacts.



node scripts/zip-flutter.mjs


Output:


artifacts/flutter-source-<timestamp>.zip


---

### Deploy API from root
Wrapper around the API deploy script:



node scripts/deploy-api.mjs --target functions --project your-project-id


---

## Creating a New Project (from template)

From your starter repo:



node scripts/new-project.mjs \\
  --project myapp \\
  --description frontend \\
  --org your-github-org \\
  --private \\
  --netlify \\
  --skipPush


### Example outputs

| Command | Repo name |
|--------|-----------|
| `--project website --description frontend` | `website-frontend` |
| `--project ecom --service order --type api` | `ecom-order-api` |
| `--team data --component analytics-module` | `data-analytics-module` |

### Naming rules

- lowercase only
- hyphen-separated
- no version tokens (v2, final, etc.)
- at least two segments

---

## Configuration File

You can set project defaults in a `.rapid-dev.json` file at the root of the starter kit. Command-line arguments will override these defaults.

**Example `.rapid-dev.json`:**
\`\`\`json
{
  "defaults": {
    "org": "my-company",
    "private": true,
    "netlify": true,
    "gcp": {
      "project": "my-project-id",
      "region": "us-east1"
    }
  }
}
\`\`\`

---

## Environment Variables

Copy and edit:



cp .env.example .env


Typical values:



GCP_PROJECT=your-project-id
GCP_REGION=us-east1
GCP_SERVICE=api
GCP_ENTRY_POINT=handler


---

## Toolchain Maintenance

Update all core tools:



node scripts/bootstrap.mjs


Behavior:

- If tool is missing → installs it
- If tool exists → updates it

---

## Recommended Workflow

### First time on a machine



git clone <template-repo>
cd <template-repo>
node scripts/bootstrap.mjs


### Start a new project



node scripts/new-project.mjs --project myapp --description frontend


### Daily development



cd apps/client
flutter run

cd functions/api
npm run dev:ts


---

---

## Documentation

*   [Scripts API Reference](docs/SCRIPTS_API_REFERENCE.md)
*   [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
*   [Migration Guide](docs/MIGRATION_GUIDE.md)

---

## License

Add your preferred license here.