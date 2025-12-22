import type { Config } from 'tailwindcss';
import { withUt } from 'uploadthing/tw';

export default withUt({
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}) satisfies Config;
