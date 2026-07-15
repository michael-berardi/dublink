const DESCRIPTION_FIELDS = ['description', 'Description', 'productDescription', 'shortDescription', 'details', 'Details', 'body'] as const;

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

  const sentences = plain.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  const concise = sentences.length > 1 ? sentences.slice(0, 2).join(' ') : plain;
  return truncateAtWord(concise, maxLength) || undefined;
}

export function extractProductDescription(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const field of DESCRIPTION_FIELDS) {
    const description = cleanProductDescription(record[field]);
    if (description) return description;
  }
  return undefined;
}
