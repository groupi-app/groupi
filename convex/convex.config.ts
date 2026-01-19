import { defineApp } from 'convex/server';
import presence from '@convex-dev/presence/convex.config.js';
import betterAuth from './betterAuth/convex.config';
import resend from '@convex-dev/resend/convex.config.js';

const app = defineApp();
app.use(presence);
app.use(betterAuth);
app.use(resend);

export default app;
