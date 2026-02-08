# 🚀 Monorepo Starter Template

> Full-stack monorepo for Flutter web/mobile apps and Node.js APIs deployed to Google Cloud

---

## 📁 Project Structure

```
.
├── apps/
│   └── client/              # Flutter app (web + mobile)
├── functions/
│   └── api/                 # Node/TypeScript API for GCP
├── scripts/
│   └── *.mjs                # Helper scripts (zip, deploy, smoke tests)
└── netlify.toml             # Netlify build configuration
```

---

## ⚙️ Prerequisites

### Install & Authenticate Tools

Run the bootstrap script to install all required tools:

```bash
node scripts/bootstrap.mjs
```

Then authenticate with each service:

```bash
gh auth login
netlify login
gcloud auth login
```

---

## 💻 Local Development

### Flutter App (Web + Mobile)

```bash
cd apps/client
flutter pub get
flutter run
```

**Run web specifically:**

```bash
flutter run -d chrome
```

---

### API (TypeScript)

```bash
cd functions/api
npm install
npm run dev:ts
```

> This starts a local dev server with auto-reload

---

## 🚢 Deployments

### 🌐 Web (Netlify)

Netlify auto-deploys on push with these settings:

| Setting | Value |
|---------|-------|
| **Build from** | `apps/client` |
| **Command** | `flutter build web --release` |
| **Publish** | `apps/client/build/web` |

**Deploy:**

```bash
git push
```

Or use Netlify CLI for manual deploys.

---

### ☁️ API (Google Cloud)

#### Environment Variables

Set these before deploying:

```bash
GCP_PROJECT=your-project-id
GCP_REGION=us-east1
GCP_SERVICE=api
GCP_ENTRY_POINT=handler
```

Or copy from template:

```bash
cp .env.example .env
```

---

#### Option A: Cloud Functions (default)

```bash
cd functions/api
npm run deploy:functions
```

**Or from repo root:**

```bash
node scripts/deploy-api.mjs \
  --target functions \
  --project your-project-id \
  --region us-east1 \
  --service api
```

---

#### Option B: Cloud Run Service

```bash
cd functions/api
npm run deploy:run
```

**Or from repo root:**

```bash
node scripts/deploy-api.mjs \
  --target run \
  --project your-project-id \
  --region us-east1 \
  --service api
```

---

## 🛠️ Helper Scripts

All helper scripts live in the root `scripts/` folder.

### Smoke Test

Verifies project structure and dependencies:

```bash
node scripts/smoke.mjs
```

---

### Zip Flutter Source

Creates a zip of Flutter source (excludes build artifacts):

```bash
node scripts/zip-flutter.mjs
```

**Output:**
```
artifacts/flutter-source-<timestamp>.zip
```

---

### Deploy API from Root

Wrapper around the API deploy script:

```bash
node scripts/deploy-api.mjs --target functions --project your-project-id
```

---

## 🆕 Creating a New Project

Generate a new project from this template:

```bash
node scripts/new-project.mjs \
  --project myapp \
  --description frontend \
  --org your-github-org \
  --private \
  --netlify
```

### Example Outputs

| Command | Generated Repo Name |
|---------|---------------------|
| `--project website --description frontend` | `website-frontend` |
| `--project ecom --service order --type api` | `ecom-order-api` |
| `--team data --component analytics-module` | `data-analytics-module` |

### Naming Rules

- ✅ Lowercase only
- ✅ Hyphen-separated
- ✅ At least two segments
- ❌ No version tokens (v2, final, etc.)

---

## 🔐 Environment Variables

Copy the example file and edit:

```bash
cp .env.example .env
```

**Typical values:**

```bash
GCP_PROJECT=your-project-id
GCP_REGION=us-east1
GCP_SERVICE=api
GCP_ENTRY_POINT=handler
```

---

## 🔄 Toolchain Maintenance

Update all core tools to latest versions:

```bash
node scripts/bootstrap.mjs
```

**Behavior:**
- If tool is missing → installs it
- If tool exists → updates it

---

## 📋 Recommended Workflow

### First Time Setup

```bash
# 1. Clone template
git clone <template-repo>
cd <template-repo>

# 2. Install tools
node scripts/bootstrap.mjs

# 3. Authenticate services
gh auth login
netlify login
gcloud auth login
```

---

### Start a New Project

```bash
node scripts/new-project.mjs \
  --project myapp \
  --description frontend \
  --private
```

---

### Daily Development

**Flutter app:**
```bash
cd apps/client
flutter run
```

**API:**
```bash
cd functions/api
npm run dev:ts
```

---

## 📄 License

Add your preferred license here.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Flutter & Node.js**
