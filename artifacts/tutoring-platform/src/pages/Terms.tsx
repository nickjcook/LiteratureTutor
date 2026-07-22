import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Terms &amp; Conditions</h1>

        <Card className="mt-6 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <CardContent className="pt-6 text-sm text-amber-900 dark:text-amber-100">
            <strong>Draft placeholder.</strong> This page is a structural outline, not a
            reviewed legal document. Because the platform serves minors and takes
            payment, a qualified legal professional must review and finalise these terms
            — including the consent mechanism and academic-integrity provisions — before
            the platform launches to real students.
          </CardContent>
        </Card>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold">1. Agreement to these terms</h2>
            <p className="mt-2 text-muted-foreground">
              By ticking the agreement box at sign-in and using the platform, the
              account holder confirms they have read and accepted these Terms &amp;
              Conditions and the{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                Privacy Policy
              </Link>
              . Where the student is under 18, a parent or guardian accepts these terms
              on the student's behalf at the point of payment. Access is not granted
              unless the agreement box is ticked.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold">2. Accounts</h2>
            <p className="mt-2 text-muted-foreground">
              One account per student. Account holders are responsible for keeping their
              sign-in details secure and for the activity on their account. Year level
              and course are self-declared during onboarding and used to match the
              student to relevant content.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold">3. Subscriptions, billing and cancellation</h2>
            <p className="mt-2 text-muted-foreground">
              Access is provided on a subscription basis with parent-chosen billing
              cadence. Payments are processed by our payment provider; card details are
              handled by that provider and not stored by the platform. Pricing, GST
              treatment, free-trial terms, renewal, failed-payment handling, refunds and
              cancellation are to be finalised and stated here before launch.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold">4. Acceptable use &amp; academic integrity</h2>
            <p className="mt-2 text-muted-foreground">
              The platform teaches students to write their own work. It provides
              modelling, structured guidance and general feedback on a student's own
              writing — it does not write essays or assessable work for students, and
              students must not use it to submit work that is not their own. Attempting
              to extract complete essays or to misrepresent platform-assisted work as
              unaided may result in suspension of access.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold">5. Intellectual property</h2>
            <p className="mt-2 text-muted-foreground">
              All platform content — documents, methodology, worked examples and
              downloadable materials — remains the intellectual property of Pamina Rich
              and may not be copied, redistributed or shared outside the account holder's
              own study. Downloadable materials may be watermarked to the account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold">6. Student work and privacy</h2>
            <p className="mt-2 text-muted-foreground">
              How student work is stored, retained and used is described in the{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                Privacy Policy
              </Link>
              . Any use of student work to improve the platform's feedback is opt-in and
              disclosed there.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold">7. Availability and changes</h2>
            <p className="mt-2 text-muted-foreground">
              We aim to keep the platform available and accurate but do not guarantee
              uninterrupted access. These terms may be updated; material changes will be
              notified to account holders.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold">8. Contact</h2>
            <p className="mt-2 text-muted-foreground">To be provided.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
