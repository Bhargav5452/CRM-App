// Vercel Edge Middleware — Safari 9 / iOS 9.3.5 detection
// This middleware redirects Safari 9 users to /legacy/ which serves
// the Ionic-free React build compiled to ES5.
// Modern browsers are completely unaffected.

import { NextResponse, NextRequest } from "next/server";

// Safari 9 UA contains "Version/9" (not 10, 11, 12...) and "Safari"
// iOS 9 UA contains "OS 9_" pattern
function isSafari9(ua: string): boolean {
  // Check for Safari version 9.x: "Version/9.0" or "Version/9.1" etc.
  // but NOT "Version/10" or higher
  const safari9Pattern = /Version\/9\.\d+.*Safari/i;
  // Check for iOS 9 WebKit: "OS 9_" in User-Agent
  const ios9Pattern = /OS 9_\d/i;
  return safari9Pattern.test(ua) || ios9Pattern.test(ua);
}

export const config = {
  matcher: [
    // Run on all paths EXCEPT:
    // - Already /legacy/* paths
    // - Static files (assets, favicons, manifest etc.)
    // - API routes
    "/((?!legacy|_next|api|favicon|manifest|assets|icons).*)",
  ],
};

export default function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";

  if (isSafari9(ua)) {
    // Build the equivalent /legacy/ URL
    const url = request.nextUrl.clone();
    const originalPath = url.pathname;

    // Don't double-redirect /legacy paths
    if (!originalPath.startsWith("/legacy")) {
      url.pathname = "/legacy" + (originalPath === "/" ? "" : originalPath);
      return NextResponse.redirect(url, { status: 302 });
    }
  }

  return NextResponse.next();
}
