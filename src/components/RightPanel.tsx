import type { ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../game/economy';
import { VEHICLE_CAPACITY } from '../data/constants';

export function RightPanel() {
  const selectedId = useGameStore((s) => s.selectedId);
  const selectedType = useGameStore((s) => s.selectedType);
  const locations = useGameStore((s) => s.locations);
  const warehouses = useGameStore((s) => s.warehouses);
  const routes = useGameStore((s) => s.routes);
  const vehicles = useGameStore((s) => s.vehicles);
  const events = useGameStore((s) => s.events);
  const addVehicle = useGameStore((s) => s.addVehicle);
  const deleteRoute = useGameStore((s) => s.deleteRoute);

  const activeEvent = events.find((e) => e.active);

  let body: ReactNode = (
    <div className="panel-empty">
      <p className="panel-title">Inspector</p>
      <p className="panel-muted">Select a neighborhood, warehouse, or route.</p>
    </div>
  );

  if (selectedType === 'location' && selectedId) {
    const loc = locations.find((l) => l.id === selectedId);
    if (loc) {
      body = (
        <>
          <p className="panel-kicker">{loc.type}</p>
          <h2 className="panel-title">{loc.name}</h2>
          <dl className="info-list">
            <div><dt>Demand / day</dt><dd>{loc.demandPerDay}</dd></div>
            <div><dt>Current stock</dt><dd>{loc.currentStock}</dd></div>
            <div><dt>Unfulfilled</dt><dd className={loc.unfulfilledOrders > 0 ? 'warn' : ''}>{loc.unfulfilledOrders}</dd></div>
            <div><dt>Max stock</dt><dd>{loc.maxStock}</dd></div>
          </dl>
        </>
      );
    }
  }

  if (selectedType === 'warehouse' && selectedId) {
    const wh = warehouses.find((w) => w.id === selectedId);
    if (wh) {
      const assigned = vehicles.filter((v) => v.warehouseId === wh.id);
      body = (
        <>
          <p className="panel-kicker">{wh.type}</p>
          <h2 className="panel-title">{wh.name}</h2>
          <dl className="info-list">
            <div><dt>Capacity</dt><dd>{wh.capacity}</dd></div>
            <div><dt>Stock</dt><dd>{wh.stock}</dd></div>
            <div><dt>Vehicles</dt><dd>{assigned.length}</dd></div>
            <div><dt>Op. cost</dt><dd>{formatMoney(wh.operatingCost)}/day</dd></div>
          </dl>
          <button
            type="button"
            className="panel-action"
            onClick={() => addVehicle(wh.id)}
          >
            Add vehicle
          </button>
        </>
      );
    }
  }

  if (selectedType === 'route' && selectedId) {
    const route = routes.find((r) => r.id === selectedId);
    if (route) {
      body = (
        <>
          <p className="panel-kicker">{route.closed ? 'closed route' : 'route'}</p>
          <h2 className="panel-title">Logistics link</h2>
          <dl className="info-list">
            <div><dt>Distance</dt><dd>{route.distance}u</dd></div>
            <div><dt>Vehicles</dt><dd>{route.vehicleIds.length}</dd></div>
            <div><dt>Capacity</dt><dd>{route.vehicleIds.length * VEHICLE_CAPACITY}/trip</dd></div>
            <div><dt>Travel</dt><dd>~{route.travelTime} ticks</dd></div>
          </dl>
          <button
            type="button"
            className="panel-action danger"
            onClick={() => deleteRoute(route.id)}
          >
            Delete route
          </button>
        </>
      );
    }
  }

  return (
    <aside className="right-panel">
      {body}
      {activeEvent && (
        <div className="event-card">
          <p className="event-title">{activeEvent.title}</p>
          <p className="event-desc">{activeEvent.description}</p>
        </div>
      )}
    </aside>
  );
}
