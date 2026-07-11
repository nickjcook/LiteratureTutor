import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetMyProfile,
  useListDocuments,
  useListTexts,
  getGetMyProfileQueryKey,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import type { CourseType, TaskType } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { DocumentCard, COURSE_LABELS, TASK_LABELS } from "@/components/DocumentCard";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const YEAR_LEVELS = [7, 8, 9, 10, 11, 12];
const TASK_TYPES = ["essay", "close_reading", "short_answer", "creative_writing"];

export default function CurriculumMap() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profileEnvelope, isLoading: profileLoading } = useGetMyProfile({
    query: { enabled: isAuthenticated, queryKey: getGetMyProfileQueryKey() },
  });

  const [yearLevel, setYearLevel] = useState("");
  const [courseType, setCourseType] = useState("");
  const [taskType, setTaskType] = useState("");
  const [textId, setTextId] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated && !profileLoading && profileEnvelope?.profile == null) {
      navigate("/onboarding");
    }
  }, [authLoading, isAuthenticated, profileLoading, profileEnvelope, navigate]);

  useEffect(() => {
    if (profileEnvelope?.profile) {
      setYearLevel(String(profileEnvelope.profile.yearLevel));
      setCourseType(profileEnvelope.profile.courseType);
    }
  }, [profileEnvelope]);

  const { data: texts } = useListTexts({
    yearLevel: yearLevel ? Number(yearLevel) : undefined,
    courseType: courseType ? (courseType as CourseType) : undefined,
  });

  const hasFilter = yearLevel !== "" || courseType !== "";

  const documentsParams = {
    yearLevel: yearLevel ? Number(yearLevel) : undefined,
    courseType: courseType ? (courseType as CourseType) : undefined,
    taskType: taskType ? (taskType as TaskType) : undefined,
    textId: textId ? Number(textId) : undefined,
  };

  const { data: documents, isLoading: documentsLoading } = useListDocuments(documentsParams, {
    query: { enabled: hasFilter, queryKey: getListDocumentsQueryKey(documentsParams) },
  });

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Find your next document</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Answer a few quick questions and we'll bring you straight to the content
          that matches what you're working on right now.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Year level</Label>
            <Select value={yearLevel} onValueChange={setYearLevel}>
              <SelectTrigger data-testid="select-map-year-level">
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
          </div>
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select value={courseType} onValueChange={setCourseType}>
              <SelectTrigger data-testid="select-map-course-type">
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
          </div>
          <div className="space-y-1.5">
            <Label>Task type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger data-testid="select-map-task-type">
                <SelectValue placeholder="Any task" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TASK_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Text</Label>
            <Select value={textId} onValueChange={setTextId}>
              <SelectTrigger data-testid="select-map-text">
                <SelectValue placeholder="Any text" />
              </SelectTrigger>
              <SelectContent>
                {(texts ?? []).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-10">
          {!hasFilter && (
            <p className="text-sm text-muted-foreground">
              Choose a year level or course to see matching content.
            </p>
          )}
          {hasFilter && documentsLoading && (
            <p className="text-sm text-muted-foreground">Searching…</p>
          )}
          {hasFilter && documents && documents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No content matches yet — try widening your filters.
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
