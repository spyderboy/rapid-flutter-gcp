// scripts/_naming.mjs
const BAD_VERSION_TOKENS = new Set([
  "v1","v2","v3","v4","v5","v6","v7","v8","v9","v10",
  "final","latest","new","old","release","rev",
]);

/**
 * Converts a string to kebab-case, removing special characters and ensuring lowercase.
 *
 * @param {string} s - The input string.
 * @returns {string} The kebab-cased string.
 */
export function toKebab(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Builds a repository name based on provided components, enforcing naming conventions.
 * Supports general, service, and component naming patterns.
 *
 * @param {object} options - The options object.
 * @param {string} [options.prefix] - An optional prefix for the repository name (e.g., 'frontend').
 * @param {string} [options.project] - The project name.
 * @param {string} [options.description] - A description for the project.
 * @param {string} [options.service] - The service name.
 * @param {string} [options.type] - The type of service (e.g., 'api').
 * @param {string} [options.team] - The team name.
 * @param {string} [options.component] - The component name.
 * @param {string} [options.raw] - A raw name to be directly converted to kebab-case, overriding other options.
 * @returns {string} The constructed repository name in kebab-case.
 */
export function buildRepoName({ prefix, project, description, service, type, team, component, raw }) {
  if (raw) return toKebab(raw);

  // Supported patterns:
  // General:   {project}-{description}
  // Services:  {project}-{service}-{type}
  // Components:{team}-{component}
  let parts = [];

  if (team || component) {
    parts = [team, component];
  } else if (service || type) {
    parts = [project, service, type];
  } else {
    parts = [project, description];
  }

  const base = toKebab(parts.filter(Boolean).join("-"));
  const full = prefix ? toKebab(`${prefix}-${base}`) : base;
  return full;
}

/**
 * Validates a repository name against a set of predefined naming rules.
 *
 * @param {string} name - The repository name to validate.
 * @returns {{ok: boolean, errors: string[]}} An object indicating if the name is valid (`ok`) and a list of error messages (`errors`).
 */
export function validateRepoName(name) {
  const errors = [];
  const n = String(name ?? "");

  if (!/^[a-z0-9-]+$/.test(n)) errors.push("Use only lowercase letters, numbers, and hyphens.");
  if (/[A-Z_ ]/.test(n)) errors.push("No uppercase, underscores, or spaces.");
  if (n.includes("--")) errors.push("No double hyphens.");
  if (n.startsWith("-") || n.endsWith("-")) errors.push("No leading/trailing hyphen.");

  const parts = n.split("-").filter(Boolean);
  if (parts.length < 2) errors.push("Use at least two segments, e.g., {project}-{description}.");

  for (const p of parts) {
    if (BAD_VERSION_TOKENS.has(p)) errors.push(`Avoid versioning/placeholder token: "${p}".`);
    if (/^v\d+$/.test(p)) errors.push(`Avoid version token: "${p}".`);
  }

  return { ok: errors.length === 0, errors };
}