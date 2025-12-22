import {
  ConnectionError,
  DatabaseError,
  NotFoundError,
  ConflictError,
  ConstraintError,
  ValidationError,
  UnauthorizedError,
  OperationError,
} from '@groupi/schema';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
} from '@prisma/client/runtime/library';

export function getPrismaError(
  resourceName: string,
  cause:
    | PrismaClientKnownRequestError
    | PrismaClientValidationError
    | PrismaClientInitializationError
    | PrismaClientUnknownRequestError
    | PrismaClientRustPanicError
    | Error
):
  | ValidationError
  | ConnectionError
  | OperationError
  | DatabaseError
  | NotFoundError
  | UnauthorizedError
  | ConstraintError
  | ConflictError {
  // Handle Prisma Client validation errors
  if (cause instanceof PrismaClientValidationError) {
    return new ValidationError({
      message: `Invalid data provided: ${cause.message}`,
      cause,
    });
  }

  // Handle Prisma Client initialization errors
  if (cause instanceof PrismaClientInitializationError) {
    return new ConnectionError({
      message: 'Failed to initialize database connection',
      cause,
    });
  }

  // Handle Prisma Client Rust panic errors
  if (cause instanceof PrismaClientRustPanicError) {
    return new OperationError({
      message: 'Database engine crashed',
      cause,
    });
  }

  // Handle unknown request errors
  if (cause instanceof PrismaClientUnknownRequestError) {
    return new DatabaseError({
      message: 'Unknown database error',
      cause,
    });
  }

  // Handle known request errors with specific error codes
  if (cause instanceof PrismaClientKnownRequestError) {
    switch (cause.code) {
      // Not Found Errors
      case 'P2025': // "An operation failed because it depends on one or more records that were required but not found."
      case 'P2001': // "The record searched for in the where condition does not exist"
        return new NotFoundError({
          message: `${resourceName} not found`,
          cause,
        });

      // Connection Errors
      case 'P1001': // "Can't reach database server"
      case 'P1002': // "Database server was reached but timed out"
      case 'P1008': // "Operations timed out"
      case 'P1011': // "Error opening a TLS connection"
      case 'P2037': // "Too many database connections opened"
        return new ConnectionError({
          message: 'Database connection error',
          cause,
        });

      // Authentication/Authorization Errors
      case 'P1000': // "Authentication failed against database server"
      case 'P1010': // "User was denied access on the database"
        return new UnauthorizedError({
          message: 'Database access denied',
          cause,
        });

      // Constraint Violation Errors
      case 'P2002': // "Unique constraint failed"
      case 'P2003': // "Foreign key constraint failed"
      case 'P2004': // "A constraint failed on the database"
      case 'P2014': // "The change you are trying to make would violate the required relation"
      case 'P2015': // "A related record could not be found"
      case 'P2018': // "The required connected records were not found"
      case 'P2019': // "Input error"
      case 'P2020': // "Value out of range for the type"
      case 'P2021': // "The table does not exist in the current database"
      case 'P2022': // "The column does not exist in the current database"
        return new ConstraintError({
          message: 'Database constraint violation',
          cause,
        });

      // Conflict/Concurrency Errors
      case 'P2034': // "Transaction failed due to a write conflict or a deadlock"
        return new ConflictError({
          message: 'Database write conflict or deadlock',
          cause,
        });

      // Validation Errors
      case 'P2005': // "The value stored in the database for the field is invalid for the field's type"
      case 'P2006': // "The provided value for the column is not valid"
      case 'P2007': // "Data validation error"
      case 'P2008': // "Failed to parse the query"
      case 'P2009': // "Failed to validate the query"
      case 'P2010': // "Raw query failed"
      case 'P2011': // "Null constraint violation"
      case 'P2012': // "Missing a required value"
      case 'P2013': // "Missing the required argument"
      case 'P2016': // "Query interpretation error"
      case 'P2017': // "The records for relation are not connected"
      case 'P2033': // "A number used in the query does not fit into a 64 bit signed integer"
        return new ValidationError({
          message: 'Data validation error',
          cause,
        });

      // Database/Schema Errors
      case 'P1003': // "Database does not exist"
      case 'P1009': // "Database already exists"
      case 'P2023': // "Inconsistent column data"
      case 'P2024': // "Timed out fetching a new connection from the connection pool"
      case 'P2026': // "The current database provider doesn't support a feature that the query used"
      case 'P2027': // "Multiple errors occurred on the database during query execution"
      case 'P2030': // "Cannot find a fulltext index to use for the search"
      case 'P2035': // "Assertion violation on the database"
      case 'P2036': // "Error in external connector"
        return new DatabaseError({
          message: 'Database schema or configuration error',
          cause,
        });

      // Migration/Schema Engine Errors (P3xxx)
      case 'P3000': // "Failed to create database"
      case 'P3001': // "Migration possible with destructive changes"
      case 'P3002': // "The attempted migration was rolled back"
      case 'P3005': // "The database schema is not empty"
      case 'P3006': // "Migration failed to apply cleanly to the shadow database"
      case 'P3008': // "The migration is already recorded as applied"
      case 'P3009': // "migrate found failed migrations"
      case 'P3014': // "Prisma Migrate could not create the shadow database"
      case 'P3018': // "A migration failed to apply"
        return new OperationError({
          message: 'Database migration error',
          cause,
        });

      // Accelerate Errors (P6xxx and P5011)
      case 'P6000': // Generic server error
      case 'P6001': // Invalid data source
      case 'P6002': // Unauthorized
      case 'P6003': // Plan limit reached
      case 'P6004': // Query timeout
      case 'P6005': // Invalid parameters
      case 'P6006': // Version not supported
      case 'P6008': // Connection/Engine start error
      case 'P6009': // Response size limit exceeded
      case 'P6010': // Project disabled
      case 'P5011': // Too many requests
        return new OperationError({
          message: 'Prisma Accelerate error',
          cause,
        });

      // Default case for any unhandled error codes
      default:
        return new DatabaseError({
          message: `Database error (${cause.code})`,
          cause,
        });
    }
  }

  // Fallback for any other error types
  return new DatabaseError({
    message: 'Unknown database error',
    cause,
  });
}
