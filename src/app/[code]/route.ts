import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getClientIp,
  isBotUserAgent,
  parseUserAgent,
} from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || !/^[a-zA-Z0-9]+$/.test(code)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const link = await prisma.url.findUnique({ where: { shortCode: code } });
  if (!link) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ua = req.headers.get("user-agent") || "";
  const bot = isBotUserAgent(ua);
  const { device, browser, os } = parseUserAgent(ua);
  const ip = getClientIp(req.headers);
  const referer = req.headers.get("referer") || null;
  const country = req.headers.get("cf-ipcountry");
  const countryVal =
    country && country !== "XX" && country !== "" ? country : null;

  try {
    await prisma.click.create({
      data: {
        urlId: link.id,
        ip: ip || null,
        userAgent: ua || null,
        referer,
        country: countryVal,
        city: null,
        device,
        browser,
        os,
        isBot: bot,
      },
    });
  } catch {
    // ignore logging errors
  }

  if (!bot) {
    try {
      await prisma.url.update({
        where: { id: link.id },
        data: { clicks: { increment: 1 } },
      });
    } catch {
      // ignore
    }
  }

  if (bot) {
    const headers = new Headers({
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      "Referrer-Policy": "no-referrer",
      "Content-Type": "text/html; charset=utf-8",
    });

    if (!link.previewEnabled) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><title></title></head><body></body></html>`,
        { status: 200, headers }
      );
    }

    const title = link.title || "Breaking News";
    const description = link.description || "Latest updates and full story";
    const image = link.imageUrl || "";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin ||
      "https://localhost:3000";
    const shortUrl = `${siteUrl.replace(/\/$/, "")}/${link.shortCode}`;
    const siteName = "News Daily";

    const esc = (s: string) =>
      s
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, """);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(siteName)}">
<meta property="og:url" content="${esc(shortUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${image ? `<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ""}
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex, nofollow">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
</body>
</html>`;

    return new NextResponse(html, { status: 200, headers });
  }

  return NextResponse.redirect(link.longUrl, {
    status: 302,
    headers: {
      "Referrer-Policy": "no-referrer",
    },
  });
}
