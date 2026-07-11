import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { Printer, CheckCircle2 } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetDocument,
  useMarkDocumentViewed,
  useMarkDocumentCompleted,
  getGetDocumentQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { DocumentRenderer, renderInlineText } from "@/components/DocumentRenderer";
import { COURSE_LABELS, TASK_LABELS } from "@/components/DocumentCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DocumentView() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data: doc, isLoading } = useGetDocument(slug ?? "", {
    query: { enabled: !!slug, queryKey: getGetDocumentQueryKey(slug ?? "") },
  });
  const markViewed = useMarkDocumentViewed();
  const markCompleted = useMarkDocumentCompleted();

  useEffect(() => {
    if (slug && isAuthenticated && doc) {
      markViewed.mutate({ slug });
    }
    // Only re-fire when the document identity or auth state actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAuthenticated, doc?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading…</div>
      </Layout>
    );
  }

  if (!doc) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-muted-foreground">This document couldn't be found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/library">Back to the library</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 print:max-w-none">
        <div className="flex flex-wrap items-center gap-1.5 print:hidden">
          <Badge variant="secondary">{doc.contentType.name}</Badge>
          {doc.taskTypes.map((t) => (
            <Badge key={t} variant="outline">
              {TASK_LABELS[t] ?? t}
            </Badge>
          ))}
          {doc.courseTypes.map((c) => (
            <Badge key={c} variant="outline">
              {COURSE_LABELS[c] ?? c}
            </Badge>
          ))}
        </div>

        <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight">
          {renderInlineText(doc.title, "doc-title")}
        </h1>

        <div className="mt-6 flex flex-wrap gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            data-testid="button-print-document"
          >
            <Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF
          </Button>
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => slug && markCompleted.mutate({ slug })}
              disabled={markCompleted.isPending || markCompleted.isSuccess}
              data-testid="button-mark-complete"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {markCompleted.isSuccess ? "Marked complete" : "Mark as complete"}
            </Button>
          )}
        </div>

        <div className="mt-8">
          <DocumentRenderer body={doc.body} />
        </div>

        <p className="mt-12 border-t pt-4 text-xs text-muted-foreground">{doc.copyrightNotice}</p>
      </article>
    </Layout>
  );
}
