import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (session?.user) {
      const dest =
        session.user.role === "wholesale_admin"
          ? "/wholesale/dashboard"
          : "/retail/catalog";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/wholesale") && session.user.role !== "wholesale_admin") {
    return NextResponse.redirect(new URL("/retail/catalog", req.url));
  }

  if (pathname.startsWith("/retail") && session.user.role !== "retail_pharmacy") {
    return NextResponse.redirect(new URL("/wholesale/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
