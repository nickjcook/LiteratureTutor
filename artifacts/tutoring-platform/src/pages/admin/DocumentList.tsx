import { useState } from "react";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { useAdminListDocuments, getAdminListDocumentsQueryKey } from "@workspace/api-client-react";
import type { DocumentStatus } from "@workspace/api-client-react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDocumentList() {
  const { isReady, isChecking } = useRequireAdmin();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const listParams = {
    search: search.trim() === "" ? undefined : search.trim(),
    status: status ? (status as DocumentStatus) : undefined,
  };

  const { data: documents, isLoading } = useAdminListDocuments(listParams, {
    query: { enabled: isReady, queryKey: getAdminListDocumentsQueryKey(listParams) },
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold">Content Management</h1>
            <p className="mt-1 text-muted-foreground">
              Create, edit, and publish platform content.
            </p>
          </div>
          <Button asChild data-testid="button-new-document">
            <Link href="/admin/documents/new">
              <Plus className="mr-1.5 h-4 w-4" /> New document
            </Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="max-w-xs"
            data-testid="input-admin-search"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40" data-testid="select-admin-status">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {documents && documents.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          )}
          {(documents ?? []).map((doc) => (
            <Link key={doc.id} href={`/admin/documents/${doc.id}`}>
              <Card className="hover-elevate" data-testid={`row-admin-document-${doc.id}`}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.contentType.name}</p>
                  </div>
                  <Badge variant={doc.status === "published" ? "default" : "secondary"}>
                    {doc.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
