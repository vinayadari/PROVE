import dns from "dns/promises";
import net from "net";

export interface SsrfValidationResult {
  valid: boolean;
  error?: string;
  ip?: string;
  url?: URL;
}

/**
 * Checks whether an IPv4 address belongs to a private, loopback, link-local,
 * or cloud metadata IP range.
 */
export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata service e.g. AWS/GCP 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (parts.every((p) => p === 255)) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is loopback, unique local, link-local,
 * or IPv4-mapped private address.
 */
export function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1 loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // Unspecified ::
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // Unique local (fc00::/7, fd00::/8)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-local (fe80::/10)
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (normalized.includes("::ffff:")) {
    const v4Part = normalized.split("::ffff:")[1];
    if (v4Part && net.isIPv4(v4Part)) {
      return isPrivateIpv4(v4Part);
    }
  }

  return false;
}

/**
 * Validates that an untrusted candidate URL:
 * 1. Has http: or https: scheme
 * 2. Has a valid public hostname
 * 3. Does not resolve to internal, loopback, or cloud metadata IP addresses
 */
export async function validatePublicUrl(rawUrl: string): Promise<SsrfValidationResult> {
  let parsed: URL;
  try {
    const trimmed = rawUrl.trim();
    // Only prefix https:// if no scheme is specified at all
    const formatted = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    parsed = new URL(formatted);
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  // Strict protocol check
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: `Forbidden protocol "${parsed.protocol}". Only HTTP and HTTPS schemes are allowed.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Known blacklisted hostnames
  const forbiddenHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "169.254.169.254",
  ];

  if (forbiddenHosts.includes(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return {
      valid: false,
      error: `Access to internal, loopback, cloud metadata, or private host "${hostname}" is prohibited.`,
    };
  }

  // If hostname is directly an IP literal
  if (net.isIPv4(hostname)) {
    if (isPrivateIpv4(hostname)) {
      return {
        valid: false,
        error: `Access to private IP address "${hostname}" is prohibited.`,
      };
    }
    return { valid: true, ip: hostname, url: parsed };
  }

  if (net.isIPv6(hostname)) {
    if (isPrivateIpv6(hostname)) {
      return {
        valid: false,
        error: `Access to private IPv6 address "${hostname}" is prohibited.`,
      };
    }
    return { valid: true, ip: hostname, url: parsed };
  }

  // Resolve hostname via DNS
  try {
    const resolved = await dns.lookup(hostname, { all: true });
    if (!resolved || resolved.length === 0) {
      return { valid: false, error: `Could not resolve hostname "${hostname}".` };
    }

    for (const record of resolved) {
      if (record.family === 4 && isPrivateIpv4(record.address)) {
        return {
          valid: false,
          error: `Hostname "${hostname}" resolved to private IP "${record.address}". Access denied.`,
        };
      }
      if (record.family === 6 && isPrivateIpv6(record.address)) {
        return {
          valid: false,
          error: `Hostname "${hostname}" resolved to private IPv6 "${record.address}". Access denied.`,
        };
      }
    }

    return {
      valid: true,
      ip: resolved[0].address,
      url: parsed,
    };
  } catch (dnsErr: any) {
    return {
      valid: false,
      error: `DNS lookup failed for "${hostname}": ${dnsErr.message || "Host not found"}`,
    };
  }
}
