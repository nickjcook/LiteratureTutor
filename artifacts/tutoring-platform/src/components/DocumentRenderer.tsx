import type { ReactNode } from "react";
import { TitleText } from "./TitleText";

// Renders the shortcoded markdown bodies authored in the CMS:
//   [[Text Title]]        -> the WA text-title convention (TitleText)
//   :::term Name ... :::  -> a blue embedded curriculum-term box
//   :::model ... :::      -> a green embedded model-sentence box
// This is what lets Pamina write plain shortcoded text in the CMS instead of
// HTML, while still getting the platform's required embedded metalanguage
// structure (spec section 2.6) on every document.

type Block =
  | { type: "markdown"; content: string }
  | { type: "term"; label: string; content: string }
  | { type: "model"; content: string };

const BLOCK_REGEX = /:::(term|model)([^\n]*)\n([\s\S]*?)\n:::/g;
const INLINE_REGEX = /\[\[([^\]]+)\]\]|\*\*([^*]+)\*\*/g;

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  BLOCK_REGEX.lastIndex = 0;
  while ((match = BLOCK_REGEX.exec(body)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "markdown", content: body.slice(lastIndex, match.index) });
    }
    const [, kind, label, content] = match;
    blocks.push(
      kind === "term"
        ? { type: "term", label: label.trim(), content: content.trim() }
        : { type: "model", content: content.trim() },
    );
    lastIndex = BLOCK_REGEX.lastIndex;
  }
  if (lastIndex < body.length) {
    blocks.push({ type: "markdown", content: body.slice(lastIndex) });
  }
  return blocks;
}

// Exported so titles (rendered outside the document body — card headings,
// the document page <h1>) get the same [[Text Title]] shortcode treatment.
export function renderInlineText(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  INLINE_REGEX.lastIndex = 0;
  while ((match = INLINE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] != null) {
      parts.push(<TitleText key={`${keyPrefix}-${i++}`}>{match[1]}</TitleText>);
    } else if (match[2] != null) {
      parts.push(<strong key={`${keyPrefix}-${i++}`}>{match[2]}</strong>);
    }
    lastIndex = INLINE_REGEX.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function renderMarkdown(content: string, keyPrefix: string): ReactNode {
  const paragraphs = content.trim().split(/\n\s*\n/).filter(Boolean);
  return paragraphs.map((para, idx) => {
    const key = `${keyPrefix}-p${idx}`;
    const headingMatch = para.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const [, hashes, text] = headingMatch;
      const inline = renderInlineText(text, key);
      if (hashes.length === 1) {
        return (
          <h2 key={key} className="mb-3 mt-8 font-serif text-2xl font-semibold first:mt-0">
            {inline}
          </h2>
        );
      }
      if (hashes.length === 2) {
        return (
          <h3 key={key} className="mb-2 mt-6 font-serif text-xl font-semibold">
            {inline}
          </h3>
        );
      }
      return (
        <h4 key={key} className="mb-2 mt-4 text-lg font-semibold">
          {inline}
        </h4>
      );
    }
    return (
      <p key={key} className="mb-4 leading-relaxed text-foreground/90">
        {renderInlineText(para, key)}
      </p>
    );
  });
}

export function DocumentRenderer({ body }: { body: string }) {
  const blocks = parseBlocks(body);

  return (
    <div className="max-w-none">
      {blocks.map((block, idx) => {
        const key = `block-${idx}`;

        if (block.type === "term") {
          return (
            <div
              key={key}
              className="my-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40"
            >
              {block.label && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                  Curriculum term — {block.label}
                </p>
              )}
              <div className="text-sm text-sky-950 dark:text-sky-100 [&_p]:mb-2 [&_p:last-child]:mb-0">
                {renderMarkdown(block.content, key)}
              </div>
            </div>
          );
        }

        if (block.type === "model") {
          return (
            <div
              key={key}
              className="my-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Model sentence
              </p>
              <div className="text-sm italic text-emerald-950 dark:text-emerald-100 [&_p]:mb-2 [&_p:last-child]:mb-0">
                {renderMarkdown(block.content, key)}
              </div>
            </div>
          );
        }

        return <div key={key}>{renderMarkdown(block.content, key)}</div>;
      })}
    </div>
  );
}
