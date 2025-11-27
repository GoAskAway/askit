/**
 * Bus Native Implementation Tests
 *
 * 100% real tests - no mocks, no fakes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Bus, NativeBus } from './Bus.native';

describe('Bus (Native)', () => {
  let bus: NativeBus;

  beforeEach(() => {
    // Create fresh instance for each test
    bus = new NativeBus();
  });

  describe('on/emit', () => {
    it('should receive emitted events', () => {
      const received: unknown[] = [];

      bus.on('test', (payload) => {
        received.push(payload);
      });

      bus.emit('test', { data: 'hello' });

      expect(received).toEqual([{ data: 'hello' }]);
    });

    it('should support multiple listeners for same event', () => {
      const received1: unknown[] = [];
      const received2: unknown[] = [];

      bus.on('multi', (payload) => received1.push(payload));
      bus.on('multi', (payload) => received2.push(payload));

      bus.emit('multi', 'value');

      expect(received1).toEqual(['value']);
      expect(received2).toEqual(['value']);
    });

    it('should handle different event names independently', () => {
      const receivedA: unknown[] = [];
      const receivedB: unknown[] = [];

      bus.on('eventA', (payload) => receivedA.push(payload));
      bus.on('eventB', (payload) => receivedB.push(payload));

      bus.emit('eventA', 'a');
      bus.emit('eventB', 'b');

      expect(receivedA).toEqual(['a']);
      expect(receivedB).toEqual(['b']);
    });

    it('should handle emit without payload', () => {
      const received: unknown[] = [];

      bus.on('noPayload', (payload) => {
        received.push(payload);
      });

      bus.emit('noPayload');

      expect(received).toEqual([undefined]);
    });

    it('should handle emit with null payload', () => {
      const received: unknown[] = [];

      bus.on('nullPayload', (payload) => {
        received.push(payload);
      });

      bus.emit('nullPayload', null);

      expect(received).toEqual([null]);
    });

    it('should handle complex payloads', () => {
      const received: unknown[] = [];
      const complexPayload = {
        array: [1, 2, 3],
        nested: { deep: { value: true } },
        date: '2024-01-01',
      };

      bus.on('complex', (payload) => {
        received.push(payload);
      });

      bus.emit('complex', complexPayload);

      expect(received).toEqual([complexPayload]);
    });

    it('should not receive events when no listeners', () => {
      // Should not throw
      expect(() => bus.emit('noListeners', 'data')).not.toThrow();
    });

    it('should catch errors in listeners without breaking other listeners', () => {
      const received: unknown[] = [];
      const consoleError = console.error;
      const errors: unknown[] = [];
      console.error = (...args) => errors.push(args);

      bus.on('errorTest', () => {
        throw new Error('Listener error');
      });
      bus.on('errorTest', (payload) => {
        received.push(payload);
      });

      bus.emit('errorTest', 'value');

      // Second listener should still receive
      expect(received).toEqual(['value']);
      expect(errors.length).toBe(1);

      console.error = consoleError;
    });
  });

  describe('off', () => {
    it('should unsubscribe listener', () => {
      const received: unknown[] = [];
      const callback = (payload: unknown) => received.push(payload);

      bus.on('offTest', callback);
      bus.emit('offTest', 'first');

      bus.off('offTest', callback);
      bus.emit('offTest', 'second');

      expect(received).toEqual(['first']);
    });

    it('should only remove specified callback', () => {
      const received1: unknown[] = [];
      const received2: unknown[] = [];
      const callback1 = (payload: unknown) => received1.push(payload);
      const callback2 = (payload: unknown) => received2.push(payload);

      bus.on('partial', callback1);
      bus.on('partial', callback2);

      bus.off('partial', callback1);
      bus.emit('partial', 'value');

      expect(received1).toEqual([]);
      expect(received2).toEqual(['value']);
    });

    it('should handle off for non-existent event', () => {
      const callback = () => {};
      expect(() => bus.off('nonExistent', callback)).not.toThrow();
    });

    it('should handle off for non-existent callback', () => {
      bus.on('exists', () => {});
      expect(() => bus.off('exists', () => {})).not.toThrow();
    });

    it('should clean up empty listener sets', () => {
      const callback = () => {};
      bus.on('cleanup', callback);
      bus.off('cleanup', callback);

      // Internal check - listener map should be clean
      // Emit should not throw
      expect(() => bus.emit('cleanup', 'data')).not.toThrow();
    });
  });

  describe('once', () => {
    it('should only fire once', () => {
      const received: unknown[] = [];

      bus.once('onceTest', (payload) => {
        received.push(payload);
      });

      bus.emit('onceTest', 'first');
      bus.emit('onceTest', 'second');
      bus.emit('onceTest', 'third');

      expect(received).toEqual(['first']);
    });

    it('should work with multiple once listeners', () => {
      const received1: unknown[] = [];
      const received2: unknown[] = [];

      bus.once('multiOnce', (payload) => received1.push(payload));
      bus.once('multiOnce', (payload) => received2.push(payload));

      bus.emit('multiOnce', 'value');
      bus.emit('multiOnce', 'value2');

      expect(received1).toEqual(['value']);
      expect(received2).toEqual(['value']);
    });

    it('should work together with on listeners', () => {
      const onceReceived: unknown[] = [];
      const onReceived: unknown[] = [];

      bus.once('mixed', (payload) => onceReceived.push(payload));
      bus.on('mixed', (payload) => onReceived.push(payload));

      bus.emit('mixed', '1');
      bus.emit('mixed', '2');

      expect(onceReceived).toEqual(['1']);
      expect(onReceived).toEqual(['1', '2']);
    });
  });

  describe('engine integration', () => {
    it('should register engine broadcaster', () => {
      const broadcasts: Array<{ event: string; payload: unknown }> = [];

      const unregister = bus._registerEngine((event, payload) => {
        broadcasts.push({ event, payload });
      });

      bus.emit('engineEvent', 'data');

      expect(broadcasts).toEqual([{ event: 'engineEvent', payload: 'data' }]);

      unregister();
    });

    it('should broadcast to multiple engines', () => {
      const broadcasts1: Array<{ event: string; payload: unknown }> = [];
      const broadcasts2: Array<{ event: string; payload: unknown }> = [];

      bus._registerEngine((event, payload) => {
        broadcasts1.push({ event, payload });
      });
      bus._registerEngine((event, payload) => {
        broadcasts2.push({ event, payload });
      });

      bus.emit('multiEngine', 'data');

      expect(broadcasts1).toEqual([{ event: 'multiEngine', payload: 'data' }]);
      expect(broadcasts2).toEqual([{ event: 'multiEngine', payload: 'data' }]);
    });

    it('should unregister engine broadcaster', () => {
      const broadcasts: Array<{ event: string; payload: unknown }> = [];

      const unregister = bus._registerEngine((event, payload) => {
        broadcasts.push({ event, payload });
      });

      bus.emit('before', '1');
      unregister();
      bus.emit('after', '2');

      expect(broadcasts).toEqual([{ event: 'before', payload: '1' }]);
    });

    it('should handle engine message', () => {
      const received: unknown[] = [];

      bus.on('fromEngine', (payload) => {
        received.push(payload);
      });

      bus._handleEngineMessage('fromEngine', { source: 'guest' });

      expect(received).toEqual([{ source: 'guest' }]);
    });

    it('should catch errors in _handleEngineMessage listeners', () => {
      const received: unknown[] = [];
      const consoleError = console.error;
      const errors: unknown[] = [];
      console.error = (...args) => errors.push(args);

      bus.on('engineError', () => {
        throw new Error('Engine message handler error');
      });
      bus.on('engineError', (payload) => {
        received.push(payload);
      });

      bus._handleEngineMessage('engineError', 'data');

      // Second listener should still receive
      expect(received).toEqual(['data']);
      expect(errors.length).toBe(1);

      console.error = consoleError;
    });

    it('should catch errors in engine broadcasters', () => {
      const consoleError = console.error;
      const errors: unknown[] = [];
      console.error = (...args) => errors.push(args);

      bus._registerEngine(() => {
        throw new Error('Engine broadcast error');
      });

      expect(() => bus.emit('errorEngine', 'data')).not.toThrow();
      expect(errors.length).toBe(1);

      console.error = consoleError;
    });
  });

  describe('singleton export', () => {
    it('should export Bus as BusAPI', () => {
      expect(Bus).toBeDefined();
      expect(typeof Bus.emit).toBe('function');
      expect(typeof Bus.on).toBe('function');
      expect(typeof Bus.off).toBe('function');
      expect(typeof Bus.once).toBe('function');
    });
  });
});
