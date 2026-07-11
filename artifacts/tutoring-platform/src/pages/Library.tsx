import { useState } from "react";
import { Search } from "lucide-react";
import { useListDocuments, useListContentTypes } from "@workspace/api-client-react";
import type { CourseType } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { DocumentCard, COURSE_LABELS } from "@/components/DocumentCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const YEAR_LEVELS = [7, 8, 9, 10, 11, 12];

export default function Library() {
  const [search, setSearch] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [courseType, setCourseType] = useState("");
  const [contentTypeId, setContentTypeId] = useState("");

  const { data: contentTypes } = useListContentTypes();
  const { data: documents, isLoading } = useListDocuments({
    search: search.trim() === "" ? undefined : search.trim(),
    yearLevel: yearLevel ? Number(yearLevel) : undefined,
    courseType: courseType ? (courseType as CourseType) : undefined,
    contentTypeId: contentTypeId ? Number(contentTypeId) : undefined,
  });

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Content Library</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse everything on the platform by year level, course, text, or content
          type.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="pl-8"
              data-testid="input-library-search"
            />
          </div>
          <Select value={yearLevel} onValueChange={setYearLevel}>
            <SelectTrigger data-testid="select-library-year-level">
              <SelectValue placeholder="Any year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_LEVELS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Year {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseType} onValueChange={setCourseType}>
            <SelectTrigger data-testid="select-library-course-type">
              <SelectValue placeholder="Any course" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COURSE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={contentTypeId} onValueChange={setContentTypeId}>
            <SelectTrigger data-testid="select-library-content-type">
              <SelectValue placeholder="Any content type" />
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

        <div className="mt-10">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {documents && documents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No content matches your filters yet.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(documents ?? []).map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
