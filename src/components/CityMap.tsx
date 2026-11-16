import { useCallback, useRef } from 'react';
import { OsmLeafletMap } from './OsmLeafletMap';
import { useGameStore } from '../store/gameStore';

/**
 * Stable OpenStreetMap basemap via Leaflet.
 * (MapLibre auto-upgrade was removing the map after a few seconds.)
 */
export function CityMap() {
  const fitRef = useRef<(() => void) | null>(null);
  const locations = useGameStore((s) => s.locations);

  const onFitRef = useCallback((fit: () => void) => {
    fitRef.current = fit;
  }, []);

  return (
    <div className="city-map">
      <div className="map-controls">
        <button
          type="button"
          onClick={() => fitRef.current?.()}
          aria-label="Tüm İstanbul"
        >
          ⌂
        </button>
      </div>

      <OsmLeafletMap onFitRef={onFitRef} />

      <div className="map-hint">
        İstanbul · OpenStreetMap ·{' '}
        {locations.filter((l) => l.unlocked).length}/{locations.length} ilçe
      </div>
    </div>
  );
}
