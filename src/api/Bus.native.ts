/**
 * Bus - Native Implementation (Host App)
 *
 * Provides event-based communication between Host and Plugin engines.
 * In native environment, Bus manages multiple engine instances and broadcasts events.
 */

import type { BusAPI, BusEventCallback } from '../types';

type ListenerMap = Map<string, Set<BusEventCallback<unknown>>>;

class NativeBus implements BusAPI {
  private listeners: ListenerMap = new Map();
  private engineBroadcasters: Set<(event: string, payload: unknown) => void> = new Set();

  /**
   * Emit an event to all listeners and active engine instances
   */
  emit(event: string, payload?: unknown): void {
    // Notify local listeners
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

    // Broadcast to all registered engines
    this.engineBroadcasters.forEach((broadcast) => {
      try {
        broadcast(event, payload);
      } catch (error) {
        console.error(`[askit/Bus] Error broadcasting to engine:`, error);
      }
    });
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

  // =========================================================================
  // Internal methods for Core module
  // =========================================================================

  /**
   * Register an engine broadcaster (called by askit/core)
   * @internal
   */
  _registerEngine(broadcaster: (event: string, payload: unknown) => void): () => void {
    this.engineBroadcasters.add(broadcaster);
    return () => {
      this.engineBroadcasters.delete(broadcaster);
    };
  }

  /**
   * Handle incoming message from engine (called by askit/core)
   * @internal
   */
  _handleEngineMessage(event: string, payload: unknown): void {
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
}

export const Bus: BusAPI = new NativeBus();

// Export the class for internal use by core module
export { NativeBus };
