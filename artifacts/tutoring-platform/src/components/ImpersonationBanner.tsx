import { UserCog } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useStopImpersonating } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

function label(user: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "user";
}

// Rendered by Layout on every page. INVARIANT: any new layout/shell must
// include this banner — an admin must always be able to see that they're
// impersonating, and always be able to stop.
export function ImpersonationBanner() {
  const { user, impersonator } = useAuth();
  const stop = useStopImpersonating({
    mutation: {
      onSuccess: () => {
        // Full reload: every cached query in the app belongs to the
        // impersonated user and must be discarded.
        window.location.href = import.meta.env.BASE_URL;
      },
    },
  });

  if (!impersonator || !user) return null;

  return (
    <div
      className="sticky top-0 z-50 border-b border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
      role="status"
      data-testid="banner-impersonation"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
        <p className="flex items-center gap-2">
          <UserCog className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Impersonating <strong>{label(user)}</strong> — you are{" "}
            {label(impersonator)}. Everything you do happens as this user.
          </span>
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-500 bg-transparent hover:bg-amber-200 dark:hover:bg-amber-900"
          disabled={stop.isPending}
          onClick={() => stop.mutate()}
          data-testid="button-stop-impersonating"
        >
          {stop.isPending ? "Stopping…" : "Stop impersonating"}
        </Button>
      </div>
    </div>
  );
}
