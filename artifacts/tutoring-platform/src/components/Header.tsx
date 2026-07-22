import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetAdminStatus, getGetAdminStatusQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MetalanguageDictionary } from "./MetalanguageDictionary";
import { DisplayMenu } from "./DisplayMenu";
import { UserMenu } from "./UserMenu";

export function Header() {
  const { isAuthenticated } = useAuth();
  const { data: adminStatus } = useGetAdminStatus({
    query: { enabled: isAuthenticated, queryKey: getGetAdminStatusQueryKey() },
  });

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2 font-serif text-lg font-semibold tracking-tight">
          TELOS
          <span className="hidden font-sans text-sm font-normal text-muted-foreground sm:inline">
            English &amp; Literature
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Button asChild variant="ghost" size="sm" data-testid="link-curriculum-map">
            <Link href="/map">Curriculum Map</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" data-testid="link-library">
            <Link href="/library">Library</Link>
          </Button>
          {adminStatus?.isAdmin && (
            <Button asChild variant="ghost" size="sm" data-testid="link-admin">
              <Link href="/admin">Admin</Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <MetalanguageDictionary />
          <DisplayMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
