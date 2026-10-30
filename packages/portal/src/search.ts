import index from './generated/search-index.json';
export type SearchEntry = (typeof index.entries)[number];
const stop = new Set([
  'a',
  'an',
  'the',
  'my',
  'your',
  'with',
  'from',
  'for',
  'and',
  'or',
  'to',
  'of',
  'in',
  'after',
  'one',
  'first',
  'how',
  'do',
  'i',
]);
const synonyms: Record<string, string[]> = {
  read: ['list', 'get'],
  create: ['creation'],
  retry: ['replay', 'uncertain'],
  timeout: ['uncertain'],
  authentication: ['credential', 'auth'],
  authenticationn: ['credential'],
  account: ['identity'],
  install: ['installation'],
  contribute: ['contributor', 'contribution'],
  pagination: ['cursor', 'page'],
  programmer: ['prerequisite'],
  signup: ['enrollment'],
  extension: ['addon'],
  addon: ['add-on'],
  secret: ['credential'],
  permission: ['authority', 'authorization'],
  response: ['envelope'],
};
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9@/-]+/g, ' ')
    .trim();
}
function words(text: string) {
  return normalize(text)
    .split(/\s+/)
    .filter(word => word && !stop.has(word))
    .map(word =>
      word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word
    );
}
const prepared = index.entries.map(entry => ({
  entry,
  title: normalize(entry.title),
  body: words(`${entry.pageTitle} ${entry.text} ${entry.keywords.join(' ')}`),
  titleWords: words(entry.title),
}));
function near(left: string, right: string) {
  if (left.length < 5 || Math.abs(left.length - right.length) > 2) return false;
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 0; i < left.length; i++) {
    const current = [i + 1];
    for (let j = 0; j < right.length; j++)
      current.push(
        Math.min(
          current[j] + 1,
          previous[j + 1] + 1,
          previous[j] + (left[i] === right[j] ? 0 : 1)
        )
      );
    previous = current;
  }
  return previous[right.length] <= (left.length >= 8 ? 2 : 1);
}
export function searchPassages(
  query: string,
  version: string,
  availability: string
) {
  const requestedVersion = query.match(/\bv([12])\b/i)?.[0].toLowerCase();
  const tokens = words(query.replace(/\bv[12]\b/gi, ''));
  if (!tokens.length) return [];
  const full = normalize(query);
  return prepared
    .filter(
      item =>
        (!requestedVersion || item.entry.version === requestedVersion) &&
        (version === 'all' || item.entry.version === version) &&
        (availability === 'all' || item.entry.availability === availability)
    )
    .map(item => {
      const exact = item.title === full;
      const operationAlias =
        item.entry.id.startsWith('api-') &&
        item.title.replace(/\/api\/v[12]/, '') === full;
      const exactKeyword = item.entry.keywords.some(
        word => normalize(word) === full
      );
      let matches = 0;
      let score = exact
        ? 10000
        : operationAlias
          ? 8000 + (item.entry.version === 'v2' ? 1 : 0)
          : exactKeyword
            ? 6000
            : 0;
      for (const token of tokens) {
        const expanded = [token, ...(synonyms[token] ?? [])];
        if (expanded.some(word => item.titleWords.includes(word))) {
          score += 15;
          matches++;
        } else if (expanded.some(word => item.body.includes(word))) {
          score += 4;
          matches++;
        } else if (item.titleWords.some(word => near(token, word))) {
          score += 6;
          matches++;
        } else if (item.body.some(word => near(token, word))) {
          score += 1;
          matches++;
        }
      }
      if (item.title.includes(full)) score += 30;
      // A broad resource lookup defaults to its collection read, not an
      // alphabetically earlier destructive endpoint with the same nouns.
      const collection = item.entry.title.match(
        /^GET \/api\/v[12]\/([^/ {]+)$/
      )?.[1];
      if (
        collection &&
        tokens.includes(words(collection)[0]) &&
        !tokens.some(token =>
          ['delete', 'remove', 'create', 'post', 'patch', 'update'].includes(
            token
          )
        )
      )
        score += 8;
      if (
        item.entry.id.startsWith('api-') ||
        item.entry.id.startsWith('cli-reference:')
      )
        score -= 1;
      return {
        ...item.entry,
        score:
          exact ||
          operationAlias ||
          exactKeyword ||
          matches >= Math.ceil(tokens.length * 0.65)
            ? score
            : 0,
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 12);
}
