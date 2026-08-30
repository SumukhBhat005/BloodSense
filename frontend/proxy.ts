import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  // Allow all routes without mandatory sign in
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
