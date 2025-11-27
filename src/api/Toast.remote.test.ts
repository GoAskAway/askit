/**
 * Toast Remote Implementation Tests
 *
 * 100% real tests - simulating sandbox environment
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Toast } from './Toast.remote';

describe('Toast (Remote)', () => {
  let sentMessages: Array<{ event: string; payload: unknown }>;
  let originalSendToHost: unknown;

  beforeEach(() => {
    originalSendToHost = (globalThis as Record<string, unknown>)['sendToHost'];
    sentMessages = [];

    (globalThis as Record<string, unknown>)['sendToHost'] = (event: string, payload?: unknown) => {
      sentMessages.push({ event, payload });
    };
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>)['sendToHost'] = originalSendToHost;
  });

  describe('show', () => {
    it('should send toast show command to host', () => {
      Toast.show('Hello');

      expect(sentMessages).toEqual([
        {
          event: 'askit:toast:show',
          payload: { message: 'Hello', options: undefined },
        },
      ]);
    });

    it('should include options in payload', () => {
      Toast.show('Test', { position: 'top', duration: 'long' });

      expect(sentMessages[0]?.payload).toEqual({
        message: 'Test',
        options: { position: 'top', duration: 'long' },
      });
    });

    it('should handle numeric duration', () => {
      Toast.show('Numeric', { duration: 5000 });

      expect(sentMessages[0]?.payload).toEqual({
        message: 'Numeric',
        options: { duration: 5000 },
      });
    });

    it('should handle position options', () => {
      Toast.show('Top', { position: 'top' });
      Toast.show('Center', { position: 'center' });
      Toast.show('Bottom', { position: 'bottom' });

      expect(sentMessages[0]?.payload).toEqual({
        message: 'Top',
        options: { position: 'top' },
      });
      expect(sentMessages[1]?.payload).toEqual({
        message: 'Center',
        options: { position: 'center' },
      });
      expect(sentMessages[2]?.payload).toEqual({
        message: 'Bottom',
        options: { position: 'bottom' },
      });
    });

    it('should handle empty message', () => {
      Toast.show('');

      expect(sentMessages[0]?.payload).toEqual({
        message: '',
        options: undefined,
      });
    });
  });

  describe('without sendToHost', () => {
    it('should warn and log when sendToHost is not available', () => {
      (globalThis as Record<string, unknown>)['sendToHost'] = undefined;

      const warnings: unknown[] = [];
      const logs: unknown[] = [];
      const originalWarn = console.warn;
      const originalLog = console.log;
      console.warn = (...args) => warnings.push(args);
      console.log = (...args) => logs.push(args);

      Toast.show('Fallback');

      expect(warnings.length).toBe(1);
      expect((warnings[0] as unknown[])?.[0]).toContain('sendToHost not available');
      expect(logs.length).toBe(1);
      expect((logs[0] as unknown[])?.[0]).toBe('[Toast] Fallback');

      console.warn = originalWarn;
      console.log = originalLog;
    });
  });
});
