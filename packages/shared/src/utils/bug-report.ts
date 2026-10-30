/** Pure cross-platform validation shared by the form and private intake. */
export const BUG_REPORT_LIMITS = {
  messageCodePoints: 4096,
  feedbackContextBytes: 8192,
  emailCharacters: 254,
  imageCount: 3,
  imageBytes: 2 * 1024 * 1024,
  imagePixels: 16_000_000,
  imageAxis: 8192,
  requestBytes: 4 * 1024 * 1024,
} as const;

export function buildBugReportMessage(
  description: string,
  reproductionSteps?: string
) {
  return (
    description +
    (reproductionSteps?.trim()
      ? `\n\nSteps to reproduce:\n${reproductionSteps}`
      : '')
  );
}

export function validateBugReportText(input: {
  description: string;
  reproductionSteps?: string;
  replyEmail?: string;
}) {
  if (!input.description.trim())
    return {
      valid: false as const,
      field: 'description' as const,
      code: 'description-required',
      message: 'Describe what happened.',
    };
  const message = buildBugReportMessage(
    input.description,
    input.reproductionSteps
  );
  if ([...message].length > BUG_REPORT_LIMITS.messageCodePoints)
    return {
      valid: false as const,
      field: 'description' as const,
      code: 'message-too-long',
      message:
        'Shorten the description and steps to 4,096 characters combined, including the steps label.',
    };
  const email = input.replyEmail?.trim();
  if (
    email &&
    (email.length > BUG_REPORT_LIMITS.emailCharacters ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )
    return {
      valid: false as const,
      field: 'replyEmail' as const,
      code: 'invalid-email',
      message:
        'Enter a valid reply email of at most 254 characters, or leave it blank.',
    };
  // Reserve space for the optional replay identifier and JSON keys. Relay shares
  // this byte budget across the feedback context; never rely on server trimming.
  if (
    new TextEncoder().encode(
      JSON.stringify({
        message,
        contact_email: email,
        replay_id: '0'.repeat(32),
      })
    ).byteLength > BUG_REPORT_LIMITS.feedbackContextBytes
  )
    return {
      valid: false as const,
      field: 'description' as const,
      code: 'feedback-too-large',
      message:
        'Shorten the description or steps: these characters exceed the feedback size limit.',
    };
  return { valid: true as const, message };
}
