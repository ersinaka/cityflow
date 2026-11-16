import type { DemandLocation, Point } from '../types';
import { buildIstanbulLocations } from '../data/istanbul';
import { distanceKm } from './routes';

/** Full Istanbul district map with real coordinates */
export function generateCity(seed = 42): DemandLocation[] {
  return buildIstanbulLocations(seed);
}

/** Place warehouse ~350–450 m from a district center */
export function getPlacementSpot(
  near: Point,
  existing: Point[],
  offsetAngle = 0,
): Point {
  const meters = 380;
  const dLat = (meters / 111_320) * Math.sin(offsetAngle);
  const dLng =
    (meters / (111_320 * Math.cos((near.lat * Math.PI) / 180))) * Math.cos(offsetAngle);

  const candidate: Point = {
    lng: near.lng + dLng,
    lat: near.lat + dLat,
  };

  if (existing.some((e) => distanceKm(e, candidate) < 0.2)) {
    return getPlacementSpot(near, existing, offsetAngle + 0.9);
  }
  return candidate;
}
