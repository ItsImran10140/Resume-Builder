import { auth, signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-600">You are already signed in.</p>
      </div>
    );
  }

  const hasGitHub = !!(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  );
  const hasGoogle = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );
  const hasDevLogin =
    process.env.NODE_ENV === "development" && !!process.env.DEV_AUTH_EMAIL;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Continue to your resume workspace
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign-in failed. Please try again.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {hasGitHub && (
            <form
              action={async () => {
                "use server";
                await signIn("github", {
                  redirectTo: callbackUrl ?? "/editor",
                });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Continue with GitHub
              </button>
            </form>
          )}

          {hasGoogle && (
            <form
              action={async () => {
                "use server";
                await signIn("google", {
                  redirectTo: callbackUrl ?? "/editor",
                });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Continue with Google
              </button>
            </form>
          )}

          {hasDevLogin && (
            <form
              action={async (formData) => {
                "use server";
                const email = formData.get("email") as string;
                await signIn("credentials", {
                  email,
                  redirectTo: callbackUrl ?? "/editor",
                });
              }}
              className="flex flex-col gap-2 border-t border-zinc-200 pt-4"
            >
              <label className="text-xs font-medium text-zinc-600">
                Dev email login
              </label>
              <input
                name="email"
                type="email"
                defaultValue={process.env.DEV_AUTH_EMAIL}
                required
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Dev sign in
              </button>
            </form>
          )}

          {!hasGitHub && !hasGoogle && !hasDevLogin && (
            <p className="text-sm text-amber-700">
              Configure OAuth keys or DEV_AUTH_EMAIL in .env.local to enable
              sign-in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
