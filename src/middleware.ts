import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const PENDING_ROUTE = "/pending-approval";

function dashboardFor(role: string) {
  return role === "wholesale_admin" ? "/wholesale/dashboard" : "/retail/catalog";
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Public news is open to everyone, signed in or not.
  if (pathname.startsWith("/news")) {
    return NextResponse.next();
  }

  // A retail pharmacy whose account has not been approved yet.
  const isUnapprovedRetail =
    user?.role === "retail_pharmacy" && user?.status !== "active";

  // The holding page for unapproved pharmacies.
  if (pathname === PENDING_ROUTE) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Approved users and admins have no business here.
    if (!isUnapprovedRetail) {
      return NextResponse.redirect(new URL(dashboardFor(user.role), req.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (user) {
      if (isUnapprovedRetail) {
        return NextResponse.redirect(new URL(PENDING_ROUTE, req.url));
      }
      return NextResponse.redirect(new URL(dashboardFor(user.role), req.url));
    }
    return NextResponse.next();
  }

  // Protected routes below.
  if (!user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Unapproved pharmacies cannot reach any protected route.
  if (isUnapprovedRetail) {
    return NextResponse.redirect(new URL(PENDING_ROUTE, req.url));
  }

  if (pathname.startsWith("/wholesale") && user.role !== "wholesale_admin") {
    return NextResponse.redirect(new URL("/retail/catalog", req.url));
  }

  if (pathname.startsWith("/retail") && user.role !== "retail_pharmacy") {
    return NextResponse.redirect(new URL("/wholesale/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
