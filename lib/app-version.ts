import packageJson from "@/package.json";

/** Release channel shown to users. Bump package.json version for releases. */
export const APP_CHANNEL = "beta" as const;

export const APP_VERSION = packageJson.version;

export function getAppVersionLabel() {
  return `v${APP_VERSION} (${APP_CHANNEL})`;
}
