import type { ReactNode } from "react";

// The WA academic convention for text titles: inverted commas + underline,
// applied consistently everywhere a title is referenced. This is the single
// implementation every rendering path routes through — never format a title
// by hand in a document body.
export function TitleText({ children }: { children: ReactNode }) {
  return (
    <span className="underline decoration-1 underline-offset-[3px]">
      &lsquo;{children}&rsquo;
    </span>
  );
}
