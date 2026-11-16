import type { DemandLocation, Order, GameEvent, Route } from '../types';
import { DEMAND_PROFILES, ORDER_DEADLINE_DAYS } from '../data/constants';

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Locations on an open logistics route can place orders that expire. */
export function connectedLocationIds(routes: Route[]): Set<string> {
  const ids = new Set<string>();
  for (const r of routes) {
    if (r.closed) continue;
    ids.add(r.fromId);
    ids.add(r.toId);
  }
  return ids;
}

export function generateDailyOrders(
  locations: DemandLocation[],
  day: number,
  events: GameEvent[],
  nextId: () => string,
  _routes: Route[] = [],
): { orders: Order[]; updatedLocations: DemandLocation[] } {
  const weekendSurge = events.some((e) => e.active && e.type === 'weekend_surge');
  const largeCustomer = events.find((e) => e.active && e.type === 'large_customer');
  const orders: Order[] = [];

  const updatedLocations = locations.map((loc, idx) => {
    if (!loc.unlocked) return loc;

    const profile = DEMAND_PROFILES[loc.type];
    const roll = seededRandom(day * 7919 + idx * 104729 + loc.demandPerDay);
    if (roll > profile.frequency) return loc;

    let amount = profile.orderSize + Math.floor(seededRandom(day + idx * 3) * profile.variance);
    amount = Math.max(3, amount);

    // Demand grows slowly over time
    amount += Math.floor((day - 1) / 5);

    if (weekendSurge && (loc.type === 'residential' || loc.type === 'restaurant')) {
      amount = Math.round(amount * 1.6);
    }
    if (largeCustomer && largeCustomer.targetId === loc.id) {
      amount = Math.round(amount * 2.2);
    }

    const order: Order = {
      id: nextId(),
      locationId: loc.id,
      amount,
      createdDay: day,
      status: 'pending',
      deadline: day + ORDER_DEADLINE_DAYS,
    };
    orders.push(order);

    return {
      ...loc,
      unfulfilledOrders: loc.unfulfilledOrders + amount,
      demandPerDay: Math.max(loc.demandPerDay, amount),
    };
  });

  return { orders, updatedLocations };
}

export function unlockLocationsForDay(
  locations: DemandLocation[],
  day: number,
): { locations: DemandLocation[]; unlockedNames: string[] } {
  const unlockedNames: string[] = [];
  const next = locations.map((loc) => {
    if (!loc.unlocked && loc.unlockDay <= day) {
      unlockedNames.push(loc.name);
      return { ...loc, unlocked: true };
    }
    return loc;
  });
  return { locations: next, unlockedNames };
}
