/**
 * Type-safe Bridge Utilities
 *
 * Provides type-safe wrappers for sending messages between Host and Guest
 */

import type { AskitMessageMap, TypedSendToHost } from '../types';
import { logger } from './logger';

/**
 * Create a type-safe sendToHost wrapper
 *
 * @example
 * ```typescript
 * const send = createTypedSender(global.sendToHost);
 *
 * // ✅ Type-safe - correct payload
 * send('askit:toast:show', ['Hello', { position: 'top' }]);
 *
 * // ❌ Type error - wrong payload type
 * send('askit:toast:show', [123, {}]); // Error: number is not assignable to string
 *
 * // ❌ Type error - missing required parameter
 * send('askit:toast:show', []); // Error: Expected 1-2 arguments
 * ```
 */
export function createTypedSender(sendToHost?: TypedSendToHost): TypedSendToHost {
  const sender: TypedSendToHost = ((event: string, payload?: unknown) => {
    if (typeof sendToHost === 'function') {
      sendToHost(event, payload);
    } else {
      logger.warn('TypedBridge', 'sendToHost not available');
    }
  }) as TypedSendToHost;

  return sender;
}

/**
 * Type-safe message sender class
 *
 * @example
 * ```typescript
 * const bridge = new TypedBridge(global.sendToHost);
 *
 * // Type-safe module calls
 * bridge.send('askit:toast:show', ['Hello', { duration: 'long' }]);
 * bridge.send('askit:haptic:trigger', ['success']);
 *
 * // Type-safe event emitter calls
 * bridge.sendEvent('user:login', { id: 123 });
 * ```
 */
export class TypedBridge {
  private sendToHost?: TypedSendToHost;

  constructor(sendToHost?: TypedSendToHost) {
    this.sendToHost = sendToHost;
  }

  /**
   * Send a type-safe message to host
   */
  send<K extends keyof AskitMessageMap>(event: K, payload: AskitMessageMap[K]): void {
    if (typeof this.sendToHost === 'function') {
      this.sendToHost(event, payload);
    } else {
      logger.warn('TypedBridge', 'sendToHost not available');
    }
  }

  /**
   * Send an event emitter message (askit:event: prefix)
   */
  sendEvent(eventName: string, payload?: unknown): void {
    if (typeof this.sendToHost === 'function') {
      this.sendToHost(`askit:event:${eventName}`, payload);
    } else {
      logger.warn('TypedBridge', 'sendToHost not available');
    }
  }

  /**
   * Check if sendToHost is available
   */
  isAvailable(): boolean {
    return typeof this.sendToHost === 'function';
  }
}

/**
 * Validate message payload at runtime
 *
 * @example
 * ```typescript
 * const isValid = validatePayload('askit:toast:show', ['Hello', { position: 'top' }]);
 * ```
 */
export function validatePayload(event: keyof AskitMessageMap, payload: unknown): boolean {
  if (!Array.isArray(payload)) {
    return false;
  }

  switch (event) {
    case 'askit:toast:show': {
      const [message, options] = payload;
      if (typeof message !== 'string') return false;
      if (options !== undefined && typeof options !== 'object') return false;
      return true;
    }

    case 'askit:haptic:trigger': {
      const [type] = payload;
      if (type !== undefined && typeof type !== 'string') return false;
      return true;
    }

    default:
      return true;
  }
}
