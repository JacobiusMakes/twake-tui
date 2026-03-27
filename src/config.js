/**
 * Configuration reader for twake-tui
 *
 * Reads credentials from twake-cli's config file. The `conf` package
 * (used by twake-cli) stores JSON at a platform-specific path:
 *   macOS:  ~/Library/Preferences/twake-cli-nodejs/config.json
 *   Linux:  ~/.config/twake-cli-nodejs/config.json
 *
 * twake-tui is read-only — it never writes to this file.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

function getConfigPath() {
  const home = homedir();
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Preferences', 'twake-cli-nodejs', 'config.json');
    case 'win32':
      return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'twake-cli-nodejs', 'Config', 'config.json');
    default:
      // Linux / FreeBSD
      return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'twake-cli-nodejs', 'config.json');
  }
}

/**
 * Load the full config object from twake-cli's config.json.
 * Returns null if the file doesn't exist or can't be parsed.
 */
export function loadConfig() {
  try {
    const raw = readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check whether a specific service has the minimum required credentials.
 */
export function isConfigured(config, service) {
  if (!config) return false;
  const cfg = config[service];
  if (!cfg) return false;

  switch (service) {
    case 'matrix':
      return !!(cfg.homeserver && cfg.accessToken);
    case 'jmap':
      return !!(cfg.sessionUrl && cfg.bearerToken);
    case 'cozy':
      return !!(cfg.instanceUrl && cfg.token);
    default:
      return false;
  }
}

export { getConfigPath };
