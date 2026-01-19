/**
 * Tests for logger utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logger,
  setTraceId,
  clearTraceId,
  createLogger,
  componentLogger,
  createPerformanceTimer,
} from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    clearTraceId();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic logger methods', () => {
    it('should log info message', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalledWith('Test info message');
    });

    it('should log warn message', () => {
      logger.warn('Test warn message');
      expect(console.warn).toHaveBeenCalledWith('Test warn message');
    });

    it('should log error message', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith('Test error message');
    });

    it('should log debug message', () => {
      logger.debug('Test debug message');
      expect(console.debug).toHaveBeenCalledWith('Test debug message');
    });

    it('should log info with extra data', () => {
      logger.info('Test message', { key: 'value' });
      expect(console.info).toHaveBeenCalledWith('Test message {"key":"value"}');
    });

    it('should log warn with extra data', () => {
      logger.warn('Warning', { count: 5 });
      expect(console.warn).toHaveBeenCalledWith('Warning {"count":5}');
    });

    it('should log error with extra data', () => {
      logger.error('Error occurred', { code: 'ERR_001' });
      expect(console.error).toHaveBeenCalledWith('Error occurred {"code":"ERR_001"}');
    });

    it('should log debug with extra data', () => {
      logger.debug('Debug info', { debug: true });
      expect(console.debug).toHaveBeenCalledWith('Debug info {"debug":true}');
    });
  });

  describe('trace ID management', () => {
    it('should include trace ID when set', () => {
      setTraceId('trace-123');
      logger.info('Test message');
      expect(console.info).toHaveBeenCalledWith('[trace-123] Test message');
    });

    it('should include trace ID with extra data', () => {
      setTraceId('trace-456');
      logger.info('Test message', { key: 'value' });
      expect(console.info).toHaveBeenCalledWith('[trace-456] Test message {"key":"value"}');
    });

    it('should clear trace ID', () => {
      setTraceId('trace-789');
      clearTraceId();
      logger.info('Test message');
      expect(console.info).toHaveBeenCalledWith('Test message');
    });

    it('should apply trace ID to all log levels', () => {
      setTraceId('trace-all');

      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      logger.debug('Debug');

      expect(console.info).toHaveBeenCalledWith('[trace-all] Info');
      expect(console.warn).toHaveBeenCalledWith('[trace-all] Warn');
      expect(console.error).toHaveBeenCalledWith('[trace-all] Error');
      expect(console.debug).toHaveBeenCalledWith('[trace-all] Debug');
    });
  });

  describe('createLogger', () => {
    it('should create a logger with component prefix', () => {
      const myLogger = createLogger('MyComponent');
      myLogger.info('Test message');
      expect(console.info).toHaveBeenCalledWith('[MyComponent] Test message');
    });

    it('should support all log levels with component prefix', () => {
      const myLogger = createLogger('TestComponent');

      myLogger.info('Info message');
      myLogger.warn('Warn message');
      myLogger.error('Error message');
      myLogger.debug('Debug message');

      expect(console.info).toHaveBeenCalledWith('[TestComponent] Info message');
      expect(console.warn).toHaveBeenCalledWith('[TestComponent] Warn message');
      expect(console.error).toHaveBeenCalledWith('[TestComponent] Error message');
      expect(console.debug).toHaveBeenCalledWith('[TestComponent] Debug message');
    });

    it('should include extra data with component prefix', () => {
      const myLogger = createLogger('DataComponent');
      myLogger.info('Message with data', { userId: 123 });
      expect(console.info).toHaveBeenCalledWith('[DataComponent] Message with data {"userId":123}');
    });

    it('should combine trace ID and component prefix', () => {
      setTraceId('trace-combo');
      const myLogger = createLogger('ComboComponent');
      myLogger.info('Combined message');
      expect(console.info).toHaveBeenCalledWith('[trace-combo] [ComboComponent] Combined message');
    });
  });

  describe('componentLogger', () => {
    it('should log info with component', () => {
      componentLogger.info('Header', 'Rendered');
      expect(console.info).toHaveBeenCalledWith('[Header] Rendered');
    });

    it('should log warn with component', () => {
      componentLogger.warn('Form', 'Invalid input');
      expect(console.warn).toHaveBeenCalledWith('[Form] Invalid input');
    });

    it('should log error with component', () => {
      componentLogger.error('API', 'Request failed');
      expect(console.error).toHaveBeenCalledWith('[API] Request failed');
    });

    it('should log debug with component', () => {
      componentLogger.debug('State', 'Updated');
      expect(console.debug).toHaveBeenCalledWith('[State] Updated');
    });

    it('should include extra data', () => {
      componentLogger.info('Button', 'Clicked', { id: 'submit-btn' });
      expect(console.info).toHaveBeenCalledWith('[Button] Clicked {"id":"submit-btn"}');
    });

    it('should combine trace ID with component', () => {
      setTraceId('req-123');
      componentLogger.info('Modal', 'Opened');
      expect(console.info).toHaveBeenCalledWith('[req-123] [Modal] Opened');
    });
  });

  describe('createPerformanceTimer', () => {
    beforeEach(() => {
      vi.spyOn(performance, 'now').mockReturnValue(0);
    });

    it('should measure elapsed time', () => {
      const timer = createPerformanceTimer('render');

      // Simulate time passing
      vi.spyOn(performance, 'now').mockReturnValue(100);

      const duration = timer.end();

      expect(duration).toBe(100);
      expect(console.info).toHaveBeenCalledWith('Performance: render {"duration":"100.00ms"}');
    });

    it('should format duration with 2 decimal places', () => {
      const timer = createPerformanceTimer('api-call');

      vi.spyOn(performance, 'now').mockReturnValue(123.456);

      timer.end();

      expect(console.info).toHaveBeenCalledWith('Performance: api-call {"duration":"123.46ms"}');
    });

    it('should handle zero duration', () => {
      const timer = createPerformanceTimer('instant');

      // Time hasn't changed
      vi.spyOn(performance, 'now').mockReturnValue(0);

      const duration = timer.end();

      expect(duration).toBe(0);
      expect(console.info).toHaveBeenCalledWith('Performance: instant {"duration":"0.00ms"}');
    });

    it('should return the numeric duration', () => {
      const timer = createPerformanceTimer('test');

      vi.spyOn(performance, 'now').mockReturnValue(50.5);

      const duration = timer.end();

      expect(typeof duration).toBe('number');
      expect(duration).toBe(50.5);
    });
  });
});
