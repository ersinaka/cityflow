import { useGameStore } from '../store/gameStore';

export function BottomPanel() {
  const orders = useGameStore((s) => s.orders);
  const locations = useGameStore((s) => s.locations);
  const messages = useGameStore((s) => s.messages);
  const completedToday = useGameStore((s) => s.completedToday);
  const failedToday = useGameStore((s) => s.failedToday);
  const lifetime = useGameStore((s) => s.lifetime);

  const pending = orders.filter((o) => o.status === 'pending');
  const completed = orders.filter((o) => o.status === 'completed').length + lifetime.totalDeliveries;
  const failed = orders.filter((o) => o.status === 'failed').length + lifetime.totalFailed;

  const alerts = locations
    .filter((l) => l.unlocked && l.unfulfilledOrders > 15)
    .slice(0, 4);

  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  return (
    <footer className="bottom-panel">
      <div className="order-col">
        <h3>Pending orders</h3>
        <ul className="order-list">
          {pending.length === 0 && <li className="muted">No pending orders</li>}
          {pending.slice(0, 6).map((o) => (
            <li key={o.id}>
              <span>{locName(o.locationId)}</span>
              <span className="qty">×{o.amount}</span>
              <span className="due">due d{o.deadline}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="order-col stats-col">
        <h3>Deliveries</h3>
        <div className="mini-stats">
          <div>
            <span className="mini-label">Today</span>
            <span className="mini-val pos">{completedToday}</span>
          </div>
          <div>
            <span className="mini-label">Failed today</span>
            <span className="mini-val neg">{failedToday}</span>
          </div>
          <div>
            <span className="mini-label">All-time OK</span>
            <span className="mini-val">{completed}</span>
          </div>
          <div>
            <span className="mini-label">All-time fail</span>
            <span className="mini-val">{failed}</span>
          </div>
        </div>
      </div>

      <div className="order-col">
        <h3>Demand alerts</h3>
        <ul className="order-list">
          {alerts.length === 0 && <li className="muted">Network stable</li>}
          {alerts.map((l) => (
            <li key={l.id} className="alert">
              <span>{l.name}</span>
              <span className="qty">{l.unfulfilledOrders} waiting</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="order-col log-col">
        <h3>Log</h3>
        <ul className="order-list log">
          {messages.slice(0, 5).map((m) => (
            <li key={m.id} className={`log-${m.type}`}>
              {m.text}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
