import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
        <Card className="mx-4 w-full max-w-md">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <h1 className="font-serif text-xl font-semibold">Page not found</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              That page doesn't exist, or it may have moved.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/">Back to the homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
