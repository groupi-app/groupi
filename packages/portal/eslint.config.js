import base from '../../eslint.config.js';
export default [
  ...base,
  { rules: { '@next/next/no-html-link-for-pages': 'off' } },
];
