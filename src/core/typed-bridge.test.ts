/**
 * Type-safe Bridge Tests
 */

import type { TypedSendToHost } from '../types';
import { createTypedSender, TypedBridge, validatePayload } from './typed-bridge';

describe('Type-safe Bridge', () => {
  describe('createTypedSender', () => {
    it('should create a typed sender wrapper', () => {
      const messages: Array<{ event: string; payload: unknown }> = [];
      const mockSendToHost: TypedSendToHost = ((event: string, payload?: unknown) => {
        messages.push({ event, payload });
      }) as TypedSendToHost;

      const send = createTypedSender(mockSendToHost);

      send('askit:toast:show', ['Hello', { position: 'top' }]);

      expect(messages).toEqual([
        { event: 'askit:toast:show', payload: ['Hello', { position: 'top' }] },
      ]);
    });

    it('should handle missing sendToHost gracefully', () => {
      const warnings: unknown[] = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args);

      const send = createTypedSender(undefined);
      send('askit:toast:show', ['Hello']);

      expect(warnings.length).toBeGreaterThanOrEqual(1);
      expect(JSON.stringify(warnings)).toContain('sendToHost not available');

      console.warn = originalWarn;
    });
  });

  describe('TypedBridge', () => {
    let messages: Array<{ event: string; payload: unknown }>;
    let mockSendToHost: TypedSendToHost;
    let bridge: TypedBridge;

    beforeEach(() => {
      messages = [];
      mockSendToHost = ((event: string, payload?: unknown) => {
        messages.push({ event, payload });
      }) as TypedSendToHost;
      bridge = new TypedBridge(mockSendToHost);
    });

    it('should send toast messages', () => {
      bridge.send('askit:toast:show', ['Test message', { duration: 'long' }]);

      expect(messages).toEqual([
        { event: 'askit:toast:show', payload: ['Test message', { duration: 'long' }] },
      ]);
    });

    it('should send haptic messages', () => {
      bridge.send('askit:haptic:trigger', ['success']);

      expect(messages).toEqual([{ event: 'askit:haptic:trigger', payload: ['success'] }]);
    });

    it('should send event emitter messages', () => {
      bridge.sendEvent('user:login', { id: 123 });

      expect(messages).toEqual([{ event: 'askit:event:user:login', payload: { id: 123 } }]);
    });

    it('should check if sendToHost is available', () => {
      expect(bridge.isAvailable()).toBe(true);

      const bridgeWithoutHost = new TypedBridge(undefined);
      expect(bridgeWithoutHost.isAvailable()).toBe(false);
    });

    it('should handle missing sendToHost', () => {
      const warnings: unknown[] = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args);

      const bridgeWithoutHost = new TypedBridge(undefined);
      bridgeWithoutHost.send('askit:toast:show', ['Test']);

      expect(warnings.length).toBe(1);

      console.warn = originalWarn;
    });
  });

  describe('validatePayload', () => {
    it('should validate toast show payload', () => {
      expect(validatePayload('askit:toast:show', ['Hello', { position: 'top' }])).toBe(true);
      expect(validatePayload('askit:toast:show', ['Hello'])).toBe(true);
      expect(validatePayload('askit:toast:show', ['Hello', undefined])).toBe(true);
    });

    it('should reject invalid toast payloads', () => {
      expect(validatePayload('askit:toast:show', [123])).toBe(false); // number instead of string
      expect(validatePayload('askit:toast:show', 'not an array')).toBe(false);
      expect(validatePayload('askit:toast:show', [])).toBe(false); // missing message
    });

    it('should validate haptic trigger payload', () => {
      expect(validatePayload('askit:haptic:trigger', ['success'])).toBe(true);
      expect(validatePayload('askit:haptic:trigger', [])).toBe(true);
      expect(validatePayload('askit:haptic:trigger', [undefined])).toBe(true);
    });

    it('should reject invalid haptic payloads', () => {
      expect(validatePayload('askit:haptic:trigger', [123])).toBe(false);
      expect(validatePayload('askit:haptic:trigger', 'not an array')).toBe(false);
    });
  });
});
