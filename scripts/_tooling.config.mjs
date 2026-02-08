// scripts/_tooling.config.mjs
export const tools = [
  // Core
  { key: "git",  cmd: "git",  win: { winget: "Git.Git", choco: "git" } },
  { key: "node", cmd: "node", win: { winget: "OpenJS.NodeJS.LTS", choco: "nodejs-lts" } },
  { key: "gh",   cmd: "gh",   win: { winget: "GitHub.cli", choco: "gh" } },

  // Netlify CLI (npm)
  { key: "netlify", cmd: "netlify", npmGlobal: "netlify-cli" },

  // GCP
  { key: "gcloud", cmd: "gcloud", win: { winget: "Google.CloudSDK", choco: "google-cloud-sdk" } },

  // Flutter SDK (special)
  { key: "flutter", cmd: "flutter", flutter: true },

  // Optional: pipx + aider
  { key: "pipx", cmd: "pipx", win: { winget: "Python.Pipx", choco: "pipx" }, optional: true },
  { key: "python", cmd: "python", win: { winget: "Python.Python.3.12", choco: "python" }, optional: true },

  // Aider (python)
  { key: "aider", cmd: "aider", pythonPackage: "aider-chat", optional: true },
];
