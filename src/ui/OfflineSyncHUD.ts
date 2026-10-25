import { bindPressAndHold } from './pressAndHold';
import { syncCurrentRegionOffline, isOfflineProtected } from '../services/offlineSyncService';
import { Icons } from './icons';

export class OfflineSyncHUD {
  constructor(_parent: HTMLElement, _centerCoordsGetter: () => [number, number]) {
    // Offline sync is cleanly integrated into the centered NearestPointsHUD master deck
  }
}
