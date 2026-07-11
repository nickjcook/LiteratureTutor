import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Quote, BookMarked, Sparkles, History } from "lucide-react";
import {
  useAdminGetDocument,
  useAdminCreateDocument,
  useAdminUpdateDocument,
  useAdminPublishDocument,
  useAdminListDocumentVersions,
  useAdminRestoreDocumentVersion,
  useListContentTypes,
  useListTexts,
  getAdminGetDocumentQueryKey,
  getAdminListDocumentVersionsQueryKey,
  getListContentTypesQueryKey,
  getListTextsQueryKey,
} from "@workspace/api-client-react";
import type { CourseType, TaskType } from "@workspace/api-client-react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const YEAR_LEVELS = [7, 8, 9, 10, 11, 12];
const COURSE_TYPES: CourseType[] = ["literature_atar", "english_atar", "general_english"];
const TASK_TYPES: TaskType[] = ["essay", "close_reading", "short_answer", "creative_writing"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function AdminDocumentEditor() {
  const { isReady, isChecking } = useRequireAdmin();
  const { id: idParam } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNew = !idParam || idParam === "new";
  const id = isNew ? null : Number(idParam);

  const { data: existing } = useAdminGetDocument(id ?? 0, {
    query: {
      enabled: isReady && !isNew && id != null,
      queryKey: getAdminGetDocumentQueryKey(id ?? 0),
    },
  });
  const { data: contentTypes } = useListContentTypes({
    query: { enabled: isReady, queryKey: getListContentTypesQueryKey() },
  });
  const { data: texts } = useListTexts(
    {},
    { query: { enabled: isReady, queryKey: getListTextsQueryKey({}) } },
  );
  const { data: versions } = useAdminListDocumentVersions(id ?? 0, {
    query: {
      enabled: isReady && !isNew && id != null,
      queryKey: getAdminListDocumentVersionsQueryKey(id ?? 0),
    },
  });

  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contentTypeId, setContentTypeId] = useState("");
  const [body, setBody] = useState("");
  const [yearLevels, setYearLevels] = useState<number[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [textIds, setTextIds] = useState<number[]>([]);

  useEffect(() => {
    const version = existing ? `${existing.id}-${existing.updatedAt}` : null;
    if (existing && version !== loadedFrom) {
      setTitle(existing.title);
      setContentTypeId(String(existing.contentType.id));
      setBody(existing.body);
      setYearLevels(existing.yearLevels);
      setCourseTypes(existing.courseTypes as CourseType[]);
      setTaskTypes(existing.taskTypes as TaskType[]);
      setTextIds(existing.texts.map((t) => t.id));
      setLoadedFrom(version);
    }
  }, [existing, loadedFrom]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      setBody((b) => b + snippet);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + snippet + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  }

  const queryClient = useQueryClient();

  function invalidateDocument(docId: number) {
    queryClient.invalidateQueries({ queryKey: getAdminGetDocumentQueryKey(docId) });
    queryClient.invalidateQueries({ queryKey: getAdminListDocumentVersionsQueryKey(docId) });
  }

  const createMutation = useAdminCreateDocument();
  const updateMutation = useAdminUpdateDocument();
  const publishMutation = useAdminPublishDocument();
  const restoreMutation = useAdminRestoreDocumentVersion({
    mutation: { onSuccess: (doc) => invalidateDocument(doc.id) },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  function buildPayload() {
    return {
      title,
      contentTypeId: Number(contentTypeId),
      body,
      yearLevels,
      courseTypes,
      taskTypes,
      textIds,
    };
  }

  function handleSaveDraft() {
    const payload = buildPayload();
    if (isNew) {
      createMutation.mutate(
        { data: { ...payload, status: "draft" } },
        { onSuccess: (doc) => navigate(`/admin/documents/${doc.id}`) },
      );
    } else if (id != null) {
      updateMutation.mutate({ id, data: payload }, { onSuccess: (doc) => invalidateDocument(doc.id) });
    }
  }

  function handlePublish() {
    const payload = buildPayload();
    if (isNew) {
      createMutation.mutate(
        { data: { ...payload, status: "published" } },
        { onSuccess: (doc) => navigate(`/admin/documents/${doc.id}`) },
      );
    } else if (id != null) {
      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () =>
            publishMutation.mutate({ id }, { onSuccess: (doc) => invalidateDocument(doc.id) }),
        },
      );
    }
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

  const canSave = title.trim() !== "" && contentTypeId !== "";

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/admin/documents">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to content management
          </Link>
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-3xl font-semibold">
            {isNew ? "New document" : "Edit document"}
          </h1>
          {existing && (
            <Badge variant={existing.status === "published" ? "default" : "secondary"}>
              {existing.status}
            </Badge>
          )}
        </div>

        <div className="mt-6 space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-doc-title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-content-type">Content type</Label>
            <Select value={contentTypeId} onValueChange={setContentTypeId}>
              <SelectTrigger id="doc-content-type" data-testid="select-doc-content-type">
                <SelectValue placeholder="Select a content type" />
              </SelectTrigger>
              <SelectContent>
                {(contentTypes ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Year levels</Label>
              {YEAR_LEVELS.map((y) => (
                <div key={y} className="flex items-center gap-2">
                  <Checkbox
                    id={`year-${y}`}
                    checked={yearLevels.includes(y)}
                    onCheckedChange={() => setYearLevels((v) => toggle(v, y))}
                  />
                  <Label htmlFor={`year-${y}`} className="font-normal">
                    Year {y}
                  </Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Courses</Label>
              {COURSE_TYPES.map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <Checkbox
                    id={`course-${c}`}
                    checked={courseTypes.includes(c)}
                    onCheckedChange={() => setCourseTypes((v) => toggle(v, c))}
                  />
                  <Label htmlFor={`course-${c}`} className="font-normal capitalize">
                    {c.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Task types</Label>
              {TASK_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Checkbox
                    id={`task-${t}`}
                    checked={taskTypes.includes(t)}
                    onCheckedChange={() => setTaskTypes((v) => toggle(v, t))}
                  />
                  <Label htmlFor={`task-${t}`} className="font-normal capitalize">
                    {t.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Linked texts</Label>
            <div className="flex flex-wrap gap-3 rounded-md border p-3">
              {(texts ?? []).map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`text-${t.id}`}
                    checked={textIds.includes(t.id)}
                    onCheckedChange={() => setTextIds((v) => toggle(v, t.id))}
                  />
                  <Label htmlFor={`text-${t.id}`} className="font-normal">
                    {t.title}
                  </Label>
                </div>
              ))}
              {(texts ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No texts yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="doc-body">Body</Label>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertAtCursor("[[Text Title]]")}
                  data-testid="button-insert-title"
                >
                  <Quote className="mr-1 h-3.5 w-3.5" /> Title
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertAtCursor(":::term Term Name\nDefinition and example.\n:::\n")}
                  data-testid="button-insert-term"
                >
                  <BookMarked className="mr-1 h-3.5 w-3.5" /> Term box
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertAtCursor(":::model\nModel sentence text.\n:::\n")}
                  data-testid="button-insert-model"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Model box
                </Button>
              </div>
            </div>
            <Textarea
              id="doc-body"
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className="font-mono text-sm"
              placeholder={"# Heading\n\nUse [[Text Title]] for titles, :::term ... ::: for curriculum terms, and :::model ... ::: for model sentences."}
              data-testid="textarea-doc-body"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!canSave || isSaving}
              data-testid="button-save-draft"
            >
              Save draft
            </Button>
            <Button onClick={handlePublish} disabled={!canSave || isSaving} data-testid="button-publish">
              Publish
            </Button>
          </div>
        </div>

        {!isNew && (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <History className="h-4 w-4" /> Version history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(versions ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No published versions yet — publish to create the first one.
                </p>
              )}
              {(versions ?? []).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                  data-testid={`row-version-${v.id}`}
                >
                  <span className="text-sm">
                    Version {v.versionNumber} — {new Date(v.createdAt).toLocaleString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoreMutation.isPending}
                    onClick={() =>
                      id != null && restoreMutation.mutate({ id, versionId: v.id })
                    }
                    data-testid={`button-restore-${v.id}`}
                  >
                    Restore as draft
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
