import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ═══════════════════════════════════════════════════════════════════
// /bridge layout — Server-side session check (defense in depth)
// Middleware already protects this route, but this adds a second layer.
// ═══════════════════════════════════════════════════════════════════

export default async function BridgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return <>{children}</>;
}
