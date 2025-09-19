import { Resend } from 'resend';
import { getRESEND_API_KEY } from './env';

declare global {
  var cachedResend: Resend | undefined;
}

let resend: Resend;
if (process.env.NODE_ENV === 'production') {
  resend = new Resend(getRESEND_API_KEY());
} else {
  if (!global.cachedResend) {
    global.cachedResend = new Resend(getRESEND_API_KEY());
  }
  resend = global.cachedResend;
}

export { resend };
