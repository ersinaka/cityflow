import { useGameStore } from '../store/gameStore';
import type { ToolType } from '../types';
import {
  WAREHOUSE_COST,
  DISTRIBUTION_COST,
  VEHICLE_COST,
} from '../data/constants';

const TOOLS: {
  id: ToolType;
  label: string;
  hint: string;
  icon: string;
}[] = [
  { id: 'select', label: 'Select', hint: 'Inspect objects', icon: '↖' },
  { id: 'warehouse', label: 'Warehouse', hint: `₡${WAREHOUSE_COST}`, icon: '▦' },
  { id: 'distribution', label: 'Hub', hint: `₡${DISTRIBUTION_COST}`, icon: '▣' },
  { id: 'route', label: 'Route', hint: 'Connect nodes', icon: '╱' },
  { id: 'vehicle', label: 'Vehicle', hint: `₡${VEHICLE_COST}`, icon: '▸' },
  { id: 'delete', label: 'Delete', hint: 'Remove route', icon: '✕' },
];

export function LeftToolbar() {
  const tool = useGameStore((s) => s.tool);
  const setTool = useGameStore((s) => s.setTool);

  return (
    <aside className="left-toolbar">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tool-btn ${tool === t.id ? 'active' : ''}`}
          onClick={() => setTool(t.id)}
          title={`${t.label} — ${t.hint}`}
        >
          <span className="tool-icon">{t.icon}</span>
          <span className="tool-label">{t.label}</span>
          <span className="tool-hint">{t.hint}</span>
        </button>
      ))}
    </aside>
  );
}
