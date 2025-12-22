/**
 * Extract mentioned person IDs from HTML content containing mention spans
 *
 * Mentions are stored in HTML as:
 * <span class="mention" data-id="personId" data-type="mention">@username</span>
 *
 * @param htmlContent - HTML content string containing mention spans
 * @returns Array of unique person IDs found in mentions
 */
export function extractMentionedPersonIds(htmlContent: string): string[] {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return [];
  }

  // Use regex to find all mention spans with data-id attributes
  // Pattern matches: <span class="mention" ... data-id="personId" ...>
  // or variations with different attribute orders
  const mentionPattern =
    /<span[^>]*class=["'][^"']*mention[^"']*["'][^>]*data-id=["']([^"']+)["'][^>]*>/gi;

  const mentionedIds = new Set<string>();
  let match;

  while ((match = mentionPattern.exec(htmlContent)) !== null) {
    const personId = match[1];
    if (personId && personId.trim()) {
      mentionedIds.add(personId.trim());
    }
  }

  return Array.from(mentionedIds);
}
