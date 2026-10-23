import { Fragment, type ReactNode } from "react";
import { faNumber } from "@/lib/format";

/**
 * The little Markdown the agent is asked to use: paragraphs, **bold**, lists ("- " or "1. ")
 * and small comparison tables. Headings, if any slip through, become bold lines.
 * Anything else stays plain text: the agent's answer is never HTML.
 */
export function Markdown({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[][] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      parts.push(
        <p key={parts.length} className="whitespace-pre-wrap">
          {inline(paragraph.join("\n"))}
        </p>,
      );
    }
    paragraph = [];
  };
  const flushList = () => {
    if (list) parts.push(<List key={parts.length} ordered={list.ordered} items={list.items} />);
    list = null;
  };
  const flushTable = () => {
    if (table.length) parts.push(<Table key={parts.length} rows={table} />);
    table = [];
  };

  for (const line of text.trim().split("\n")) {
    // a table row: | a | b |  (the |---| line under the header is skipped)
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushParagraph();
      flushList();
      if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(line)) table.push(cells(line));
      continue;
    }
    flushTable();

    const bullet = line.match(/^\s*[-•*]\s+(.*)$/);
    const numbered = line.match(/^\s*[\d۰-۹]+[.)]\s+(.*)$/);
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(heading ? `**${heading[1]}**` : line);
    }
  }
  flushParagraph();
  flushList();
  flushTable();

  return <div className="flex flex-col gap-3 text-[15px] leading-[1.9] text-bone">{parts}</div>;
}

/** Bullets as small red dots, numbered steps as red-tinted number badges. */
function List({ ordered, items }: { ordered: boolean; items: string[] }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          {ordered ? (
            <span
              aria-hidden
              className="mt-[5px] grid size-[22px] shrink-0 place-items-center rounded-lg bg-brand/12 text-[12px] font-bold leading-none text-brand-1 ring-1 ring-brand/25"
            >
              {faNumber(i + 1)}
            </span>
          ) : (
            <span aria-hidden className="mt-[12px] size-1.5 shrink-0 rounded-full bg-brand" />
          )}
          <span className="min-w-0">{inline(item)}</span>
        </li>
      ))}
    </Tag>
  );
}

/** "| a | b |" → ["a", "b"] */
function cells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/**
 * A comparison table: a solid red header with what's compared, the first column naming each row,
 * soft stripes to follow a row across. Wider than the phone, it scrolls sideways on its own.
 */
function Table({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="w-max min-w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-[13px] leading-6">
          <thead>
            <tr className="bg-brand">
              {head.map((cell, i) => (
                <th
                  key={i}
                  scope="col"
                  className="whitespace-nowrap px-3.5 py-2.5 text-start font-semibold text-white"
                >
                  {inline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr key={r} className="border-t border-white/[0.05] even:bg-white/[0.025]">
                {head.map((_, c) =>
                  c === 0 ? (
                    <th
                      key={c}
                      scope="row"
                      className="whitespace-nowrap px-3.5 py-2.5 text-start font-medium text-dust"
                    >
                      {inline(row[c] ?? "")}
                    </th>
                  ) : (
                    <td key={c} className="px-3.5 py-2.5 tabular-nums text-bone">
                      {inline(row[c] ?? "")}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** **bold** inside a line */
function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
