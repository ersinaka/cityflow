import { create } from 'zustand';
import type {
  GameState,
  ToolType,
  GameSpeed,
  TutorialStep,
  GameMessage,
  Warehouse,
  Vehicle,
} from '../types';
import {
  STARTING_MONEY,
  WAREHOUSE_COST,
  DISTRIBUTION_COST,
  VEHICLE_COST,
  WAREHOUSE_CAPACITY,
  DISTRIBUTION_CAPACITY,
  WAREHOUSE_DAILY_COST,
  DISTRIBUTION_DAILY_COST,
  VEHICLE_DAILY_COST,
  VEHICLE_CAPACITY,
  ROUTE_BUILD_COST_PER_UNIT,
} from '../data/constants';
import { WAREHOUSE_NAMES, DISTRIBUTION_NAMES } from '../data/names';
import { generateCity, getPlacementSpot } from '../game/cityGenerator';
import { canConnect, createRoute, distanceKm } from '../game/routes';
import {
  generateDailyOrders,
  unlockLocationsForDay,
  connectedLocationIds,
} from '../game/demand';
import {
  calcOperatingCosts,
  calcFailedPenalty,
  buildDayStats,
} from '../game/economy';
import {
  assignVehiclesToRoutes,
  tickVehicles,
  failOverdueOrders,
  restockWarehouses,
} from '../game/delivery';
import { maybeCreateEvent, tickEvents, checkGameOver } from '../game/progression';

const SAVE_KEY = 'cityflow-save-v2';

let idSeq = 1;
const nextId = (prefix: string) => `${prefix}-${idSeq++}`;

function msg(
  text: string,
  type: GameMessage['type'],
  day: number,
): GameMessage {
  return { id: nextId('msg'), text, type, day };
}

function createInitialState(seed = Date.now() % 100000): GameState {
  idSeq = 1;
  const locations = generateCity(seed);
  return {
    day: 1,
    money: STARTING_MONEY,
    dailyRevenue: 0,
    dailyCosts: 0,
    successRate: 1,
    speed: 1,
    paused: true,
    tool: 'warehouse',
    locations,
    warehouses: [],
    routes: [],
    vehicles: [],
    orders: [],
    events: [],
    messages: [
      msg('İstanbul lojistik ağına hoş geldin. Bir semtin yakınına ambari yerleştir.', 'info', 1),
    ],
    selectedId: null,
    selectedType: null,
    routeDraftFrom: null,
    tutorialStep: 'place_warehouse',
    tutorialActive: true,
    gameOver: false,
    gameOverReason: '',
    negativeDays: 0,
    lowPerfDays: 0,
    dayStats: [],
    lifetime: {
      totalDays: 1,
      totalDeliveries: 0,
      totalFailed: 0,
      totalRevenue: 0,
      bestSuccessRate: 1,
    },
    completedToday: 0,
    failedToday: 0,
    mapSeed: seed,
    tickAccum: 0,
    started: false,
  };
}

interface GameActions {
  startGame: (withTutorial?: boolean) => void;
  setTool: (tool: ToolType) => void;
  setSpeed: (speed: GameSpeed) => void;
  togglePause: () => void;
  selectObject: (
    id: string | null,
    type: GameState['selectedType'],
  ) => void;
  placeWarehouse: (locationId: string, kind: 'warehouse' | 'distribution') => void;
  placeWarehouseAt: (lng: number, lat: number, kind: 'warehouse' | 'distribution') => void;
  handleNodeClick: (id: string, kind: 'location' | 'warehouse') => void;
  handleRouteClick: (routeId: string) => void;
  addVehicle: (warehouseId: string) => void;
  deleteRoute: (routeId: string) => void;
  simulationTick: (dt: number) => void;
  advanceDay: () => void;
  dismissMessage: (id: string) => void;
  saveGame: () => void;
  loadGame: () => boolean;
  hasSave: () => boolean;
  restart: () => void;
  skipTutorial: () => void;
  advanceTutorial: (step: TutorialStep) => void;
}

