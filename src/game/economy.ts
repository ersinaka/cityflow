import type { Warehouse, Vehicle, Route, DayStats } from '../types';
import {
  DELIVERY_REVENUE_PER_UNIT,
  FAILED_DELIVERY_PENALTY,
} from '../data/constants';
import { routeDailyCost } from './routes';

export function calcOperatingCosts(
  warehouses: Warehouse[],
  vehicles: Vehicle[],
  routes: Route[],
): number {
  const wh = warehouses.reduce((s, w) => s + w.operatingCost, 0);
  const vh = vehicles.reduce((s, v) => s + v.operatingCost, 0);
  const rt = routes.reduce((s, r) => s + routeDailyCost(r), 0);
  return Math.round(wh + vh + rt);
}

export function calcDeliveryRevenue(units: number): number {
  return units * DELIVERY_REVENUE_PER_UNIT;
}

export function calcFailedPenalty(count: number): number {
  return count * FAILED_DELIVERY_PENALTY;
}

export function buildDayStats(
  day: number,
  revenue: number,
  costs: number,
  deliveries: number,
  failed: number,
): DayStats {
  const total = deliveries + failed;
  return {
    day,
    revenue,
    costs,
    deliveries,
    failed,
    successRate: total === 0 ? 1 : deliveries / total,
  };
}

export function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}₡${Math.abs(Math.round(n)).toLocaleString()}`;
}
