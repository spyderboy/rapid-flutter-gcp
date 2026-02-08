// scripts/_config.mjs
import fs from 'fs';
import path from 'path';

const CONFIG_FILE_NAME = '.rapid-dev.json';

/**
 * Returns the default configuration structure for the rapid-dev starter kit.
 * This acts as a fallback if no custom configuration file is found or if it's malformed.
 *
 * @returns {object} The default configuration object.
 * @property {object} defaults - Default settings for new projects.
 * @property {string} defaults.org - Default GitHub organization.
 * @property {boolean} defaults.private - Default repository visibility (private or public).
 * @property {boolean} defaults.netlify - Default Netlify site creation.
 * @property {object} defaults.gcp - Default Google Cloud Platform settings.
 * @property {string} defaults.gcp.project - Default GCP project ID.
 * @property {string} defaults.gcp.region - Default GCP deployment region.
 */
function getDefaultConfig() {
  return {
    defaults: {
      org: '',
      private: false,
      netlify: false,
      gcp: {
        project: '',
        region: 'us-east1'
      }
    }
  };
}

/**
 * Loads the configuration from the `.rapid-dev.json` file in the current working directory.
 * If the file does not exist or is malformed, it falls back to a default configuration.
 *
 * @returns {object} The loaded or default configuration object.
 */
export function loadConfig() {
  const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);
  
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const userConfig = JSON.parse(configContent);
      // Merge with defaults to ensure all keys exist
      return { ...getDefaultConfig(), ...userConfig };
    } catch (e) {
      console.error(`Warning: Could not parse ${CONFIG_FILE_NAME}. Using default configuration.`, e.message);
      return getDefaultConfig();
    }
  }
  
  return getDefaultConfig();
}