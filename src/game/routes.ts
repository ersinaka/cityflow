import type { Point, Route, Warehouse, DemandLocation } from '../types';
import { ROUTE_DAILY_COST_PER_UNIT } from '../data/constants';

/** Haversine distance in kilometers */
export function distanceKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Game distance units (~100 m each) */
export function distanceBetween(a: Point, b: Point): number {
  return distanceKm(a, b) * 10;
}

export function getNodePosition(
  id: string,
  warehouses: Warehouse[],
  locations: DemandLocation[],
): Point | null {
  const w = warehouses.find((x) => x.id === id);
  if (w) return w.position;
  const l = locations.find((x) => x.id === id);
  if (l) return l.position;
  return null;
}

export function canConnect(
  fromId: string,
  toId: string,
  warehouses: Warehouse[],
  locations: DemandLocation[],
  routes: Route[],
): { ok: boolean; reason?: string } {
  if (fromId === toId) return { ok: false, reason: 'Cannot connect a node to itself.' };

  const fromIsWh = warehouses.some((w) => w.id === fromId);
  const toIsWh = warehouses.some((w) => w.id === toId);
  const fromIsLoc = locations.some((l) => l.id === fromId && l.unlocked);
  const toIsLoc = locations.some((l) => l.id === toId && l.unlocked);

  if (!fromIsWh && !fromIsLoc) return { ok: false, reason: 'Invalid start node.' };
  if (!toIsWh && !toIsLoc) return { ok: false, reason: 'Invalid end node.' };

  if (!fromIsWh && !toIsWh) {
    return { ok: false, reason: 'Routes must connect through a warehouse or hub.' };
  }

  const exists = routes.some(
    (r) =>
      (r.fromId === fromId && r.toId === toId) ||
      (r.fromId === toId && r.toId === fromId),
  );
  if (exists) return { ok: false, reason: 'A route already exists between these nodes.' };

  const from = getNodePosition(fromId, warehouses, locations);
  const to = getNodePosition(toId, warehouses, locations);
  if (from && to && distanceKm(from, to) > 35) {
    return { ok: false, reason: 'Route too long (max ~35 km). Build intermediate hubs.' };
  }

  return { ok: true };
}

export function createRoute(
  fromId: string,
  toId: string,
  warehouses: Warehouse[],
  locations: DemandLocation[],
  id: string,
): Route | null {
  const from = getNodePosition(fromId, warehouses, locations);
  const to = getNodePosition(toId, warehouses, locations);
  if (!from || !to) return null;

  const dist = distanceBetween(from, to);
  const km = distanceKm(from, to);
  return {
    id,
    fromId,
    toId,
    distance: Math.round(dist),
    vehicleIds: [],
    capacity: 0,
    travelTime: Math.max(1, Math.round(km * 2)),
    closed: false,
  };
}

export function routeDailyCost(route: Route): number {
  if (route.closed) return 0;
  return route.distance * ROUTE_DAILY_COST_PER_UNIT;
}

export function updateRouteCapacity(route: Route, vehicleCapacity: number): Route {
  return {
    ...route,
    capacity: route.vehicleIds.length * vehicleCapacity,
  };
}

export function pointAlongRoute(from: Point, to: Point, t: number): Point {
  return {
    lng: from.lng + (to.lng - from.lng) * t,
    lat: from.lat + (to.lat - from.lat) * t,
  };
}
