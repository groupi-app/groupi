import type { OpenAPIHonoOptions } from '@hono/zod-openapi';
import type { Env } from 'hono';

/**
 * Return the documented v2 error shape for every OpenAPI validation failure.
 *
 * Route groups each install this hook because a hook on the parent Hono app is
 * not inherited by apps mounted with `app.route()`.
 */
export function createValidationHook<E extends Env>(): NonNullable<
  OpenAPIHonoOptions<E>['defaultHook']
> {
  return (result, c) => {
    if (result.success) return;

    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message:
            result.error.issues[0]?.message ?? 'Request validation failed',
        },
      },
      400
    );
  };
}
