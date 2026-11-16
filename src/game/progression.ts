import type { GameEvent, DemandLocation } from '../types';

let eventCounter = 0;

export function maybeCreateEvent(
  day: number,
  locations: DemandLocation[],
  existing: GameEvent[],
): GameEvent | null {
  // Don't stack too many
  if (existing.some((e) => e.active)) return null;
  if (day < 3) return null;
  if (day % 5 !== 0 && day % 7 !== 0 && day % 4 !== 0) return null;

  eventCounter += 1;
  const unlocked = locations.filter((l) => l.unlocked);

  // Weekend-style surge every 7 days
  if (day % 7 === 0) {
    return {
      id: `evt-${eventCounter}`,
      type: 'weekend_surge',
      title: 'Weekend Rush',
      description: 'Residential and restaurant demand spikes for 2 days.',
      day,
      duration: 2,
      active: true,
    };
  }

  if (day % 5 === 0 && unlocked.length > 0) {
    const target = unlocked[day % unlocked.length];
    return {
      id: `evt-${eventCounter}`,
      type: 'large_customer',
      title: 'Large Customer',
      description: `${target.name} placed oversized orders. Prioritize that route.`,
      day,
      duration: 2,
      active: true,
      targetId: target.id,
    };
  }

  if (day % 4 === 0) {
    const roll = day % 3;
    if (roll === 0) {
      return {
        id: `evt-${eventCounter}`,
        type: 'capacity_issue',
        title: 'Capacity Strain',
        description: 'Warehouses restock 30% slower today due to supply delays.',
        day,
        duration: 1,
        active: true,
      };
    }
    return {
      id: `evt-${eventCounter}`,
      type: 'road_closure',
      title: 'Temporary Closure',
      description: 'A random long route is closed for 1 day. Reroute if needed.',
      day,
      duration: 1,
      active: true,
    };
  }

  return null;
}

export function tickEvents(
  events: GameEvent[],
  day: number,
): { events: GameEvent[]; expiredTitles: string[] } {
  const expiredTitles: string[] = [];
  const next = events.map((e) => {
    if (!e.active) return e;
    if (day >= e.day + e.duration) {
      expiredTitles.push(e.title);
      return { ...e, active: false };
    }
    return e;
  });
  return { events: next, expiredTitles };
}

export function checkGameOver(
  money: number,
  successRate: number,
  negativeDays: number,
  lowPerfDays: number,
  day: number,
): {
  gameOver: boolean;
  reason: string;
  negativeDays: number;
  lowPerfDays: number;
} {
  let neg = money < 0 ? negativeDays + 1 : 0;
  // Only count low perf after day 3 when there have been deliveries
  let low = day >= 3 && successRate < 0.3 ? lowPerfDays + 1 : 0;

  if (neg >= 3) {
    return {
      gameOver: true,
      reason: 'Balance stayed negative for 3 consecutive days.',
      negativeDays: neg,
      lowPerfDays: low,
    };
  }
  if (low >= 3) {
    return {
      gameOver: true,
      reason: 'Delivery performance stayed below 30% for 3 consecutive days.',
      negativeDays: neg,
      lowPerfDays: low,
    };
  }

  return { gameOver: false, reason: '', negativeDays: neg, lowPerfDays: low };
}
