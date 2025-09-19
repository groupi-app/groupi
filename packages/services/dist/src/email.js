import { Resend } from 'resend';
import { getRESEND_API_KEY } from './env';
let resend;
if (process.env.NODE_ENV === 'production') {
    resend = new Resend(getRESEND_API_KEY());
}
else {
    if (!global.cachedResend) {
        global.cachedResend = new Resend(getRESEND_API_KEY());
    }
    resend = global.cachedResend;
}
export { resend };
