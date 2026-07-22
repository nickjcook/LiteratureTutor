import { Link } from "wouter";
import { LogOut, KeyRound, LayoutDashboard, UserRound } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetAdminStatus,
  getGetAdminStatusQueryKey,
} from "@workspace/api-client-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { AuthUser } from "@workspace/replit-auth-web";

function displayName(user: AuthUser): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "Your account";
}

function initials(user: AuthUser): string {
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  const combined = `${first}${last}`.trim();
  if (combined) return combined.toUpperCase();
  return (user.email?.[0] ?? "?").toUpperCase();
}

export function UserMenu() {
  const { isLoading, isAuthenticated, user, login, logout } = useAuth();
  const { data: adminStatus } = useGetAdminStatus({
    query: { enabled: isAuthenticated, queryKey: getGetAdminStatusQueryKey() },
  });

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return (
      <Button size="sm" onClick={login} data-testid="button-login">
        Log in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Account menu"
          data-testid="button-user-menu"
        >
          <Avatar className="h-8 w-8">
            {user.profileImageUrl && (
              <AvatarImage src={user.profileImageUrl} alt="" />
            )}
            <AvatarFallback className="text-xs">{initials(user)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium" data-testid="text-user-name">
              {displayName(user)}
            </span>
            {user.email && (
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            )}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {adminStatus?.isAdmin && (
          <DropdownMenuItem asChild data-testid="menu-admin">
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden />
              Admin
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          data-testid="menu-change-password"
          onSelect={() =>
            toast({
              title: "Password management coming soon",
              description:
                "Changing your password will be available once the new Clerk sign-in is enabled.",
            })
          }
        >
          <KeyRound className="mr-2 h-4 w-4" aria-hidden />
          Change password
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout()} data-testid="button-logout">
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
