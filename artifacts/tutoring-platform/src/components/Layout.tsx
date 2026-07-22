import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ImpersonationBanner } from "./ImpersonationBanner";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ImpersonationBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
