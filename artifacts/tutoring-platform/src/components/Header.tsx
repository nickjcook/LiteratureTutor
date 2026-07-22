import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetAdminStatus, getGetAdminStatusQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MetalanguageDictionary } from "./MetalanguageDictionary";
import { DisplayMenu } from "./DisplayMenu";
import { UserMenu } from "./UserMenu";
import telosIcon from "@/assets/telos_icon_128.png";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

export function Header() {
  const { isAuthenticated } = useAuth();
  const { data: adminStatus } = useGetAdminStatus({
    query: { enabled: isAuthenticated, queryKey: getGetAdminStatusQueryKey() },
  });

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight">
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <img src={telosIcon} alt="" className="h-8 w-8 rounded-md" />
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-[16.5rem] p-5">
              <div className="flex flex-col items-center gap-3.5 text-center">
                {/* h-32 = 128px: keeps the source 1:1 — do not scale, it
                    reintroduces resampling blur */}
                <img
                  src={telosIcon}
                  alt="TELOS — τέλος inscribed on a tablet"
                  className="h-32 w-32 rounded-xl shadow-md"
                />
                <div>
                  <p className="font-serif text-xl font-semibold tracking-tight">
                    TELOS
                  </p>
                  <p className="mt-1.5 font-serif text-base italic leading-snug text-muted-foreground">
                    the end at which all learning aims
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <span className="flex items-baseline gap-2">
            TELOS
            <span className="hidden font-sans text-sm font-normal text-muted-foreground sm:inline">
              English &amp; Literature
            </span>
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
            <>
              <Button asChild variant="ghost" size="sm" data-testid="link-admin">
                <Link href="/admin">Admin</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" data-testid="link-admin-settings">
                <Link href="/admin/settings">Settings</Link>
              </Button>
            </>
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
