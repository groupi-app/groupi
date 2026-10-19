'use client';
export function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2);
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) =>
        terms.some(term => part.toLowerCase().includes(term)) ? (
          <mark key={i}>{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}
