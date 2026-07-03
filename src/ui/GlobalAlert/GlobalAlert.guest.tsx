/**
 * GlobalAlert - Guest Component
 */

import type { GlobalAlertProps } from '../../types';
import { createGuestComponent } from '../guest-factory';

export const GlobalAlert = createGuestComponent<GlobalAlertProps>('GlobalAlert');

export default GlobalAlert;
