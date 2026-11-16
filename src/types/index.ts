export type LocationType =
  | 'residential'
  | 'restaurant'
  | 'supermarket'
  | 'factory'
  | 'commercial'
  | 'warehouse'
  | 'distribution';

export type ToolType =
  | 'select'
  | 'warehouse'
  | 'distribution'
  | 'route'
  | 'vehicle'
  | 'delete';

export type GameSpeed = 0 | 1 | 2 | 3;

export type TutorialStep =
  | 'place_warehouse'
  | 'connect_route'
  | 'assign_vehicle'
  | 'start_sim'
  | 'first_delivery'
  | 'done';

export type EventType =
  | 'weekend_surge'
  | 'road_closure'
  | 'capacity_issue'
  | 'large_customer'
  | 'none';

/** Geographic position (WGS84). */
export interface Point {
  lng: number;
  lat: number;
}

export interface DemandLocation {
  id: string;
  name: string;
  type: Exclude<LocationType, 'warehouse' | 'distribution'>;
  position: Point;
  demandPerDay: number;
  currentStock: number;
  unfulfilledOrders: number;
  maxStock: number;
  unlocked: boolean;
  unlockDay: number;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'warehouse' | 'distribution';
  position: Point;
  capacity: number;
  stock: number;
  vehicleIds: string[];
  operatingCost: number;
  nearLocationId?: string;
}

export interface Route {
  id: string;
  fromId: string;
  toId: string;
  distance: number;
  vehicleIds: string[];
  capacity: number;
  travelTime: number;
  closed: boolean;
}

export interface Vehicle {
  id: string;
  warehouseId: string;
  routeId: string | null;
  capacity: number;
  operatingCost: number;
  progress: number;
  direction: 1 | -1;
  cargo: number;
  status: 'idle' | 'delivering' | 'returning';
}

export interface Order {
  id: string;
  locationId: string;
  amount: number;
  createdDay: number;
  status: 'pending' | 'in_transit' | 'completed' | 'failed';
  deadline: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  day: number;
  duration: number;
  active: boolean;
  targetId?: string;
}

export interface DayStats {
  day: number;
  revenue: number;
  costs: number;
  deliveries: number;
  failed: number;
  successRate: number;
}

export interface LifetimeStats {
  totalDays: number;
  totalDeliveries: number;
  totalFailed: number;
  totalRevenue: number;
  bestSuccessRate: number;
}

export interface GameMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  day: number;
}

export interface GameState {
  day: number;
  money: number;
  dailyRevenue: number;
  dailyCosts: number;
  successRate: number;
  speed: GameSpeed;
  paused: boolean;
  tool: ToolType;
  locations: DemandLocation[];
  warehouses: Warehouse[];
  routes: Route[];
  vehicles: Vehicle[];
  orders: Order[];
  events: GameEvent[];
  messages: GameMessage[];
  selectedId: string | null;
  selectedType: 'location' | 'warehouse' | 'route' | null;
  routeDraftFrom: string | null;
  tutorialStep: TutorialStep;
  tutorialActive: boolean;
  gameOver: boolean;
  gameOverReason: string;
  negativeDays: number;
  lowPerfDays: number;
  dayStats: DayStats[];
  lifetime: LifetimeStats;
  completedToday: number;
  failedToday: number;
  mapSeed: number;
  tickAccum: number;
  started: boolean;
}
