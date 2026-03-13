import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and
 * enforces route-level protection:
 *
 *  - /play/*   without a session  -> redirect to /
 *  - /parent/* without a session  -> redirect to /
 *  - /         with a session     -> redirect to /play (layout handles parent→/parent)
 *  - /setup    always allowed     (parent lands here after magic link)
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  // DEV BYPASS: skip Supabase entirely when NEXT_PUBLIC_DEV_SKIP_AUTH=true
  const devSkipAuth = process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";
  if (devSkipAuth) return supabaseResponse;

  // Start with a "pass-through" response so cookies can be forwarded
  let supabaseResponseWithCookies = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror cookies onto the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Recreate the response so it picks up the updated request cookies
          supabaseResponseWithCookies = NextResponse.next({
            request,
          });

          // Set cookies on the outgoing response (sent to the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponseWithCookies.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: Call getUser() immediately after creating the client.
  // Do NOT put any code between createServerClient and getUser().
  // getUser() sends a request to the Supabase Auth server to revalidate
  // the session and refresh the token if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Route protection: unauthenticated users cannot access /play or /parent
  if (!user && (pathname.startsWith("/play") || pathname.startsWith("/parent"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Convenience redirect: authenticated users landing on / go to /play.
  // Role-based split (student vs parent) happens inside each portal layout.
  // If a parent hits /play their layout will redirect them to /parent.
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/play";
    return NextResponse.redirect(url);
  }

  // /setup is always allowed (parent needs access after magic link)

  return supabaseResponseWithCookies;
}
