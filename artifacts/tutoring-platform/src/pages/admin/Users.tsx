import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  GraduationCap,
  UserPlus,
  KeyRound,
  Copy,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useAdminListUsers,
  getAdminListUsersQueryKey,
  useAdminSetUserAdmin,
  useAdminDeleteUser,
  useAdminUpsertUserProfile,
  useAdminClearUserProfile,
  useAdminImpersonateUser,
  useAdminCreateUser,
  useAdminSetUserPassword,
  type AdminUserSummary,
  type CourseType,
} from "@workspace/api-client-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Layout } from "@/components/Layout";
import { COURSE_LABELS } from "@/components/DocumentCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

const YEAR_LEVELS = [7, 8, 9, 10, 11, 12];

function fullName(user: { firstName: string | null; lastName: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
}

export default function AdminUsers() {
  const { isReady, isChecking } = useRequireAdmin();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();

  const [userToDelete, setUserToDelete] = useState<AdminUserSummary | null>(null);
  const [userToEdit, setUserToEdit] = useState<AdminUserSummary | null>(null);
  const [yearLevel, setYearLevel] = useState("");
  const [courseType, setCourseType] = useState("");
  const [school, setSchool] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addFirst, setAddFirst] = useState("");
  const [addLast, setAddLast] = useState("");
  const [addIsAdmin, setAddIsAdmin] = useState(false);
  // One-time reveal of a server-generated password; shown until dismissed.
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const { data: users, isLoading } = useAdminListUsers({
    query: { enabled: isReady, queryKey: getAdminListUsersQueryKey() },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });

  const mutationError = (title: string) => (err: unknown) =>
    toast({
      title,
      description: err instanceof Error ? err.message : "Unexpected error",
      variant: "destructive",
    });

  const setAdmin = useAdminSetUserAdmin({
    mutation: {
      onSuccess: async (updated) => {
        await invalidate();
        toast({
          title: updated.isAdmin ? "Admin access granted" : "Admin access removed",
          description: `${fullName(updated)} (${updated.email ?? updated.id})`,
        });
      },
      onError: mutationError("Couldn't update role"),
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
        mutationError("Couldn't delete user")(err);
        setUserToDelete(null);
      },
    },
  });

  const upsertProfile = useAdminUpsertUserProfile({
    mutation: {
      onSuccess: async (updated) => {
        await invalidate();
        toast({
          title: "Profile updated",
          description: `${fullName(updated)} — Year ${updated.yearLevel}, ${
            COURSE_LABELS[updated.courseType ?? ""] ?? updated.courseType
          }`,
        });
        setUserToEdit(null);
      },
      onError: mutationError("Couldn't update profile"),
    },
  });

  const clearProfile = useAdminClearUserProfile({
    mutation: {
      onSuccess: async (updated) => {
        await invalidate();
        toast({
          title: "Profile cleared",
          description: `${fullName(updated)} will go through onboarding again.`,
        });
        setUserToEdit(null);
      },
      onError: mutationError("Couldn't clear profile"),
    },
  });

  const createUser = useAdminCreateUser({
    mutation: {
      onSuccess: async (result) => {
        await invalidate();
        setAddOpen(false);
        setAddEmail("");
        setAddFirst("");
        setAddLast("");
        setAddIsAdmin(false);
        if (result.temporaryPassword) {
          setCredentials({
            email: result.user.email ?? "",
            password: result.temporaryPassword,
          });
        } else {
          toast({ title: "User created" });
        }
      },
      onError: mutationError("Couldn't create user"),
    },
  });

  const setPassword = useAdminSetUserPassword({
    mutation: {
      onSuccess: async (result, vars) => {
        await invalidate();
        const target = users?.find((u) => u.id === vars.id);
        if (result.temporaryPassword) {
          setCredentials({
            email: target?.email ?? "",
            password: result.temporaryPassword,
          });
        } else {
          toast({ title: "Password set" });
        }
      },
      onError: mutationError("Couldn't reset password"),
    },
  });

  const impersonate = useAdminImpersonateUser({
    mutation: {
      onSuccess: () => {
        // Full reload as the target user; all cached queries must go.
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: mutationError("Couldn't impersonate"),
    },
  });

  function openEdit(user: AdminUserSummary) {
    setUserToEdit(user);
    setYearLevel(user.yearLevel != null ? String(user.yearLevel) : "");
    setCourseType(user.courseType ?? "");
    setSchool(user.school ?? "");
  }

  function submitProfile(e: FormEvent) {
    e.preventDefault();
    if (!userToEdit || yearLevel === "" || courseType === "") return;
    upsertProfile.mutate({
      id: userToEdit.id,
      data: {
        yearLevel: Number(yearLevel),
        courseType: courseType as CourseType,
        school: school.trim() === "" ? null : school.trim(),
      },
    });
  }

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold">Users</h1>
            <p className="mt-1 text-muted-foreground">
              Everyone with an account, newest first. Create accounts, set study
              profiles, reset passwords, impersonate for testing, or delete.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-user">
            <UserPlus className="mr-1.5 h-4 w-4" aria-hidden /> Add user
          </Button>
        </div>

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
                          <TableCell>
                            {user.courseType
                              ? COURSE_LABELS[user.courseType] ?? user.courseType
                              : "—"}
                          </TableCell>
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
                                  data-testid={`button-user-actions-${user.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => openEdit(user)}
                                  data-testid={`menu-edit-profile-${user.id}`}
                                >
                                  <GraduationCap className="mr-2 h-4 w-4" aria-hidden />
                                  {user.yearLevel != null
                                    ? "Edit profile…"
                                    : "Set profile…"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={isSelf || impersonate.isPending}
                                  onSelect={() => impersonate.mutate({ id: user.id })}
                                  data-testid={`menu-impersonate-${user.id}`}
                                >
                                  <UserCog className="mr-2 h-4 w-4" aria-hidden />
                                  Impersonate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={setPassword.isPending}
                                  onSelect={() => setPassword.mutate({ id: user.id, data: {} })}
                                  data-testid={`menu-reset-password-${user.id}`}
                                >
                                  <KeyRound className="mr-2 h-4 w-4" aria-hidden />
                                  Reset password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={isSelf || setAdmin.isPending}
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
                                  disabled={isSelf}
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

        {/* Profile editor — works on any user, including yourself, so an admin
            can test every year level and course. */}
        <Dialog
          open={userToEdit != null}
          onOpenChange={(open) => !open && setUserToEdit(null)}
        >
          <DialogContent className="sm:max-w-md">
            <form onSubmit={submitProfile}>
              <DialogHeader>
                <DialogTitle className="font-serif">
                  Study profile — {userToEdit ? fullName(userToEdit) : ""}
                </DialogTitle>
                <DialogDescription>
                  Sets what the curriculum map and library show this user.
                  Clearing the profile sends them through onboarding again.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-year">Year level</Label>
                  <Select value={yearLevel} onValueChange={setYearLevel}>
                    <SelectTrigger id="edit-year" data-testid="select-edit-year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_LEVELS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          Year {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-course">Course</Label>
                  <Select value={courseType} onValueChange={setCourseType}>
                    <SelectTrigger id="edit-course" data-testid="select-edit-course">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COURSE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-school">School (optional)</Label>
                  <Input
                    id="edit-school"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="School name"
                    data-testid="input-edit-school"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                {userToEdit?.yearLevel != null ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive"
                    disabled={clearProfile.isPending}
                    onClick={() =>
                      userToEdit && clearProfile.mutate({ id: userToEdit.id })
                    }
                    data-testid="button-clear-profile"
                  >
                    {clearProfile.isPending ? "Clearing…" : "Clear profile"}
                  </Button>
                ) : (
                  <span />
                )}
                <Button
                  type="submit"
                  disabled={
                    yearLevel === "" || courseType === "" || upsertProfile.isPending
                  }
                  data-testid="button-save-profile"
                >
                  {upsertProfile.isPending ? "Saving…" : "Save profile"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create a tester/user account with local credentials. */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (addEmail.trim() === "") return;
                createUser.mutate({
                  data: {
                    email: addEmail.trim(),
                    firstName: addFirst.trim() === "" ? null : addFirst.trim(),
                    lastName: addLast.trim() === "" ? null : addLast.trim(),
                    isAdmin: addIsAdmin,
                  },
                });
              }}
            >
              <DialogHeader>
                <DialogTitle className="font-serif">Add user</DialogTitle>
                <DialogDescription>
                  Creates an account with a generated temporary password —
                  shown once, so copy it for the tester.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="add-first">First name</Label>
                    <Input
                      id="add-first"
                      value={addFirst}
                      onChange={(e) => setAddFirst(e.target.value)}
                      data-testid="input-add-first"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-last">Last name</Label>
                    <Input
                      id="add-last"
                      value={addLast}
                      onChange={(e) => setAddLast(e.target.value)}
                      data-testid="input-add-last"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email (their sign-in name)</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="tester@example.com"
                    data-testid="input-add-email"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="add-admin"
                    checked={addIsAdmin}
                    onCheckedChange={(v) => setAddIsAdmin(v === true)}
                    data-testid="checkbox-add-admin"
                  />
                  <Label htmlFor="add-admin" className="font-normal">
                    Grant admin access
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={addEmail.trim() === "" || createUser.isPending}
                  data-testid="button-create-user"
                >
                  {createUser.isPending ? "Creating…" : "Create user"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* One-time reveal of generated credentials. */}
        <Dialog
          open={credentials != null}
          onOpenChange={(open) => !open && setCredentials(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Sign-in details</DialogTitle>
              <DialogDescription>
                Copy these now — the password is not shown again. The user can
                change it after signing in.
              </DialogDescription>
            </DialogHeader>
            {credentials && (
              <div className="space-y-2 rounded-md border bg-muted/40 p-4 font-mono text-sm">
                <p data-testid="text-cred-email">
                  <span className="text-muted-foreground">email: </span>
                  {credentials.email}
                </p>
                <p data-testid="text-cred-password">
                  <span className="text-muted-foreground">password: </span>
                  {credentials.password}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  if (!credentials) return;
                  navigator.clipboard.writeText(
                    `email: ${credentials.email}\npassword: ${credentials.password}`,
                  );
                  toast({ title: "Copied to clipboard" });
                }}
                data-testid="button-copy-credentials"
              >
                <Copy className="mr-1.5 h-4 w-4" aria-hidden /> Copy
              </Button>
              <Button onClick={() => setCredentials(null)} data-testid="button-close-credentials">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
