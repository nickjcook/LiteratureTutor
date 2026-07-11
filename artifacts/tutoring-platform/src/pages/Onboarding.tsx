import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useUpsertMyProfile } from "@workspace/api-client-react";
import type { CourseType } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { COURSE_LABELS } from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const YEAR_LEVELS = [7, 8, 9, 10, 11, 12];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [yearLevel, setYearLevel] = useState("");
  const [courseType, setCourseType] = useState("");
  const [school, setSchool] = useState("");
  const mutation = useUpsertMyProfile();

  const canSubmit = yearLevel !== "" && courseType !== "";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate(
      {
        data: {
          yearLevel: Number(yearLevel),
          courseType: courseType as CourseType,
          school: school.trim() === "" ? null : school.trim(),
        },
      },
      { onSuccess: () => navigate("/map") },
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Tell us about your study</CardTitle>
            <CardDescription>
              This helps us bring you straight to the content that matches what you're
              working on. You can update it any time.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="yearLevel">Year level</Label>
                <Select value={yearLevel} onValueChange={setYearLevel}>
                  <SelectTrigger id="yearLevel" data-testid="select-year-level">
                    <SelectValue placeholder="Select your year level" />
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
                <Label htmlFor="courseType">Course</Label>
                <Select value={courseType} onValueChange={setCourseType}>
                  <SelectTrigger id="courseType" data-testid="select-course-type">
                    <SelectValue placeholder="Select your course" />
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
              <div className="space-y-1.5">
                <Label htmlFor="school">School (optional)</Label>
                <Input
                  id="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  data-testid="input-school"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={!canSubmit || mutation.isPending}
                className="w-full"
                data-testid="button-save-profile"
              >
                {mutation.isPending ? "Saving..." : "Continue"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
