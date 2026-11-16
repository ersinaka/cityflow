import type {
  Order,
  Warehouse,
  Route,
  Vehicle,
  DemandLocation,
} from '../types';
import { VEHICLE_CAPACITY } from '../data/constants';
import { updateRouteCapacity } from './routes';

export interface DeliveryTickResult {
  warehouses: Warehouse[];
  locations: DemandLocation[];
  routes: Route[];
  vehicles: Vehicle[];
  orders: Order[];
  deliveredUnits: number;
  completedOrders: number;
  failedOrders: number;
  revenue: number;
  penalty: number;
}

function findWarehouseForRoute(
  route: Route,
  warehouses: Warehouse[],
): Warehouse | undefined {
  return (
    warehouses.find((w) => w.id === route.fromId) ||
    warehouses.find((w) => w.id === route.toId)
  );
}

function findDemandForRoute(
  route: Route,
  locations: DemandLocation[],
): DemandLocation | undefined {
  return (
    locations.find((l) => l.id === route.toId && l.unlocked) ||
    locations.find((l) => l.id === route.fromId && l.unlocked)
  );
}

/** Assign idle vehicles to open routes from their warehouse */
export function assignVehiclesToRoutes(
  vehicles: Vehicle[],
  routes: Route[],
  warehouses: Warehouse[],
): { vehicles: Vehicle[]; routes: Route[] } {
  let nextVehicles = vehicles.map((v) => ({ ...v }));
  let nextRoutes = routes.map((r) => ({ ...r, vehicleIds: [...r.vehicleIds] }));

  for (const v of nextVehicles) {
    if (v.routeId) continue;
    const wh = warehouses.find((w) => w.id === v.warehouseId);
    if (!wh) continue;

    const candidate = nextRoutes.find(
      (r) =>
        !r.closed &&
        (r.fromId === wh.id || r.toId === wh.id) &&
        r.vehicleIds.length < 4,
    );
    if (!candidate) continue;

    v.routeId = candidate.id;
    v.status = 'delivering';
    v.progress = 0;
    v.direction = 1;
    v.cargo = 0;
    candidate.vehicleIds.push(v.id);
  }

  nextRoutes = nextRoutes.map((r) => updateRouteCapacity(r, VEHICLE_CAPACITY));
  return { vehicles: nextVehicles, routes: nextRoutes };
}

