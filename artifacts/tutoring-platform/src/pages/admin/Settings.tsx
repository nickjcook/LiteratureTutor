import { Link } from "wouter";
import {
  FileText,
  ShieldCheck,
  HelpCircle,
  CreditCard,
  KeyRound,
  Users,
  ExternalLink,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md px-2 py-1.5 hover-elevate"
    >
      <span className="text-foreground">{label}</span>
      <ExternalLink className="h-4 w-4" />
    </Link>
  );
}

export default function AdminSettings() {
  const { isReady, isChecking } = useRequireAdmin();

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
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Administration and configuration for the platform.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <SectionCard icon={FileText} title="Content">
            <p className="mb-3">Create, edit and publish platform content.</p>
            <div className="space-y-1">
              <LinkRow href="/admin/documents" label="Content management" />
            </div>
          </SectionCard>

          <SectionCard icon={ShieldCheck} title="Legal &amp; help pages">
            <p className="mb-3">Public pages students and parents see.</p>
            <div className="space-y-1">
              <LinkRow href="/terms" label="Terms &amp; Conditions" />
              <LinkRow href="/privacy" label="Privacy Policy" />
              <LinkRow href="/faq" label="How to use this platform" />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              Terms &amp; Privacy are drafts pending legal review before launch.
            </p>
          </SectionCard>

          <SectionCard icon={Users} title="User management">
            <div className="mb-2">
              <Badge variant="secondary">Interim — read-only</Badge>
            </div>
            <p className="mb-3">
              Everyone with an account. Role management (admin / advisor / member)
              arrives with the Clerk sign-in — see Authentication below.
            </p>
            <div className="space-y-1">
              <LinkRow href="/admin/users" label="View users" />
            </div>
          </SectionCard>

          <SectionCard icon={KeyRound} title="Authentication &amp; roles">
            <div className="mb-2">
              <Badge variant="secondary">Pending setup</Badge>
            </div>
            <p>
              Sign-in is moving to <strong>Clerk</strong>, with three roles: admin,
              advisor and member. Requires Clerk API keys and a data-residency /
              privacy sign-off before it can be enabled.
            </p>
          </SectionCard>

          <SectionCard icon={CreditCard} title="Payments">
            <div className="mb-2">
              <Badge variant="secondary">Pending setup</Badge>
            </div>
            <p>
              Subscriptions and billing via <strong>Stripe</strong> — pricing,
              free-trial length and cadence to be configured here once keys are added.
            </p>
          </SectionCard>
        </div>
      </div>
    </Layout>
  );
}
