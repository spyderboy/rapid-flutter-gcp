// scripts/_naming.mjs
const BAD_VERSION_TOKENS = new Set(["v1","v2","v3","v4","v5","final","latest","new","old"]);

export function toKebab(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function validateRepoName(name) {
  const errors = [];

  if (!/^[a-z0-9-]+$/.test(name)) errors.push("Use only lowercase letters, numbers, and hyphens.");
  if (/[A-Z_ ]/.test(name)) errors.push("No uppercase, underscores, or spaces.");
  if (name.includes("--")) errors.push("No double hyphens.");
  if (name.startsWith("-") || name.endsWith("-")) errors.push("No leading/trailing hyphen.");

  const parts = name.split("-").filter(Boolean);
  for (const p of parts) {
    if (BAD_VERSION_TOKENS.has(p)) errors.push(`Avoid versioning/placeholder token: "${p}".`);
    if (/^v\d+$/.test(p)) errors.push(`Avoid version token: "${p}".`);
  }

  // “At least two meaningful parts” helps enforce {project}-{description}
  if (parts.length < 2) errors.push("Use at least two segments, e.g. {project}-{description}.");

  return { ok: errors.length === 0, errors };
}

// optional helper: build a name from pieces (project + description etc.)
export function buildRepoName(...parts) {
  const name = toKebab(parts.filter(Boolean).join("-"));
  return name;
}