/** Process one animation tick of vehicle movement and deliveries */
export function tickVehicles(
  vehicles: Vehicle[],
  routes: Route[],
  warehouses: Warehouse[],
  locations: DemandLocation[],
  orders: Order[],
  speedFactor: number,
): DeliveryTickResult {
  let deliveredUnits = 0;
  let completedOrders = 0;
  let revenue = 0;
  const penalty = 0;
  let failedOrders = 0;

  const whMap = new Map(warehouses.map((w) => [w.id, { ...w }]));
  const locMap = new Map(locations.map((l) => [l.id, { ...l }]));
  const orderList = orders.map((o) => ({ ...o }));
  const routeMap = new Map(routes.map((r) => [r.id, { ...r, vehicleIds: [...r.vehicleIds] }]));

  const nextVehicles = vehicles.map((v) => {
    const vehicle = { ...v };
    if (!vehicle.routeId || vehicle.status === 'idle') return vehicle;

    const route = routeMap.get(vehicle.routeId);
    if (!route || route.closed) {
      vehicle.routeId = null;
      vehicle.status = 'idle';
      vehicle.progress = 0;
      vehicle.cargo = 0;
      return vehicle;
    }

    const wh = findWarehouseForRoute(route, [...whMap.values()]);
    const loc = findDemandForRoute(route, [...locMap.values()]);
    if (!wh || !loc) return vehicle;

    const step = (0.012 * speedFactor) / Math.max(1, route.travelTime / 2);
    vehicle.progress += step * vehicle.direction;

    // Leaving warehouse: load cargo
    if (vehicle.status === 'delivering' && vehicle.cargo === 0 && vehicle.progress <= step) {
      const pending = orderList.filter(
        (o) => o.locationId === loc.id && o.status === 'pending',
      );
      const need = pending.reduce((s, o) => s + o.amount, 0);
      const take = Math.min(vehicle.capacity, wh.stock, need || vehicle.capacity);
      if (take > 0 && wh.stock > 0) {
        const actual = Math.min(take, whMap.get(wh.id)!.stock);
        whMap.get(wh.id)!.stock -= actual;
        vehicle.cargo = actual;
      } else if (need === 0) {
        // No demand — idle on route slowly
        vehicle.progress = Math.min(vehicle.progress, 0.05);
      }
    }

    // Arrived at demand location
    if (vehicle.direction === 1 && vehicle.progress >= 1) {
      vehicle.progress = 1;
      if (vehicle.cargo > 0) {
        const locState = locMap.get(loc.id)!;
        let remaining = vehicle.cargo;

        for (const order of orderList) {
          if (remaining <= 0) break;
          if (order.locationId !== loc.id || order.status !== 'pending') continue;
          const fill = Math.min(order.amount, remaining);
          order.amount -= fill;
          remaining -= fill;
          deliveredUnits += fill;
          revenue += fill * 12;
          locState.currentStock = Math.min(locState.maxStock, locState.currentStock + fill);
          locState.unfulfilledOrders = Math.max(0, locState.unfulfilledOrders - fill);
          if (order.amount <= 0) {
            order.status = 'completed';
            order.amount = 0;
            completedOrders += 1;
          }
        }

        // leftover cargo stays as stock at location or returned
        if (remaining > 0) {
          locState.currentStock = Math.min(
            locState.maxStock,
            locState.currentStock + remaining,
          );
          deliveredUnits += remaining;
          revenue += remaining * 8;
        }
        vehicle.cargo = 0;
      }
      vehicle.direction = -1;
      vehicle.status = 'returning';
    }

    // Returned to warehouse
    if (vehicle.direction === -1 && vehicle.progress <= 0) {
      vehicle.progress = 0;
      vehicle.direction = 1;
      vehicle.status = 'delivering';
      // Restock warehouse gradually from "supply network"
      const whState = whMap.get(wh.id)!;
      const restock = wh.type === 'distribution' ? 22 : 12;
      whState.stock = Math.min(whState.capacity, whState.stock + restock);
    }

    return vehicle;
  });

  return {
    warehouses: [...whMap.values()],
    locations: [...locMap.values()],
    routes: [...routeMap.values()].map((r) => updateRouteCapacity(r, VEHICLE_CAPACITY)),
    vehicles: nextVehicles,
    orders: orderList,
    deliveredUnits,
    completedOrders,
    failedOrders,
    revenue,
    penalty,
  };
}

/** Fail overdue orders at end of day — only for locations on an open route */
export function failOverdueOrders(
  orders: Order[],
  locations: DemandLocation[],
  day: number,
  connectedIds: Set<string> = new Set(),
): { orders: Order[]; locations: DemandLocation[]; failed: number; penalty: number } {
  let failed = 0;
  let penalty = 0;
  const locMap = new Map(locations.map((l) => [l.id, { ...l }]));

  const nextOrders = orders.map((o) => {
    if (o.status === 'pending' && o.deadline < day) {
      // Unserved districts create pressure but do not tank performance yet
      if (!connectedIds.has(o.locationId)) {
        return { ...o, deadline: day + 2 };
      }
      failed += 1;
      penalty += 40;
      const loc = locMap.get(o.locationId);
      if (loc) {
        loc.unfulfilledOrders = Math.max(loc.unfulfilledOrders, o.amount);
      }
      return { ...o, status: 'failed' as const };
    }
    return o;
  });

  return { orders: nextOrders, locations: [...locMap.values()], failed, penalty };
}

export function restockWarehouses(warehouses: Warehouse[]): Warehouse[] {
  return warehouses.map((w) => ({
    ...w,
    stock: Math.min(
      w.capacity,
      w.stock + (w.type === 'distribution' ? 60 : 35),
    ),
  }));
}
