/**
 * Adapter functions for the Better Auth Convex component.
 *
 * This exports the database adapter functions that Better Auth
 * needs to interact with the Convex database.
 */
import { createApi } from '@convex-dev/better-auth';
import schema from './schema';
import { createAuthOptions } from '../auth';

export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuthOptions);
