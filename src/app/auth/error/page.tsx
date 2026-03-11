import Link from "next/link";

/**
 * Auth error display page.
 *
 * Shows a Cooper-themed error message when magic link verification
 * or other auth flows fail. Uses Adventure Navy design tokens.
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ?? "An unknown error occurred";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-deep p-4">
      <div
        data-agent="cooper"
        className="w-full max-w-md rounded-2xl border-2 border-[rgba(59,130,246,0.25)] bg-bg-surface p-8 shadow-[0_8px_32px_-4px_rgba(59,130,246,0.12),0_4px_12px_-2px_rgba(0,0,0,0.5)]"
      >
        {/* Cooper icon indicator */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#3B82F6] bg-[rgba(59,130,246,0.1)]">
            <span className="text-2xl" role="img" aria-label="Alert">
              &#x26A0;
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-primary">
              Mission Error, Agent!
            </h1>
            <p className="text-sm text-ink-secondary">
              Cooper detected a problem
            </p>
          </div>
        </div>

        {/* Error message */}
        <div className="mb-6 rounded-xl border-2 border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] p-4">
          <p className="text-sm font-medium text-danger">{errorMessage}</p>
        </div>

        {/* Back to base link */}
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-xl border-2 border-[#3B82F6] bg-[rgba(59,130,246,0.1)] px-6 py-3 text-sm font-semibold text-[#3B82F6] transition-all hover:bg-[rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
        >
          Return to Base
        </Link>
      </div>
    </div>
  );
}
