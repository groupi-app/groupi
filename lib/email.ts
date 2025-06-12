import { Resend } from 'resend';

declare global {
  var cachedResend: Resend | undefined;
}

let resend: Resend;
if (process.env.NODE_ENV === 'production') {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  if (!global.cachedResend) {
    global.cachedResend = new Resend(process.env.RESEND_API_KEY);
  }
  resend = global.cachedResend;
}

export { resend };
