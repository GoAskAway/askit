/**
 * Haptic - Remote Implementation (Plugin/Sandbox)
 *
 * In sandbox environment, Haptic sends commands to Host through the bridge.
 */

import type { HapticAPI, HapticType } from '../types';

// Declare globals injected by Rill runtime
declare const global: {
  sendToHost?: (event: string, payload?: unknown) => void;
};

class RemoteHaptic implements HapticAPI {
  /**
   * Trigger haptic feedback (sends command to Host)
   */
  trigger(type: HapticType = 'medium'): void {
    if (typeof global.sendToHost === 'function') {
      global.sendToHost('askit:haptic:trigger', { type });
    } else {
      console.warn('[askit/Haptic] sendToHost not available in this environment');
    }
  }
}

export const Haptic: HapticAPI = new RemoteHaptic();
