import {
  useAdminListUsers,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

function fullName(user: { firstName: string | null; lastName: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
}

export default function AdminUsers() {
  const { isReady, isChecking } = useRequireAdmin();
  const { data: users, isLoading } = useAdminListUsers({
    query: { enabled: isReady, queryKey: getAdminListUsersQueryKey() },
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
            Everyone with an account, newest first. Read-only for now — role
            management (admin / advisor / member) arrives with the Clerk sign-in.
          </p>
        </div>

        <Card className="mt-8">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">{fullName(user)}</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
