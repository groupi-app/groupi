/** Safe, actionable copy; never display raw upstream errors or report contents. */
export function bugReportFailureMessage(code: string) {
  switch (code) {
    case 'invalid-image':
      return 'An image was rejected. Remove it or choose a valid PNG, JPEG or WebP within the displayed limits, then retry.';
    case 'image-count':
    case 'images-too-large':
      return 'Remove images to stay within 3 images and 2 MiB total, then retry.';
    case 'description-required':
      return 'Describe what happened before sending.';
    case 'message-too-long':
    case 'feedback-too-large':
    case 'request-too-large':
      return 'Shorten the description or steps, or remove an image, then retry.';
    case 'invalid-email':
      return 'Correct the reply email or leave it blank, then retry.';
    case 'rate-limited':
    case 'busy':
      return 'Please wait before trying again.';
    case 'replay-unavailable':
    case 'invalid-replay':
      return 'Replay could not be included. Uncheck replay and try again.';
    case 'unavailable':
    case 'upstream-unavailable':
      return 'Bug reporting is temporarily unavailable. Try later or contact support@groupi.gg.';
    default:
      return 'Check your text and images, or try again later.';
  }
}
