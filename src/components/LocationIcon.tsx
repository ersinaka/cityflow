import type { LocationType } from '../types';
import { LOCATION_COLORS } from '../data/constants';

interface Props {
  type: LocationType;
  size?: number;
  selected?: boolean;
}

export function LocationIcon({ type, size = 28, selected }: Props) {
  const color = LOCATION_COLORS[type] || '#999';
  const r = size / 2;

  return (
    <g>
      <circle
        r={r + (selected ? 4 : 2)}
        fill="#fff"
        stroke={selected ? '#2c3e50' : '#e8ecef'}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      <circle r={r} fill={color} opacity={0.95} />
      {type === 'residential' && (
        <path
          d={`M ${-r * 0.45} ${r * 0.15} L 0 ${-r * 0.45} L ${r * 0.45} ${r * 0.15} V ${r * 0.4} H ${-r * 0.45} Z`}
          fill="#fff"
          opacity={0.9}
        />
      )}
      {type === 'restaurant' && (
        <>
          <rect x={-2} y={-r * 0.35} width={4} height={r * 0.7} rx={1} fill="#fff" />
          <circle cx={0} cy={-r * 0.4} r={3.5} fill="#fff" />
        </>
      )}
      {type === 'supermarket' && (
        <path
          d={`M ${-r * 0.4} ${-r * 0.2} H ${r * 0.4} L ${r * 0.3} ${r * 0.35} H ${-r * 0.3} Z`}
          fill="#fff"
          opacity={0.9}
        />
      )}
      {type === 'factory' && (
        <>
          <rect x={-r * 0.4} y={-r * 0.1} width={r * 0.8} height={r * 0.45} fill="#fff" opacity={0.9} />
          <rect x={-r * 0.35} y={-r * 0.4} width={4} height={r * 0.35} fill="#fff" opacity={0.9} />
          <rect x={r * 0.1} y={-r * 0.35} width={4} height={r * 0.3} fill="#fff" opacity={0.9} />
        </>
      )}
      {type === 'commercial' && (
        <>
          <rect x={-r * 0.35} y={-r * 0.35} width={r * 0.7} height={r * 0.7} rx={2} fill="#fff" opacity={0.9} />
          <line x1={0} y1={-r * 0.35} x2={0} y2={r * 0.35} stroke={color} strokeWidth={1.5} />
          <line x1={-r * 0.35} y1={0} x2={r * 0.35} y2={0} stroke={color} strokeWidth={1.5} />
        </>
      )}
      {(type === 'warehouse' || type === 'distribution') && (
        <path
          d={`M ${-r * 0.45} ${r * 0.1} L 0 ${-r * 0.4} L ${r * 0.45} ${r * 0.1} V ${r * 0.4} H ${-r * 0.45} Z`}
          fill="#fff"
          opacity={0.95}
        />
      )}
    </g>
  );
}
