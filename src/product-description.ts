const DESCRIPTION_FIELDS = ['description', 'Description', 'productDescription', 'shortDescription', 'details', 'Details', 'body'] as const;

const DESCRIPTION_BOILERPLATE = [
  /\b(?:for use by|keep out of reach|consult (?:a|your)|not intended to|results may vary)\b/i,
  /\b(?:food and drug administration|fda)\b/i,
  /\b(?:all rights reserved|terms (?:and|of) conditions|privacy policy)\b/i,
];

const DESCRIPTION_DETAIL_TERMS = /\b(?:aroma|aromas|flavor|flavors|notes|finish|terpene|terpenes|resin|rosin|distillate|full-spectrum|solventless|fast-acting|serving|servings|pieces|piece|pack|dose|dosing|each|included|reusable|compatible|thread|voltage|charging|usb-c|glass|borosilicate|material|materials|closure|texture|crisp|creamy|fruity|citrus|berry|pine|chocolate|mint|vanilla|tropical)\b/gi;

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (match, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isFinite(codePoint) && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&#(\d+);/g, (match, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10);
      return Number.isFinite(codePoint) && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, Math.max(1, maxLength - 1));
  const boundary = clipped.lastIndexOf(' ');
  return `${(boundary >= maxLength * 0.65 ? clipped.slice(0, boundary) : clipped).trim()}…`;
}

function sentenceQuality(sentence: string): number {
  const detailCount = sentence.match(DESCRIPTION_DETAIL_TERMS)?.length ?? 0;
  const measurable = /\b\d+(?:\.\d+)?\s*(?:mg|g|oz|ml|pack|pk|ct|piece|serving|in)\b/i.test(sentence) ? 2 : 0;
  const usefulLength = sentence.length >= 28 && sentence.length <= 170 ? 1 : 0;
  return detailCount * 2 + measurable + usefulLength;
}

function selectUsefulSentences(plain: string): string {
  const sentences = plain.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  const useful = sentences.filter((sentence) => !DESCRIPTION_BOILERPLATE.some((pattern) => pattern.test(sentence)));
  const candidates = useful.length > 0 ? useful : sentences;
  if (candidates.length <= 2) return candidates.join(' ');

  return candidates
    .map((sentence, index) => ({ sentence, index, score: sentenceQuality(sentence) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 2)
    .sort((left, right) => left.index - right.index)
    .map(({ sentence }) => sentence)
    .join(' ');
}

export function cleanProductDescription(value: unknown, maxLength = 240): string | undefined {
  if (typeof value !== 'string') return undefined;
  const plain = decodeHtmlEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(?:p|li|div|h[1-6])>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
  if (!plain) return undefined;

  const concise = selectUsefulSentences(plain);
  return truncateAtWord(concise, maxLength) || undefined;
}

export function extractProductDescription(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const candidates = DESCRIPTION_FIELDS
    .map((field, index) => {
      const description = cleanProductDescription(record[field]);
      return description ? { description, index, score: sentenceQuality(description) } : undefined;
    })
    .filter((candidate): candidate is { description: string; index: number; score: number } => Boolean(candidate));

  return candidates.sort((left, right) => right.score - left.score || left.index - right.index)[0]?.description;
}
