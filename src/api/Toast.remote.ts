/**
 * Toast - Remote Implementation (Plugin/Sandbox)
 *
 * In sandbox environment, Toast sends commands to Host through the bridge.
 */

import type { ToastAPI, ToastOptions } from '../types';

// Declare globals injected by Rill runtime
declare const global: {
  sendToHost?: (event: string, payload?: unknown) => void;
};

class RemoteToast implements ToastAPI {
  /**
   * Show a toast message (sends command to Host)
   */
  show(message: string, options?: ToastOptions): void {
    if (typeof global.sendToHost === 'function') {
      global.sendToHost('askit:toast:show', {
        message,
        options,
      });
    } else {
      console.warn('[askit/Toast] sendToHost not available in this environment');
      console.log(`[Toast] ${message}`);
    }
  }
}

export const Toast: ToastAPI = new RemoteToast();
