import { ALLOWED_HOSTNAMES, SALES_UTM_PARAMS } from "@/config/utm";

export type TrackingUrlResult =
  | { ok: true; originalUrl: string; trackingUrl: string }
  | { ok: false; error: string };

export const ERROR_MESSAGES = {
  empty: "Please paste a NewJaisa website URL.",
  invalid: "Invalid URL: Please enter a valid NewJaisa website URL.",
  missingProtocol:
    "Invalid URL: Please include https:// at the start of the link (for example, https://newjaisa.com/products/...).",
  insecure: "Only secure NewJaisa links starting with https:// are allowed.",
  credentials: "Links containing a username or password are not allowed.",
  external: "External URL: Only NewJaisa website links are allowed.",
} as const;

function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.includes(hostname.toLowerCase());
}

function tryParse(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Parses and validates a URL entered by a salesperson. Only absolute HTTPS
 * URLs on an approved NewJaisa hostname are accepted. No network requests
 * are made.
 */
export function validateNewJaisaUrl(
  input: string,
): { ok: true; url: URL } | { ok: false; error: string } {
  const value = input.trim();
  if (!value) return { ok: false, error: ERROR_MESSAGES.empty };

  const url = tryParse(value);
  if (!url) {
    // Common mistake: pasting "newjaisa.com/products/..." without https://.
    const withProtocol = tryParse(`https://${value}`);
    if (withProtocol && isAllowedHostname(withProtocol.hostname)) {
      return { ok: false, error: ERROR_MESSAGES.missingProtocol };
    }
    return { ok: false, error: ERROR_MESSAGES.invalid };
  }

  if (url.protocol === "http:") {
    return { ok: false, error: ERROR_MESSAGES.insecure };
  }
  // Rejects javascript:, data:, ftp:, mailto:, etc.
  if (url.protocol !== "https:") {
    return { ok: false, error: ERROR_MESSAGES.invalid };
  }
  if (url.username || url.password) {
    return { ok: false, error: ERROR_MESSAGES.credentials };
  }
  // Exact hostname match; a non-default port is not the public website.
  if (!isAllowedHostname(url.hostname) || url.port !== "") {
    return { ok: false, error: ERROR_MESSAGES.external };
  }

  return { ok: true, url };
}

/**
 * Builds the Sales Team tracking link for a NewJaisa URL.
 *
 * - Non-UTM query parameters (variant IDs, filters, sort, gclid, fbclid, ...)
 *   and the URL fragment are preserved.
 * - Any existing utm_* parameters (in any letter case, including duplicates)
 *   are removed, then the standard Sales Team values are appended once each,
 *   so the link carries exactly one copy of each configured UTM parameter.
 */
export function generateTrackingUrl(input: string): TrackingUrlResult {
  const validation = validateNewJaisaUrl(input);
  if (!validation.ok) return validation;

  const url = validation.url;
  const originalUrl = url.toString();

  const existingUtmKeys = new Set(
    [...url.searchParams.keys()].filter((key) =>
      key.toLowerCase().startsWith("utm_"),
    ),
  );
  for (const key of existingUtmKeys) url.searchParams.delete(key);

  for (const [key, value] of Object.entries(SALES_UTM_PARAMS)) {
    url.searchParams.set(key, value);
  }

  return { ok: true, originalUrl, trackingUrl: url.toString() };
}
