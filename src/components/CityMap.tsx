import { useCallback, useEffect, useRef, useState } from 'react';
import { MapErrorBoundary } from './MapErrorBoundary';
import { OsmLeafletMap } from './OsmLeafletMap';
import { useGameStore } from '../store/gameStore';

/**
 * Always boot Leaflet+OSM. Upgrade to MapLibre only after a live WebGL probe.
 * Probe errors are swallowed so constrained browsers never blank the game.
 */
async function probeMapLibre(): Promise<boolean> {
  let settled = false;
  const suppress = (e: ErrorEvent) => {
    if (/WebGL|GPUInitialization/i.test(String(e.message))) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  window.addEventListener('error', suppress, true);

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;

    const div = document.createElement('div');
    div.style.cssText =
      'position:fixed;left:-9999px;top:0;width:64px;height:64px;opacity:0;pointer-events:none';
    document.body.appendChild(div);

    const { Map } = await import('maplibre-gl');
    await import('maplibre-gl/dist/maplibre-gl.css');

    const ok = await new Promise<boolean>((resolve) => {
      const done = (value: boolean) => {
        if (settled) return;
        settled = true;
        try {
          map.remove();
        } catch {
          /* ignore */
        }
        div.remove();
        resolve(value);
      };

      let map: InstanceType<typeof Map>;
      try {
        map = new Map({
          container: div,
          style: {
            version: 8,
            sources: {},
            layers: [
              {
                id: 'bg',
                type: 'background',
                paint: { 'background-color': '#ffffff' },
              },
            ],
          },
          center: [28.98, 41.01],
          zoom: 9,
          attributionControl: false,
          interactive: false,
        });
      } catch {
        div.remove();
        resolve(false);
        return;
      }

      const timer = window.setTimeout(() => done(false), 2000);
      map.once('load', () => {
        window.clearTimeout(timer);
        done(true);
      });
      map.once('error', () => {
        window.clearTimeout(timer);
        done(false);
      });
    });

    return ok;
  } catch {
    return false;
  } finally {
    window.removeEventListener('error', suppress, true);
  }
}

export function CityMap() {
  const [engine, setEngine] = useState<'leaflet' | 'maplibre'>('leaflet');
  const [MapLibreCityMap, setMapLibreCityMap] = useState<
    null | typeof import('./MapLibreCityMap').MapLibreCityMap
  >(null);
  const fitRef = useRef<(() => void) | null>(null);
  const locations = useGameStore((s) => s.locations);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await probeMapLibre();
      if (cancelled || !ok) return;
      const mod = await import('./MapLibreCityMap');
      if (cancelled) return;
      setMapLibreCityMap(() => mod.MapLibreCityMap);
      setEngine('maplibre');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFitRef = useCallback((fit: () => void) => {
    fitRef.current = fit;
  }, []);

  const fallbackLeaflet = useCallback(() => {
    setEngine('leaflet');
    setMapLibreCityMap(null);
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

      {engine === 'maplibre' && MapLibreCityMap ? (
        <MapErrorBoundary fallback={<OsmLeafletMap onFitRef={onFitRef} />}>
          <MapLibreCityMap onFitRef={onFitRef} onFatal={fallbackLeaflet} />
        </MapErrorBoundary>
      ) : (
        <OsmLeafletMap onFitRef={onFitRef} />
      )}

      <div className="map-hint">
        İstanbul · OpenStreetMap · {engine === 'maplibre' ? 'MapLibre' : 'Leaflet'} ·{' '}
        {locations.filter((l) => l.unlocked).length}/{locations.length} ilçe
      </div>
    </div>
  );
}
