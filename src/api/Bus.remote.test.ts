/**
 * Bus Remote Implementation Tests
 *
 * 100% real tests - simulating sandbox environment with real globals
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RemoteBus } from './Bus.remote';

describe('Bus (Remote)', () => {
  let bus: RemoteBus;
  let sentMessages: Array<{ event: string; payload: unknown }>;
  let originalSendToHost: unknown;
  let originalOnHostEvent: unknown;

  let hostEventCallback: ((event: string, payload: unknown) => void) | null = null;

  beforeEach(() => {
    // Save original globals
    originalSendToHost = (globalThis as Record<string, unknown>)['sendToHost'];
    originalOnHostEvent = (globalThis as Record<string, unknown>)['onHostEvent'];

    // Reset test state
    sentMessages = [];
    hostEventCallback = null;

    // Setup simulated sandbox globals
    (globalThis as Record<string, unknown>)['sendToHost'] = (event: string, payload?: unknown) => {
      sentMessages.push({ event, payload });
    };

    // Setup onHostEvent to capture the callback
    (globalThis as Record<string, unknown>)['onHostEvent'] = (
      callback: (event: string, payload: unknown) => void
    ) => {
      hostEventCallback = callback;
    };

    // Create fresh instance
    bus = new RemoteBus();
  });

  afterEach(() => {
    // Restore original globals
    (globalThis as Record<string, unknown>)['sendToHost'] = originalSendToHost;
    (globalThis as Record<string, unknown>)['onHostEvent'] = originalOnHostEvent;
  });

  describe('emit', () => {
    it('should send events to host through sendToHost', () => {
      bus.emit('myEvent', { data: 'test' });

      expect(sentMessages).toEqual([{ event: 'bus:myEvent', payload: { data: 'test' } }]);
    });

    it('should prefix events with bus:', () => {
      bus.emit('customEvent', 'payload');

      expect(sentMessages[0]?.event).toBe('bus:customEvent');
    });

    it('should handle emit without payload', () => {
      bus.emit('noPayload');

      expect(sentMessages).toEqual([{ event: 'bus:noPayload', payload: undefined }]);
    });

    it('should handle complex payloads', () => {
      const complexPayload = {
        array: [1, 2, 3],
        nested: { deep: { value: true } },
      };

      bus.emit('complex', complexPayload);

      expect(sentMessages[0]?.payload).toEqual(complexPayload);
    });

    it('should also notify local listeners', () => {
      const received: unknown[] = [];

      bus.on('localNotify', (payload) => {
        received.push(payload);
      });

      bus.emit('localNotify', 'data');

      expect(received).toEqual(['data']);
      // And also sent to host
      expect(sentMessages.length).toBe(1);
    });
  });

  describe('on/off', () => {
    it('should receive events via on', () => {
      const received: unknown[] = [];

      bus.on('test', (payload) => {
        received.push(payload);
      });

      bus._simulateHostEvent('test', { from: 'host' });

      expect(received).toEqual([{ from: 'host' }]);
    });

    it('should receive events through onHostEvent callback', () => {
      const received: unknown[] = [];

      bus.on('hostCallback', (payload) => {
        received.push(payload);
      });

      // Simulate host calling back through onHostEvent
      if (hostEventCallback) {
        hostEventCallback('hostCallback', { via: 'callback' });
      }

      expect(received).toEqual([{ via: 'callback' }]);
    });

    it('should support multiple listeners for same event', () => {
      const received1: unknown[] = [];
      const received2: unknown[] = [];

      bus.on('multi', (p) => received1.push(p));
      bus.on('multi', (p) => received2.push(p));

      bus._simulateHostEvent('multi', 'value');

      expect(received1).toEqual(['value']);
      expect(received2).toEqual(['value']);
    });

    it('should unsubscribe with off', () => {
      const received: unknown[] = [];
      const callback = (p: unknown) => received.push(p);

      bus.on('offTest', callback);
      bus._simulateHostEvent('offTest', 'first');

      bus.off('offTest', callback);
      bus._simulateHostEvent('offTest', 'second');

      expect(received).toEqual(['first']);
    });

    it('should only remove specified callback', () => {
      const received1: unknown[] = [];
      const received2: unknown[] = [];
      const callback1 = (p: unknown) => received1.push(p);
      const callback2 = (p: unknown) => received2.push(p);

      bus.on('partial', callback1);
      bus.on('partial', callback2);

      bus.off('partial', callback1);
      bus._simulateHostEvent('partial', 'value');

      expect(received1).toEqual([]);
      expect(received2).toEqual(['value']);
    });

    it('should handle off for non-existent event', () => {
      expect(() => bus.off('nonExistent', () => {})).not.toThrow();
    });

    it('should clean up empty listener sets', () => {
      const callback = () => {};
      bus.on('cleanup', callback);
      bus.off('cleanup', callback);

      // Should not throw
      expect(() => bus._simulateHostEvent('cleanup', 'data')).not.toThrow();
    });
  });

  describe('once', () => {
    it('should only fire once', () => {
      const received: unknown[] = [];

      bus.once('onceTest', (payload) => {
        received.push(payload);
      });

      bus._simulateHostEvent('onceTest', 'first');
      bus._simulateHostEvent('onceTest', 'second');
      bus._simulateHostEvent('onceTest', 'third');

      expect(received).toEqual(['first']);
    });

    it('should work with multiple once listeners', () => {
      const received1: unknown[] = [];
      const received2: unknown[] = [];

      bus.once('multiOnce', (p) => received1.push(p));
      bus.once('multiOnce', (p) => received2.push(p));

      bus._simulateHostEvent('multiOnce', 'value');
      bus._simulateHostEvent('multiOnce', 'value2');

      expect(received1).toEqual(['value']);
      expect(received2).toEqual(['value']);
    });

    it('should work together with on listeners', () => {
      const onceReceived: unknown[] = [];
      const onReceived: unknown[] = [];

      bus.once('mixed', (p) => onceReceived.push(p));
      bus.on('mixed', (p) => onReceived.push(p));

      bus._simulateHostEvent('mixed', '1');
      bus._simulateHostEvent('mixed', '2');

      expect(onceReceived).toEqual(['1']);
      expect(onReceived).toEqual(['1', '2']);
    });
  });

  describe('error handling', () => {
    it('should catch errors in listeners without breaking others', () => {
      const received: unknown[] = [];
      const consoleError = console.error;
      const errors: unknown[] = [];
      console.error = (...args) => errors.push(args);

      bus.on('errorEvent', () => {
        throw new Error('Listener error');
      });
      bus.on('errorEvent', (p) => received.push(p));

      bus._simulateHostEvent('errorEvent', 'data');

      expect(received).toEqual(['data']);
      expect(errors.length).toBe(1);

      console.error = consoleError;
    });

    it('should catch errors in emit local listeners', () => {
      const received: unknown[] = [];
      const consoleError = console.error;
      const errors: unknown[] = [];
      console.error = (...args) => errors.push(args);

      bus.on('emitError', () => {
        throw new Error('Emit listener error');
      });
      bus.on('emitError', (p) => received.push(p));

      bus.emit('emitError', 'data');

      expect(received).toEqual(['data']);
      expect(errors.length).toBe(1);

      console.error = consoleError;
    });
  });

  describe('without sendToHost', () => {
    it('should warn when sendToHost is not available', () => {
      // Remove sendToHost
      (globalThis as Record<string, unknown>)['sendToHost'] = undefined;

      const busWithoutHost = new RemoteBus();

      const consoleWarn = console.warn;
      const warnings: unknown[] = [];
      console.warn = (...args) => warnings.push(args);

      busWithoutHost.emit('test', 'data');

      expect(warnings.length).toBe(1);
      expect((warnings[0] as unknown[])?.[0]).toContain('sendToHost not available');

      console.warn = consoleWarn;
    });
  });
});
