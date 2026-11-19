import type { VocabularyItem } from "@/lib/schemas/lesson";

/**
 * Quizlet-compatible export (V-6): two columns, target<TAB>native, no header, UTF-8.
 * Tabs and line breaks inside a term would break the import, so they become spaces.
 */
const clean = (s: string) => s.replace(/[\t\r\n]+/g, " ").trim();

function displayTerm(item: VocabularyItem): string {
  return item.gender !== "none" && /^(l'|les )/i.test(item.termTarget)
    ? `${item.termTarget} (${item.gender})`
    : item.termTarget;
}

export function toQuizletTsv(items: VocabularyItem[]): string {
  return items.map((i) => `${clean(displayTerm(i))}\t${clean(i.termNative)}`).join("\n");
}

export function toCsv(items: VocabularyItem[]): string {
  const cell = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return items.map((i) => [displayTerm(i), i.termNative, i.example].map(cell).join(",")).join("\n");
}

/**
 * Parses a pasted or uploaded vocabulary list (§5.1.3): one pair per line,
 * separated by tab, semicolon or comma (detected automatically). Max 100 items.
 */
export function parseVocabularyList(
  text: string,
  { swapColumns = false } = {},
): { target: string; native: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const separator = [/\t/, /;/, /,/].find((sep) => lines.every((l) => sep.test(l))) ?? /\t/;
  return lines.slice(0, 100).flatMap((line) => {
    const [a, b] = line.split(separator).map((s) => s.trim());
    if (!a || !b) return [];
    return [swapColumns ? { target: b, native: a } : { target: a, native: b }];
  });
}