function pushMessage(state: GameState, text: string, type: GameMessage['type']): GameMessage[] {
  const m = msg(text, type, state.day);
  return [m, ...state.messages].slice(0, 40);
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(42),

  startGame: (withTutorial = true) => {
    const seed = Date.now() % 100000;
    const state = createInitialState(seed);
    set({
      ...state,
      tutorialActive: withTutorial,
      tutorialStep: withTutorial ? 'place_warehouse' : 'done',
      started: true,
      paused: true,
    });
  },

  setTool: (tool) =>
    set({
      tool,
      routeDraftFrom: null,
      messages:
        tool === 'route'
          ? pushMessage(get(), 'Select a warehouse, then a demand location.', 'info')
          : get().messages,
    }),

  setSpeed: (speed) => {
    const s = get();
    const next: Partial<GameState> = {
      speed,
      paused: speed === 0,
    };
    if (speed > 0 && s.tutorialStep === 'start_sim') {
      next.tutorialStep = 'first_delivery';
    }
    set(next);
  },

  togglePause: () => {
    const s = get();
    if (s.gameOver) return;
    const paused = !s.paused;
    const next: Partial<GameState> = {
      paused,
      speed: s.speed || 1,
    };
    if (!paused && s.tutorialStep === 'start_sim') {
      next.tutorialStep = 'first_delivery';
    }
    set(next);
  },

  selectObject: (id, type) => set({ selectedId: id, selectedType: type }),

  placeWarehouse: (locationId, kind) => {
    const s = get();
    const loc = s.locations.find((l) => l.id === locationId && l.unlocked);
    if (!loc) {
      set({ messages: pushMessage(s, 'Select an unlocked location to place near.', 'warning') });
      return;
    }
    const cost = kind === 'warehouse' ? WAREHOUSE_COST : DISTRIBUTION_COST;
    if (s.money < cost) {
      set({ messages: pushMessage(s, `Need ${cost} credits to build.`, 'error') });
      return;
    }
    const existing = [
      ...s.warehouses.map((w) => w.position),
      ...s.locations.map((l) => l.position),
    ];
    const pos = getPlacementSpot(loc.position, existing, Math.PI / 4);
    const count = s.warehouses.filter((w) => w.type === kind).length;
    const name =
      kind === 'warehouse'
        ? WAREHOUSE_NAMES[count % WAREHOUSE_NAMES.length]
        : DISTRIBUTION_NAMES[count % DISTRIBUTION_NAMES.length];

    const wh: Warehouse = {
      id: nextId(kind === 'warehouse' ? 'wh' : 'dc'),
      name,
      type: kind,
      position: pos,
      capacity: kind === 'warehouse' ? WAREHOUSE_CAPACITY : DISTRIBUTION_CAPACITY,
      stock: kind === 'warehouse' ? 80 : 180,
      vehicleIds: [],
      operatingCost: kind === 'warehouse' ? WAREHOUSE_DAILY_COST : DISTRIBUTION_DAILY_COST,
      nearLocationId: loc.id,
    };

    let tutorialStep = s.tutorialStep;
    if (tutorialStep === 'place_warehouse') tutorialStep = 'connect_route';

    set({
      money: s.money - cost,
      warehouses: [...s.warehouses, wh],
      selectedId: wh.id,
      selectedType: 'warehouse',
      tool: tutorialStep === 'connect_route' ? 'route' : s.tool,
      tutorialStep,
      messages: pushMessage(
        s,
        `${name} built near ${loc.name}. Connect it with a route.`,
        'success',
      ),
    });
  },

  placeWarehouseAt: (lng, lat, kind) => {
    const s = get();
    let nearest = null as (typeof s.locations)[0] | null;
    let best = Infinity;
    for (const loc of s.locations) {
      if (!loc.unlocked) continue;
      const d = distanceKm({ lng, lat }, loc.position);
      if (d < best) {
        best = d;
        nearest = loc;
      }
    }
    if (!nearest || best > 3.5) {
      set({
        messages: pushMessage(
          s,
          'Ambariyi açık bir semtin yakınına yerleştir (en fazla ~3.5 km).',
          'warning',
        ),
      });
      return;
    }
    get().placeWarehouse(nearest.id, kind);
  },

  handleNodeClick: (id, kind) => {
    const s = get();
    if (s.gameOver) return;

    if (s.tool === 'select') {
      set({ selectedId: id, selectedType: kind });
      return;
    }

    if (s.tool === 'warehouse' || s.tool === 'distribution') {
      if (kind === 'location') {
        get().placeWarehouse(id, s.tool === 'warehouse' ? 'warehouse' : 'distribution');
      }
      return;
    }

    if (s.tool === 'vehicle') {
      if (kind === 'warehouse') {
        get().addVehicle(id);
      } else {
        set({ messages: pushMessage(s, 'Select a warehouse to add a vehicle.', 'info') });
      }
      return;
    }

    if (s.tool === 'delete') {
      // delete handled via routes primarily
      set({ selectedId: id, selectedType: kind });
      return;
    }

    if (s.tool === 'route') {
      if (!s.routeDraftFrom) {
        // Prefer starting from warehouse
        if (kind === 'warehouse') {
          set({
            routeDraftFrom: id,
            selectedId: id,
            selectedType: 'warehouse',
            messages: pushMessage(s, 'Now select a destination.', 'info'),
          });
        } else {
          // Allow location first, then warehouse
          set({
            routeDraftFrom: id,
            selectedId: id,
            selectedType: 'location',
            messages: pushMessage(s, 'Now select a warehouse to connect.', 'info'),
          });
        }
        return;
      }

      const fromId = s.routeDraftFrom;
      const toId = id;
      const check = canConnect(fromId, toId, s.warehouses, s.locations, s.routes);
      if (!check.ok) {
        set({
          routeDraftFrom: null,
          messages: pushMessage(s, check.reason || 'Invalid connection.', 'warning'),
        });
        return;
      }

      const route = createRoute(fromId, toId, s.warehouses, s.locations, nextId('route'));
      if (!route) return;

      const buildCost = Math.round(route.distance * ROUTE_BUILD_COST_PER_UNIT);
      if (s.money < buildCost) {
        set({
          routeDraftFrom: null,
          messages: pushMessage(s, `Need ${buildCost} credits to build this route.`, 'error'),
        });
        return;
      }

      let tutorialStep = s.tutorialStep;
      if (tutorialStep === 'connect_route') tutorialStep = 'assign_vehicle';

      set({
        money: s.money - buildCost,
        routes: [...s.routes, route],
        routeDraftFrom: null,
        selectedId: route.id,
        selectedType: 'route',
        tool: tutorialStep === 'assign_vehicle' ? 'vehicle' : s.tool,
        tutorialStep,
        messages: pushMessage(
          s,
          `Route built (${route.distance}u). Assign a vehicle.`,
          'success',
        ),
      });
    }
  },

  handleRouteClick: (routeId) => {
    const s = get();
    if (s.tool === 'delete') {
      get().deleteRoute(routeId);
      return;
    }
    set({ selectedId: routeId, selectedType: 'route', tool: 'select' });
  },

  addVehicle: (warehouseId) => {
    const s = get();
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return;
    if (s.money < VEHICLE_COST) {
      set({ messages: pushMessage(s, `Need ${VEHICLE_COST} credits for a vehicle.`, 'error') });
      return;
    }

    const vehicle: Vehicle = {
      id: nextId('veh'),
      warehouseId,
      routeId: null,
      capacity: VEHICLE_CAPACITY,
      operatingCost: VEHICLE_DAILY_COST,
      progress: 0,
      direction: 1,
      cargo: 0,
      status: 'idle',
    };

    const warehouses = s.warehouses.map((w) =>
      w.id === warehouseId
        ? { ...w, vehicleIds: [...w.vehicleIds, vehicle.id] }
        : w,
    );

    let { vehicles, routes } = assignVehiclesToRoutes(
      [...s.vehicles, vehicle],
      s.routes,
      warehouses,
    );

    let tutorialStep = s.tutorialStep;
    if (tutorialStep === 'assign_vehicle') tutorialStep = 'start_sim';

    set({
      money: s.money - VEHICLE_COST,
      vehicles,
      routes,
      warehouses,
      selectedId: warehouseId,
      selectedType: 'warehouse',
      tool: tutorialStep === 'start_sim' ? 'select' : s.tool,
      tutorialStep,
      messages: pushMessage(s, 'Vehicle assigned. Press Play to start the day.', 'success'),
    });
  },

  deleteRoute: (routeId) => {
    const s = get();
    const route = s.routes.find((r) => r.id === routeId);
    if (!route) return;

    const vehicles = s.vehicles.map((v) =>
      v.routeId === routeId
        ? { ...v, routeId: null, status: 'idle' as const, progress: 0, cargo: 0 }
        : v,
    );

    set({
      routes: s.routes.filter((r) => r.id !== routeId),
      vehicles,
      selectedId: null,
      selectedType: null,
      messages: pushMessage(s, 'Route removed.', 'info'),
    });
  },

  simulationTick: (dt) => {
    const s = get();
    if (s.paused || s.gameOver || s.speed === 0) return;

    const dayTicks = s.speed === 1 ? 200 : s.speed === 2 ? 100 : 50;
    const tickAccum = s.tickAccum + dt;

    // Animate vehicles every frame
    const result = tickVehicles(
      s.vehicles,
      s.routes,
      s.warehouses,
      s.locations,
      s.orders,
      s.speed,
    );

    let tutorialStep = s.tutorialStep;
    let lifetime = { ...s.lifetime };
    let completedToday = s.completedToday + result.completedOrders;
    let dailyRevenue = s.dailyRevenue + result.revenue;
    let money = s.money + result.revenue;

    if (
      tutorialStep === 'first_delivery' &&
      (result.completedOrders > 0 || result.deliveredUnits > 0)
    ) {
      tutorialStep = 'done';
    }

    lifetime.totalDeliveries += result.completedOrders;
    lifetime.totalRevenue += result.revenue;
    if (result.completedOrders > 0) {
      const rate =
        lifetime.totalDeliveries + lifetime.totalFailed === 0
          ? 1
          : lifetime.totalDeliveries /
            (lifetime.totalDeliveries + lifetime.totalFailed);
      lifetime.bestSuccessRate = Math.max(lifetime.bestSuccessRate, rate);
    }

    // Capacity issue event slows restock — handled in advanceDay mostly
    const msPerDay = dayTicks * 50;
    if (tickAccum >= msPerDay) {
      set({
        warehouses: result.warehouses,
        locations: result.locations,
        routes: result.routes,
        vehicles: result.vehicles,
        orders: result.orders,
        money,
        dailyRevenue,
        completedToday,
        lifetime,
        tutorialStep,
        tutorialActive: tutorialStep !== 'done' && s.tutorialActive,
        tickAccum: 0,
      });
      get().advanceDay();
      return;
    }

    set({
      warehouses: result.warehouses,
      locations: result.locations,
      routes: result.routes,
      vehicles: result.vehicles,
      orders: result.orders,
      money,
      dailyRevenue,
      completedToday,
      lifetime,
      tutorialStep,
      tutorialActive: tutorialStep !== 'done' && s.tutorialActive,
      tickAccum,
    });
  },

  advanceDay: () => {
    const s = get();
    if (s.gameOver) return;

    // Fail overdue from previous day (connected demand only)
    const failed = failOverdueOrders(
      s.orders,
      s.locations,
      s.day,
      connectedLocationIds(s.routes),
    );
    const failPenalty = calcFailedPenalty(failed.failed);
    const dayRevenue = s.dailyRevenue;
    const costs = calcOperatingCosts(s.warehouses, s.vehicles, s.routes);

    let money = s.money - costs - failPenalty;
    const dayStats = buildDayStats(
      s.day,
      dayRevenue,
      costs,
      s.completedToday,
      s.failedToday + failed.failed,
    );

    const lifetime = {
      ...s.lifetime,
      totalDays: s.day,
      totalFailed: s.lifetime.totalFailed + failed.failed,
      bestSuccessRate: Math.max(s.lifetime.bestSuccessRate, dayStats.successRate),
    };

    const over = checkGameOver(
      money,
      dayStats.successRate,
      s.negativeDays,
      s.lowPerfDays,
      s.day,
    );

    if (over.gameOver) {
      set({
        money,
        dailyCosts: costs,
        successRate: dayStats.successRate,
        dayStats: [...s.dayStats, dayStats],
        lifetime,
        orders: failed.orders,
        locations: failed.locations,
        gameOver: true,
        gameOverReason: over.reason,
        negativeDays: over.negativeDays,
        lowPerfDays: over.lowPerfDays,
        paused: true,
        messages: pushMessage(s, `Game over: ${over.reason}`, 'error'),
      });
      return;
    }

    const nextDay = s.day + 1;

    // Expire / create events
    let { events } = tickEvents(s.events, nextDay);
    const newEvent = maybeCreateEvent(nextDay, failed.locations, events);
    let messages = s.messages;
    let routes = s.routes.map((r) => ({ ...r, closed: false }));

    if (newEvent) {
      events = [...events, newEvent];
      messages = pushMessage(
        { ...s, day: nextDay, messages },
        `${newEvent.title}: ${newEvent.description}`,
        'warning',
      );
      if (newEvent.type === 'road_closure' && routes.length > 0) {
        const longest = [...routes].sort((a, b) => b.distance - a.distance)[0];
        routes = routes.map((r) =>
          r.id === longest.id ? { ...r, closed: true } : r,
        );
      }
    }

    const unlocked = unlockLocationsForDay(failed.locations, nextDay);
    if (unlocked.unlockedNames.length) {
      messages = pushMessage(
        { ...s, day: nextDay, messages },
        `New demand: ${unlocked.unlockedNames.join(', ')}`,
        'info',
      );
    }

    const { orders: newOrders, updatedLocations } = generateDailyOrders(
      unlocked.locations,
      nextDay,
      events,
      () => nextId('ord'),
      routes,
    );

    let warehouses = restockWarehouses(s.warehouses);
    if (events.some((e) => e.active && e.type === 'capacity_issue')) {
      warehouses = warehouses.map((w) => ({
        ...w,
        stock: Math.min(w.capacity, Math.floor(w.stock * 0.85)),
      }));
    }

    const assigned = assignVehiclesToRoutes(s.vehicles, routes, warehouses);

    // Seed day-1 orders if somehow empty on first advance — also generate for day 1 at start
    set({
      day: nextDay,
      money,
      dailyRevenue: 0,
      dailyCosts: costs,
      successRate: dayStats.successRate,
      dayStats: [...s.dayStats, dayStats],
      lifetime: { ...lifetime, totalDays: nextDay },
      orders: [
        ...failed.orders.filter((o) => o.status === 'pending' || o.status === 'in_transit'),
        ...newOrders,
      ],
      locations: updatedLocations,
      warehouses,
      vehicles: assigned.vehicles,
      routes: assigned.routes,
      events,
      messages,
      completedToday: 0,
      failedToday: 0,
      negativeDays: over.negativeDays,
      lowPerfDays: over.lowPerfDays,
      tickAccum: 0,
    });
  },

  dismissMessage: (id) =>
    set({ messages: get().messages.filter((m) => m.id !== id) }),

  saveGame: () => {
    const s = get();
    const data = {
      ...s,
      // strip actions by picking state fields
      day: s.day,
      money: s.money,
      dailyRevenue: s.dailyRevenue,
      dailyCosts: s.dailyCosts,
      successRate: s.successRate,
      speed: s.speed,
      paused: true,
      tool: s.tool,
      locations: s.locations,
      warehouses: s.warehouses,
      routes: s.routes,
      vehicles: s.vehicles,
      orders: s.orders,
      events: s.events,
      messages: s.messages,
      selectedId: s.selectedId,
      selectedType: s.selectedType,
      routeDraftFrom: null,
      tutorialStep: s.tutorialStep,
      tutorialActive: s.tutorialActive,
      gameOver: s.gameOver,
      gameOverReason: s.gameOverReason,
      negativeDays: s.negativeDays,
      lowPerfDays: s.lowPerfDays,
      dayStats: s.dayStats,
      lifetime: s.lifetime,
      completedToday: s.completedToday,
      failedToday: s.failedToday,
      mapSeed: s.mapSeed,
      tickAccum: 0,
      started: s.started,
      idSeq,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    set({ messages: pushMessage(s, 'Game saved.', 'success') });
  },

  loadGame: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (typeof data.idSeq === 'number') idSeq = data.idSeq;
      const { idSeq: _i, ...state } = data;
      set({ ...state, paused: true, started: true });
      return true;
    } catch {
      return false;
    }
  },

  hasSave: () => !!localStorage.getItem(SAVE_KEY),

  restart: () => {
    const seed = Date.now() % 100000;
    set({ ...createInitialState(seed), started: true, paused: true });
  },

  skipTutorial: () => set({ tutorialActive: false, tutorialStep: 'done' }),

  advanceTutorial: (step) => set({ tutorialStep: step }),
}));

/** Kick off first day orders when game starts */
export function seedFirstDayOrders() {
  const s = useGameStore.getState();
  if (s.orders.length > 0) return;
  const { orders, updatedLocations } = generateDailyOrders(
    s.locations,
    1,
    s.events,
    () => nextId('ord'),
    s.routes,
  );
  useGameStore.setState({ orders, locations: updatedLocations });
}

// Patch startGame to seed orders
const originalStart = useGameStore.getState().startGame;
useGameStore.setState({
  startGame: (withTutorial = true) => {
    originalStart(withTutorial);
    seedFirstDayOrders();
  },
});
