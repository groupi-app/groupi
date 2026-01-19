/**
 * Tests for error classes in lib/errors.ts
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  AuthenticationError,
  UnauthorizedError,
  ValidationError,
} from './errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message, code, and status', () => {
      const error = new AppError('Something went wrong', 'GENERIC_ERROR', 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('GENERIC_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should default statusCode to 500', () => {
      const error = new AppError('Error', 'ERROR_CODE');

      expect(error.statusCode).toBe(500);
    });

    it('should allow custom status codes', () => {
      const error = new AppError('Error', 'ERROR_CODE', 418);

      expect(error.statusCode).toBe(418);
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should work with different resource names', () => {
      const eventError = new NotFoundError('Event');
      expect(eventError.message).toBe('Event not found');

      const postError = new NotFoundError('Post');
      expect(postError.message).toBe('Post not found');
    });
  });

  describe('AuthenticationError', () => {
    it('should create a 401 error with default message', () => {
      const error = new AuthenticationError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Authentication required');
      expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should allow custom message', () => {
      const error = new AuthenticationError('Session expired');

      expect(error.message).toBe('Session expired');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 403 error with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('You are not authorized to access this resource');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should allow custom message', () => {
      const error = new UnauthorizedError('Only organizers can delete events');

      expect(error.message).toBe('Only organizers can delete events');
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 error with message', () => {
      const error = new ValidationError('Email is required');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Email is required');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('Error inheritance', () => {
    it('should be catchable as Error', () => {
      const error = new NotFoundError('User');

      try {
        throw error;
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });

    it('should be catchable as AppError', () => {
      const error = new ValidationError('Invalid input');

      try {
        throw error;
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
      }
    });

    it('should have proper error stack', () => {
      const error = new AuthenticationError();

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AuthenticationError');
    });
  });
});
