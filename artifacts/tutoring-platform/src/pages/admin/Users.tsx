import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, ShieldCheck, ShieldOff, Trash2, Info } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useAdminListUsers,
  getAdminListUsersQueryKey,
  useAdminSetUserAdmin,
  useAdminDeleteUser,
  type AdminUserSummary,
} from "@workspace/api-client-react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

function fullName(user: { firstName: string | null; lastName: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
}

export default function AdminUsers() {
  const { isReady, isChecking } = useRequireAdmin();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [userToDelete, setUserToDelete] = useState<AdminUserSummary | null>(null);

  const { data: users, isLoading } = useAdminListUsers({
    query: { enabled: isReady, queryKey: getAdminListUsersQueryKey() },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });

  const setAdmin = useAdminSetUserAdmin({
    mutation: {
      onSuccess: async (updated) => {
        await invalidate();
        toast({
          title: updated.isAdmin ? "Admin access granted" : "Admin access removed",
          description: `${fullName(updated)} (${updated.email ?? updated.id})`,
        });
      },
      onError: (err) =>
        toast({
          title: "Couldn't update role",
          description: err instanceof Error ? err.message : "Unexpected error",
          variant: "destructive",
        }),
    },
  });

  const deleteUser = useAdminDeleteUser({
    mutation: {
      onSuccess: async () => {
        await invalidate();
        toast({ title: "User deleted" });
        setUserToDelete(null);
      },
      onError: (err) => {
        toast({
          title: "Couldn't delete user",
          description: err instanceof Error ? err.message : "Unexpected error",
          variant: "destructive",
        });
        setUserToDelete(null);
      },
    },
  });

  if (isChecking || !isReady) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">
          {isChecking ? "Checking access…" : "Redirecting…"}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Users</h1>
          <p className="mt-1 text-muted-foreground">
            Everyone with an account, newest first. Grant or remove admin access,
            or delete an account.
          </p>
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-2 pt-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              <strong className="text-foreground">Adding a user:</strong> accounts are
              created by signing in — ask the person to log in once with Replit and
              they'll appear here, ready for you to manage. Fuller roles
              (admin / advisor / member) arrive with the Clerk sign-in later.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="px-0 py-2">
            {isLoading ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
            ) : !users || users.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-12 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isSelf = me?.id === user.id;
                      return (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">
                            {fullName(user)}
                            {isSelf && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email ?? "—"}
                          </TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge>Admin</Badge>
                            ) : (
                              <Badge variant="secondary">
                                {user.yearLevel != null ? "Student" : "Member"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.yearLevel ?? "—"}</TableCell>
                          <TableCell>{user.courseType ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.school ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Actions for ${fullName(user)}`}
                                  disabled={isSelf}
                                  title={
                                    isSelf
                                      ? "You can't change your own account — another admin has to."
                                      : undefined
                                  }
                                  data-testid={`button-user-actions-${user.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={setAdmin.isPending}
                                  onSelect={() =>
                                    setAdmin.mutate({
                                      id: user.id,
                                      data: { isAdmin: !user.isAdmin },
                                    })
                                  }
                                  data-testid={`menu-toggle-admin-${user.id}`}
                                >
                                  {user.isAdmin ? (
                                    <>
                                      <ShieldOff className="mr-2 h-4 w-4" aria-hidden />
                                      Remove admin access
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                                      Make admin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => setUserToDelete(user)}
                                  data-testid={`menu-delete-user-${user.id}`}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                                  Delete user…
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={userToDelete != null}
          onOpenChange={(open) => !open && setUserToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this user?</AlertDialogTitle>
              <AlertDialogDescription>
                {userToDelete && (
                  <>
                    <strong>{fullName(userToDelete)}</strong>{" "}
                    ({userToDelete.email ?? userToDelete.id}) and all their data —
                    profile, progress and any admin access — will be permanently
                    removed and they will be signed out. This cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteUser.isPending}
                onClick={() =>
                  userToDelete && deleteUser.mutate({ id: userToDelete.id })
                }
                data-testid="button-confirm-delete"
              >
                {deleteUser.isPending ? "Deleting…" : "Delete user"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
