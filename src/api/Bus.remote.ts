/**
 * Bus - Remote Implementation (Plugin/Sandbox)
 *
 * In sandbox environment, Bus communicates with Host through the bridge.
 * Uses global.sendToHost and global.onHostEvent provided by Rill runtime.
 */

import type { BusAPI, BusEventCallback } from '../types';

type ListenerMap = Map<string, Set<BusEventCallback<unknown>>>;

// Declare globals injected by Rill runtime
declare const global: {
  sendToHost?: (event: string, payload?: unknown) => void;
  onHostEvent?: (callback: (event: string, payload: unknown) => void) => void;
};

class RemoteBus implements BusAPI {
  private listeners: ListenerMap = new Map();
  private initialized = false;

  constructor() {
    this.initHostEventListener();
  }

  /**
   * Initialize host event listener (once)
   */
  private initHostEventListener(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Register callback to receive events from Host
    if (typeof global.onHostEvent === 'function') {
      global.onHostEvent((event: string, payload: unknown) => {
        this.handleHostEvent(event, payload);
      });
    }
  }

  /**
   * Handle incoming event from Host
   */
  private handleHostEvent(event: string, payload: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[askit/Bus] Error in listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Emit an event to Host
   */
  emit(event: string, payload?: unknown): void {
    // Also notify local listeners in sandbox
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[askit/Bus] Error in listener for "${event}":`, error);
        }
      });
    }

    // Send to Host through bridge
    if (typeof global.sendToHost === 'function') {
      global.sendToHost(`bus:${event}`, payload);
    } else {
      console.warn('[askit/Bus] sendToHost not available in this environment');
    }
  }

  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, callback: BusEventCallback<T>): void {
    let callbacks = this.listeners.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.listeners.set(event, callbacks);
    }
    callbacks.add(callback as BusEventCallback<unknown>);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = unknown>(event: string, callback: BusEventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as BusEventCallback<unknown>);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Subscribe to an event once
   */
  once<T = unknown>(event: string, callback: BusEventCallback<T>): void {
    const wrapper: BusEventCallback<T> = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    this.on(event, wrapper);
  }

  /**
   * Simulate receiving event from host (for testing)
   * @internal
   */
  _simulateHostEvent(event: string, payload: unknown): void {
    this.handleHostEvent(event, payload);
  }
}

export const Bus: BusAPI = new RemoteBus();

// Export class for testing
export { RemoteBus };
