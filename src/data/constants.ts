export const STARTING_MONEY = 10_000;
export const WAREHOUSE_COST = 2_500;
export const DISTRIBUTION_COST = 4_500;
export const VEHICLE_COST = 800;
export const ROUTE_BUILD_COST_PER_UNIT = 2;

export const WAREHOUSE_CAPACITY = 120;
export const DISTRIBUTION_CAPACITY = 280;
export const WAREHOUSE_DAILY_COST = 80;
export const DISTRIBUTION_DAILY_COST = 160;
export const VEHICLE_DAILY_COST = 35;
export const VEHICLE_CAPACITY = 18;
export const ROUTE_DAILY_COST_PER_UNIT = 0.35;

export const DELIVERY_REVENUE_PER_UNIT = 12;
export const FAILED_DELIVERY_PENALTY = 40;
export const ORDER_DEADLINE_DAYS = 2;

export const GAME_OVER_NEGATIVE_DAYS = 3;
export const GAME_OVER_LOW_PERF_DAYS = 3;
export const LOW_PERF_THRESHOLD = 0.3;

export const TICK_MS = 50;
export const DAY_TICKS: Record<number, number> = {
  1: 200,
  2: 100,
  3: 50,
};

export const LOCATION_COLORS: Record<string, string> = {
  residential: '#7EB8A8',
  restaurant: '#E8A87C',
  supermarket: '#85C1E9',
  factory: '#A8A4CE',
  commercial: '#F5C6AA',
  warehouse: '#5B8DEF',
  distribution: '#3D6FD9',
};

export const DEMAND_PROFILES: Record<
  string,
  { base: number; variance: number; frequency: number; orderSize: number }
> = {
  residential: { base: 8, variance: 3, frequency: 0.7, orderSize: 6 },
  restaurant: { base: 14, variance: 5, frequency: 0.95, orderSize: 8 },
  supermarket: { base: 18, variance: 6, frequency: 0.8, orderSize: 14 },
  factory: { base: 28, variance: 10, frequency: 0.55, orderSize: 24 },
  commercial: { base: 12, variance: 4, frequency: 0.75, orderSize: 10 },
};
