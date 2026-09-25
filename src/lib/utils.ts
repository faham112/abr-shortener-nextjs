import { prisma } from "./prisma";

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateShortCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function createUniqueShortCode(maxAttempts = 8): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateShortCode();
    const exists = await prisma.url.findUnique({ where: { shortCode: code } });
    if (!exists) return code;
  }
  // fallback longer code
  return generateShortCode(10) + Date.now().toString(36).slice(-4);
}

const BOT_KEYWORDS = [
  "whatsapp", "facebookexternalhit", "facebot", "twitterbot", "telegrambot",
  "linkedinbot", "slackbot", "discordbot", "pinterest", "googlebot", "bingbot",
  "yandex", "baiduspider", "embedly", "quora link preview", "showyoubot",
  "outbrain", "vkshare", "redditbot", "applebot", "tumblr", "skypeuripreview",
  "viber", "line", "bot", "crawler", "spider", "preview", "facebookcatalog",
  "meta-externalagent", "meta-externalfetcher",
];

export function isBotUserAgent(ua: string): boolean {
  if (!ua || ua.length < 25) return true;
  const lower = ua.toLowerCase();
  return BOT_KEYWORDS.some((b) => lower.includes(b));
}

export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const lower = (ua || "").toLowerCase();
  let device = "Desktop";
  let browser = "Unknown";
  let os = "Unknown";

  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone") || lower.includes("ipod")) {
    device = "Mobile";
  } else if (lower.includes("tablet") || lower.includes("ipad")) {
    device = "Tablet";
  }

  if (lower.includes("edg/") || lower.includes("edge")) browser = "Edge";
  else if (lower.includes("chrome") && !lower.includes("chromium")) browser = "Chrome";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("opera") || lower.includes("opr/")) browser = "Opera";
  else if (lower.includes("msie") || lower.includes("trident")) browser = "IE";

  if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("mac os") || lower.includes("macintosh")) os = "MacOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ios")) os = "iOS";
  else if (lower.includes("linux")) os = "Linux";

  return { device, browser, os };
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function getClientIp(headers: Headers): string | null {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip");
}
