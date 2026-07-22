import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { TitleText } from "@/components/TitleText";

export default function Landing() {
  const { isAuthenticated, login } = useAuth();

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          TELOS · Western Australia · Years 7–12
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          English &amp; Literature, taught the way it should be.
        </h1>
        <p className="mt-3 font-serif text-lg italic text-muted-foreground">
          <span className="not-italic font-medium">Telos</span> — the end at which
          all learning aims.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">TELOS</span> delivers twenty
          years of teaching practice as a living methodology — the same frameworks, the
          same rigour, the same attention a student would get in the room. It isn't a
          generic tutoring platform: it's mapped to the SCASA English and Literature
          curriculum, and it meets you exactly where your next assessment is.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {isAuthenticated ? (
            <Button asChild size="lg" data-testid="button-find-document">
              <Link href="/map">Find my next document</Link>
            </Button>
          ) : (
            <Button size="lg" onClick={login} data-testid="button-get-started">
              Get started
            </Button>
          )}
          <Button asChild variant="outline" size="lg" data-testid="button-browse-library">
            <Link href="/library">Browse the library</Link>
          </Button>
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Worked examples like <TitleText>A Doll's House</TitleText> and{" "}
          <TitleText>Frankenstein</TitleText> demonstrate the method — it transfers to
          whatever you're studying.
        </p>
      </div>
    </Layout>
  );
}
