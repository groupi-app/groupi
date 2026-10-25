import { URL } from 'node:url';
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@napi-rs/keyring')
      return {
        url: new URL('./keyring.mjs', import.meta.url).href,
        shortCircuit: true,
      };
    return next(specifier, context);
  },
});
