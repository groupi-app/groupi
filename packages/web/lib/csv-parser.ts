/**
 * CSV and bulk email parsing utilities for email invites
 */

export interface ParsedInvite {
  email: string;
  recipientName?: string;
  plusOnes?: number;
}

export interface ParseResult {
  invites: ParsedInvite[];
  errors: string[];
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse a CSV string into invite data
 * Expected columns: email, name (optional), plusOnes (optional)
 * Supports headers with variations: "email", "Email", "EMAIL", "name", "Name", "recipient", etc.
 */
export function parseCSV(content: string): ParseResult {
  const invites: ParsedInvite[] = [];
  const errors: string[] = [];

  // Split into lines and filter empty ones
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { invites: [], errors: ['CSV file is empty'] };
  }

  // Parse header row to find column indices
  const headerRow = lines[0].toLowerCase();
  const headers = parseCSVLine(headerRow);

  // Find column indices
  const emailIndex = headers.findIndex(h =>
    ['email', 'e-mail', 'email address', 'emailaddress'].includes(h)
  );
  const nameIndex = headers.findIndex(h =>
    [
      'name',
      'recipient',
      'recipient name',
      'recipientname',
      'full name',
      'fullname',
    ].includes(h)
  );
  const plusOnesIndex = headers.findIndex(h =>
    [
      'plusones',
      'plus ones',
      'plus 1s',
      '+1s',
      'guests',
      'extra guests',
    ].includes(h)
  );

  // If no email column found, try to detect if it's a simple one-column file
  const hasHeaders = emailIndex !== -1;
  const startLine = hasHeaders ? 1 : 0;

  // If no headers detected, assume first column is email
  const effectiveEmailIndex = emailIndex !== -1 ? emailIndex : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const columns = parseCSVLine(line);

    if (columns.length === 0) continue;

    const email = columns[effectiveEmailIndex]?.trim().toLowerCase();

    if (!email) {
      errors.push(`Line ${i + 1}: Missing email`);
      continue;
    }

    if (!isValidEmail(email)) {
      errors.push(`Line ${i + 1}: Invalid email "${email}"`);
      continue;
    }

    const invite: ParsedInvite = { email };

    // Get name if column exists
    if (nameIndex !== -1 && columns[nameIndex]) {
      const name = columns[nameIndex].trim();
      if (name) {
        invite.recipientName = name;
      }
    }

    // Get plusOnes if column exists
    if (plusOnesIndex !== -1 && columns[plusOnesIndex]) {
      const plusOnesStr = columns[plusOnesIndex].trim();
      const plusOnes = parseInt(plusOnesStr, 10);
      if (!isNaN(plusOnes) && plusOnes >= 0) {
        invite.plusOnes = plusOnes;
      }
    }

    invites.push(invite);
  }

  return { invites, errors };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse bulk email text (semicolon, comma, or newline separated)
 * Simple format: just emails, or "Name <email>" format
 */
export function parseBulkEmails(text: string): ParseResult {
  const invites: ParsedInvite[] = [];
  const errors: string[] = [];

  // Split by semicolons, commas, or newlines
  const entries = text
    .split(/[;,\n]/)
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);

  for (const entry of entries) {
    // Try to parse "Name <email>" format
    const angleMatch = entry.match(/^(.+?)\s*<([^>]+)>$/);

    if (angleMatch) {
      const name = angleMatch[1].trim();
      const email = angleMatch[2].trim().toLowerCase();

      if (!isValidEmail(email)) {
        errors.push(`Invalid email "${email}"`);
        continue;
      }

      invites.push({
        email,
        recipientName: name || undefined,
      });
    } else {
      // Just an email address
      const email = entry.toLowerCase();

      if (!isValidEmail(email)) {
        errors.push(`Invalid email "${entry}"`);
        continue;
      }

      invites.push({ email });
    }
  }

  return { invites, errors };
}

/**
 * Generate CSV template content for download
 */
export function generateCSVTemplate(): string {
  return `email,name,plusOnes
john@example.com,John Doe,1
jane@example.com,Jane Smith,0
bob@example.com,,2`;
}

/**
 * Deduplicate invites by email
 */
export function deduplicateInvites(invites: ParsedInvite[]): ParsedInvite[] {
  const seen = new Set<string>();
  return invites.filter(invite => {
    const email = invite.email.toLowerCase();
    if (seen.has(email)) {
      return false;
    }
    seen.add(email);
    return true;
  });
}
