import type { DemandLocation } from '../types';
import { DEMAND_PROFILES } from './constants';

export type IstanbulNode = {
  id: string;
  name: string;
  type: DemandLocation['type'];
  lng: number;
  lat: number;
  unlockDay: number;
};

/** All 39 Istanbul districts — real approximate centers */
export const ISTANBUL_NODES: IstanbulNode[] = [
  // Day 1 — core
  { id: 'loc-0', name: 'Kadıköy', type: 'residential', lng: 29.029, lat: 40.99, unlockDay: 1 },
  { id: 'loc-1', name: 'Beşiktaş', type: 'residential', lng: 29.007, lat: 41.043, unlockDay: 1 },
  { id: 'loc-2', name: 'Beyoğlu', type: 'restaurant', lng: 28.977, lat: 41.037, unlockDay: 1 },
  { id: 'loc-3', name: 'Şişli', type: 'supermarket', lng: 28.987, lat: 41.06, unlockDay: 1 },
  { id: 'loc-4', name: 'Fatih', type: 'commercial', lng: 28.949, lat: 41.018, unlockDay: 1 },

  // Early expansion
  { id: 'loc-5', name: 'Üsküdar', type: 'residential', lng: 29.015, lat: 41.025, unlockDay: 3 },
  { id: 'loc-6', name: 'Bakırköy', type: 'supermarket', lng: 28.872, lat: 40.983, unlockDay: 4 },
  { id: 'loc-7', name: 'Ataşehir', type: 'commercial', lng: 29.127, lat: 40.983, unlockDay: 5 },
  { id: 'loc-8', name: 'Kağıthane', type: 'residential', lng: 28.973, lat: 41.083, unlockDay: 6 },
  { id: 'loc-9', name: 'Zeytinburnu', type: 'factory', lng: 28.904, lat: 40.993, unlockDay: 7 },

  { id: 'loc-10', name: 'Maltepe', type: 'residential', lng: 29.151, lat: 40.935, unlockDay: 8 },
  { id: 'loc-11', name: 'Sarıyer', type: 'restaurant', lng: 29.057, lat: 41.166, unlockDay: 9 },
  { id: 'loc-12', name: 'Bahçelievler', type: 'residential', lng: 28.85, lat: 40.997, unlockDay: 10 },
  { id: 'loc-13', name: 'Ümraniye', type: 'supermarket', lng: 29.12, lat: 41.024, unlockDay: 11 },
  { id: 'loc-14', name: 'Eyüpsultan', type: 'residential', lng: 28.934, lat: 41.055, unlockDay: 12 },

  { id: 'loc-15', name: 'Kartal', type: 'commercial', lng: 29.189, lat: 40.889, unlockDay: 13 },
  { id: 'loc-16', name: 'Bağcılar', type: 'residential', lng: 28.856, lat: 41.039, unlockDay: 14 },
  { id: 'loc-17', name: 'Pendik', type: 'factory', lng: 29.233, lat: 40.878, unlockDay: 15 },
  { id: 'loc-18', name: 'Küçükçekmece', type: 'residential', lng: 28.77, lat: 41.016, unlockDay: 16 },
  { id: 'loc-19', name: 'Gaziosmanpaşa', type: 'residential', lng: 28.901, lat: 41.079, unlockDay: 17 },

  { id: 'loc-20', name: 'Tuzla', type: 'factory', lng: 29.3, lat: 40.816, unlockDay: 18 },
  { id: 'loc-21', name: 'Esenyurt', type: 'residential', lng: 28.675, lat: 41.034, unlockDay: 19 },
  { id: 'loc-22', name: 'Başakşehir', type: 'commercial', lng: 28.802, lat: 41.093, unlockDay: 20 },
  { id: 'loc-23', name: 'Avcılar', type: 'supermarket', lng: 28.721, lat: 40.979, unlockDay: 21 },
  { id: 'loc-24', name: 'Beykoz', type: 'restaurant', lng: 29.094, lat: 41.134, unlockDay: 22 },

  { id: 'loc-25', name: 'Sancaktepe', type: 'residential', lng: 29.231, lat: 41.002, unlockDay: 23 },
  { id: 'loc-26', name: 'Esenler', type: 'residential', lng: 28.876, lat: 41.043, unlockDay: 24 },
  { id: 'loc-27', name: 'Güngören', type: 'commercial', lng: 28.873, lat: 41.021, unlockDay: 25 },
  { id: 'loc-28', name: 'Bayrampaşa', type: 'supermarket', lng: 28.9, lat: 41.048, unlockDay: 26 },
  { id: 'loc-29', name: 'Çekmeköy', type: 'residential', lng: 29.179, lat: 41.037, unlockDay: 27 },

  { id: 'loc-30', name: 'Sultangazi', type: 'residential', lng: 28.868, lat: 41.106, unlockDay: 28 },
  { id: 'loc-31', name: 'Sultanbeyli', type: 'residential', lng: 29.267, lat: 40.968, unlockDay: 29 },
  { id: 'loc-32', name: 'Beylikdüzü', type: 'commercial', lng: 28.641, lat: 41.001, unlockDay: 30 },
  { id: 'loc-33', name: 'Büyükçekmece', type: 'residential', lng: 28.585, lat: 41.021, unlockDay: 32 },
  { id: 'loc-34', name: 'Arnavutköy', type: 'residential', lng: 28.74, lat: 41.185, unlockDay: 34 },

  { id: 'loc-35', name: 'Silivri', type: 'factory', lng: 28.246, lat: 41.073, unlockDay: 36 },
  { id: 'loc-36', name: 'Çatalca', type: 'residential', lng: 28.461, lat: 41.143, unlockDay: 38 },
  { id: 'loc-37', name: 'Şile', type: 'restaurant', lng: 29.613, lat: 41.175, unlockDay: 40 },
  { id: 'loc-38', name: 'Adalar', type: 'residential', lng: 29.093, lat: 40.874, unlockDay: 42 },
];

export const ISTANBUL_CENTER = { lng: 28.98, lat: 41.015 };
export const ISTANBUL_BOUNDS: [[number, number], [number, number]] = [
  [28.15, 40.75],
  [29.7, 41.28],
];

/** Free MapLibre style (OpenStreetMap data via OpenFreeMap) */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function buildIstanbulLocations(seed = 42): DemandLocation[] {
  const jitter = (i: number) => {
    const x = Math.sin(seed * 0.001 + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  return ISTANBUL_NODES.map((node, i) => {
    const profile = DEMAND_PROFILES[node.type];
    const demand =
      profile.base +
      Math.floor(jitter(i) * (profile.variance * 2 + 1)) -
      profile.variance;

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      position: { lng: node.lng, lat: node.lat },
      demandPerDay: Math.max(4, demand),
      currentStock: Math.floor(profile.base * 0.4),
      unfulfilledOrders: 0,
      maxStock: profile.base * 4,
      unlocked: node.unlockDay <= 1,
      unlockDay: node.unlockDay,
    };
  });
}
