import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Privacy Policy</h1>

        <Card className="mt-6 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <CardContent className="pt-6 text-sm text-amber-900 dark:text-amber-100">
            <strong>Draft placeholder.</strong> This page is a structural outline, not a
            reviewed legal document. Because the platform serves minors, a qualified
            privacy/legal professional must review and finalise this policy before the
            platform launches to real students.
          </CardContent>
        </Card>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold">What we collect</h2>
            <p className="mt-2 text-muted-foreground">
              Account details from sign-in (name, email), the study profile a student
              enters (year level, course, school), and records of which documents a
              student has viewed or completed. Essay or close-reading submissions
              through the Google Drive pipeline, once that feature is built, will
              contain student writing and must be covered by an updated version of
              this policy before it is activated.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg font-semibold">Why we collect it</h2>
            <p className="mt-2 text-muted-foreground">
              Solely to operate the platform: matching students to relevant content,
              tracking their own progress, and — where a feature explicitly requires
              it — providing feedback on their work. Data collection is kept to the
              minimum needed for the platform to function.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg font-semibold">Storage and access</h2>
            <p className="mt-2 text-muted-foreground">
              Data is stored securely and is not sold or shared with third parties.
              Hosting location and access controls are to be finalised with the
              development team.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg font-semibold">Parents and guardians</h2>
            <p className="mt-2 text-muted-foreground">
              Parent or guardian visibility of student progress, and any required
              consent mechanisms, are still to be decided and will be reflected here
              once finalised.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg font-semibold">Contact</h2>
            <p className="mt-2 text-muted-foreground">To be provided.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
