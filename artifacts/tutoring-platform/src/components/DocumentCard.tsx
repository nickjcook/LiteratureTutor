import { Link } from "wouter";
import type { DocumentSummary } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { renderInlineText } from "@/components/DocumentRenderer";

export const COURSE_LABELS: Record<string, string> = {
  literature_atar: "Literature ATAR",
  english_atar: "English ATAR",
  general_english: "General English",
};

export const TASK_LABELS: Record<string, string> = {
  essay: "Essay",
  close_reading: "Close Reading",
  short_answer: "Short Answer",
  creative_writing: "Creative Writing",
};

export function DocumentCard({ doc }: { doc: DocumentSummary }) {
  return (
    <Link href={`/documents/${doc.slug}`} data-testid={`card-document-${doc.slug}`}>
      <Card className="h-full hover-elevate">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-serif text-base leading-snug">
              {renderInlineText(doc.title, `card-${doc.slug}`)}
            </CardTitle>
            {doc.isNew && <Badge data-testid={`badge-new-${doc.slug}`}>New</Badge>}
          </div>
          <CardDescription>{doc.contentType.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {doc.texts.map((t) => (
            <Badge key={t.id} variant="secondary">
              {t.title}
            </Badge>
          ))}
          {doc.taskTypes.map((tt) => (
            <Badge key={tt} variant="outline">
              {TASK_LABELS[tt] ?? tt}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
