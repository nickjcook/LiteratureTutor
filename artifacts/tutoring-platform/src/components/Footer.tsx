import { Link } from "wouter";
import evolveLogo from "@/assets/evolve-logo.png";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-sm text-muted-foreground sm:px-6">
        <p className="whitespace-nowrap">© {new Date().getFullYear()} Evolve Strategists. All rights reserved.</p>

        <nav className="flex items-center gap-x-4">
          <Link href="/faq" className="underline underline-offset-4 hover:text-foreground">
            How to use
          </Link>
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
        </nav>

        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs uppercase tracking-wider">Powered by</span>
          {/* White line-art logo: invert on the light footer, keep white in dark. */}
          <img
            src={evolveLogo}
            alt="Evolve Strategists"
            className="h-5 w-auto opacity-80 invert dark:invert-0"
          />
        </span>
      </div>
    </footer>
  );
}
