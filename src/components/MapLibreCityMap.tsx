import { useEffect, useRef } from 'react';
import {
  Map,
  NavigationControl,
  type GeoJSONSource,
  type MapMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useGameStore } from '../store/gameStore';
import { LOCATION_COLORS } from '../data/constants';
import { ISTANBUL_CENTER, ISTANBUL_BOUNDS, MAP_STYLE } from '../data/istanbul';
import { getNodePosition, pointAlongRoute } from '../game/routes';
import type { DemandLocation, Warehouse, Vehicle, Route } from '../types';
import type { Feature, FeatureCollection } from 'geojson';

const emptyFc: FeatureCollection = { type: 'FeatureCollection', features: [] };

function locFeatures(
  locations: DemandLocation[],
  selectedId: string | null,
  draft: string | null,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: locations.map((l) => ({
      type: 'Feature' as const,
      properties: {
        id: l.id,
        kind: 'location',
        color: LOCATION_COLORS[l.type],
        unlocked: l.unlocked,
        selected: l.id === selectedId || l.id === draft,
        orders: l.unfulfilledOrders,
        label: l.unlocked ? l.name : `Gün ${l.unlockDay}`,
        opacity: l.unlocked ? 1 : 0.35,
      },
      geometry: { type: 'Point' as const, coordinates: [l.position.lng, l.position.lat] },
    })),
  };
}

function whFeatures(
  warehouses: Warehouse[],
  selectedId: string | null,
  draft: string | null,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: warehouses.map((w) => ({
      type: 'Feature' as const,
      properties: {
        id: w.id,
        kind: 'warehouse',
        color: LOCATION_COLORS[w.type],
        selected: w.id === selectedId || w.id === draft,
        label: `${w.name} (${w.stock}/${w.capacity})`,
      },
      geometry: { type: 'Point' as const, coordinates: [w.position.lng, w.position.lat] },
    })),
  };
}

function routeFeatures(
  routes: Route[],
  warehouses: Warehouse[],
  locations: DemandLocation[],
  selectedId: string | null,
): FeatureCollection {
  const features: Feature[] = [];
  for (const route of routes) {
    const from = getNodePosition(route.fromId, warehouses, locations);
    const to = getNodePosition(route.toId, warehouses, locations);
    if (!from || !to) continue;
    features.push({
      type: 'Feature',
      properties: {
        id: route.id,
        kind: 'route',
        closed: route.closed,
        selected: route.id === selectedId,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

function vehicleFeatures(
  vehicles: Vehicle[],
  routes: Route[],
  warehouses: Warehouse[],
  locations: DemandLocation[],
): FeatureCollection {
  const features: Feature[] = [];
  for (const v of vehicles) {
    if (!v.routeId) continue;
    const route = routes.find((r) => r.id === v.routeId);
    if (!route) continue;
    const from = getNodePosition(route.fromId, warehouses, locations);
    const to = getNodePosition(route.toId, warehouses, locations);
    if (!from || !to) continue;
    const whIsFrom = warehouses.some((w) => w.id === route.fromId);
    const start = whIsFrom ? from : to;
    const end = whIsFrom ? to : from;
    const pos = pointAlongRoute(start, end, Math.min(1, Math.max(0, v.progress)));
    features.push({
      type: 'Feature',
      properties: { id: v.id, cargo: v.cargo > 0 },
      geometry: { type: 'Point', coordinates: [pos.lng, pos.lat] },
    });
  }
  return { type: 'FeatureCollection', features };
}

function ensureLayers(map: Map) {
  if (map.getSource('routes')) return;
  map.addSource('routes', { type: 'geojson', data: emptyFc });
  map.addSource('locations', { type: 'geojson', data: emptyFc });
  map.addSource('warehouses', { type: 'geojson', data: emptyFc });
  map.addSource('vehicles', { type: 'geojson', data: emptyFc });
  map.addSource('draft', { type: 'geojson', data: emptyFc });

  map.addLayer({
    id: 'routes-hit',
    type: 'line',
    source: 'routes',
    paint: { 'line-width': 14, 'line-opacity': 0 },
  });
  map.addLayer({
    id: 'routes-line',
    type: 'line',
    source: 'routes',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': [
        'case',
        ['get', 'closed'],
        '#e74c3c',
        ['get', 'selected'],
        '#1e293b',
        '#64748b',
      ],
      'line-width': ['case', ['get', 'selected'], 4, 2.5],
      'line-opacity': 0.85,
    },
  });
  map.addLayer({
    id: 'locations-halo',
    type: 'circle',
    source: 'locations',
    paint: {
      'circle-radius': ['case', ['get', 'selected'], 18, 14],
      'circle-color': '#ffffff',
      'circle-opacity': ['get', 'opacity'],
      'circle-stroke-width': ['case', ['get', 'selected'], 2.5, 1.5],
      'circle-stroke-color': ['case', ['get', 'selected'], '#1e293b', '#e2e8f0'],
    },
  });
  map.addLayer({
    id: 'locations-circle',
    type: 'circle',
    source: 'locations',
    paint: {
      'circle-radius': ['case', ['==', ['get', 'unlocked'], false], 7, 11],
      'circle-color': ['get', 'color'],
      'circle-opacity': ['get', 'opacity'],
    },
  });
  map.addLayer({
    id: 'locations-label',
    type: 'symbol',
    source: 'locations',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 11,
      'text-offset': [0, 1.6],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#1e293b',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
      'text-opacity': ['get', 'opacity'],
    },
  });
  map.addLayer({
    id: 'locations-badge',
    type: 'circle',
    source: 'locations',
    filter: ['>', ['get', 'orders'], 0],
    paint: {
      'circle-radius': 7,
      'circle-color': '#e74c3c',
      'circle-translate': [10, -10],
    },
  });
  map.addLayer({
    id: 'warehouses-halo',
    type: 'circle',
    source: 'warehouses',
    paint: {
      'circle-radius': ['case', ['get', 'selected'], 20, 16],
      'circle-color': '#ffffff',
      'circle-stroke-width': ['case', ['get', 'selected'], 2.5, 1.5],
      'circle-stroke-color': ['case', ['get', 'selected'], '#1e293b', '#e2e8f0'],
    },
  });
  map.addLayer({
    id: 'warehouses-circle',
    type: 'circle',
    source: 'warehouses',
    paint: { 'circle-radius': 13, 'circle-color': ['get', 'color'] },
  });
  map.addLayer({
    id: 'warehouses-label',
    type: 'symbol',
    source: 'warehouses',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 11,
      'text-offset': [0, 1.8],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#1e293b',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  });
  map.addLayer({
    id: 'vehicles-circle',
    type: 'circle',
    source: 'vehicles',
    paint: {
      'circle-radius': 6,
      'circle-color': ['case', ['get', 'cargo'], '#5B8DEF', '#94a3b8'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#334155',
    },
  });
  map.addLayer({
    id: 'draft-ring',
    type: 'circle',
    source: 'draft',
    paint: {
      'circle-radius': 22,
      'circle-color': 'transparent',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#5B8DEF',
    },
  });
}

function setSource(map: Map, id: string, data: FeatureCollection) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

type Props = {
  onFitRef?: (fit: () => void) => void;
  onFatal?: () => void;
};

export function MapLibreCityMap({ onFitRef, onFatal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const readyRef = useRef(false);

  const locations = useGameStore((s) => s.locations);
  const warehouses = useGameStore((s) => s.warehouses);
  const routes = useGameStore((s) => s.routes);
  const vehicles = useGameStore((s) => s.vehicles);
  const selectedId = useGameStore((s) => s.selectedId);
  const routeDraftFrom = useGameStore((s) => s.routeDraftFrom);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: Map;

    try {
      map = new Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [ISTANBUL_CENTER.lng, ISTANBUL_CENTER.lat],
        zoom: 10.2,
        maxBounds: ISTANBUL_BOUNDS,
        minZoom: 8.5,
        maxZoom: 16,
        attributionControl: { compact: true },
      });
    } catch {
      onFatal?.();
      return;
    }

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    const fail = () => {
      if (!cancelled) onFatal?.();
    };

    map.on('error', (e) => {
      const msg = String(e.error?.message || e.error || '');
      if (/WebGL|GPU/i.test(msg)) fail();
    });

    map.on('load', () => {
      if (cancelled) return;
      try {
        ensureLayers(map);
        readyRef.current = true;
        const s = useGameStore.getState();
        setSource(map, 'locations', locFeatures(s.locations, s.selectedId, s.routeDraftFrom));
        setSource(map, 'warehouses', whFeatures(s.warehouses, s.selectedId, s.routeDraftFrom));
        setSource(map, 'routes', routeFeatures(s.routes, s.warehouses, s.locations, s.selectedId));
        setSource(
          map,
          'vehicles',
          vehicleFeatures(s.vehicles, s.routes, s.warehouses, s.locations),
        );
      } catch {
        fail();
      }
    });

    map.on('click', (e: MapMouseEvent) => {
      const s = useGameStore.getState();
      const hits = map.queryRenderedFeatures(e.point, {
        layers: [
          'warehouses-circle',
          'warehouses-halo',
          'locations-circle',
          'locations-halo',
          'routes-hit',
          'routes-line',
        ],
      });
      const hit = hits[0];
      if (hit?.properties?.kind === 'route') {
        s.handleRouteClick(String(hit.properties.id));
        return;
      }
      if (hit?.properties?.kind === 'warehouse') {
        s.handleNodeClick(String(hit.properties.id), 'warehouse');
        return;
      }
      if (hit?.properties?.kind === 'location') {
        if (!hit.properties.unlocked && s.tool !== 'select') return;
        s.handleNodeClick(String(hit.properties.id), 'location');
        return;
      }
      if (s.tool === 'warehouse' || s.tool === 'distribution') {
        s.placeWarehouseAt(
          e.lngLat.lng,
          e.lngLat.lat,
          s.tool === 'warehouse' ? 'warehouse' : 'distribution',
        );
      }
    });

    onFitRef?.(() => {
      map.fitBounds(ISTANBUL_BOUNDS, { padding: 40, duration: 600 });
    });

    mapRef.current = map;
    return () => {
      cancelled = true;
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [onFatal, onFitRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setSource(map, 'locations', locFeatures(locations, selectedId, routeDraftFrom));
    setSource(map, 'warehouses', whFeatures(warehouses, selectedId, routeDraftFrom));
    setSource(map, 'routes', routeFeatures(routes, warehouses, locations, selectedId));
    const draftPos = routeDraftFrom
      ? getNodePosition(routeDraftFrom, warehouses, locations)
      : null;
    setSource(
      map,
      'draft',
      draftPos
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: { type: 'Point', coordinates: [draftPos.lng, draftPos.lat] },
              },
            ],
          }
        : emptyFc,
    );
  }, [locations, warehouses, routes, selectedId, routeDraftFrom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setSource(map, 'vehicles', vehicleFeatures(vehicles, routes, warehouses, locations));
  }, [vehicles, routes, warehouses, locations]);

  return <div ref={containerRef} className="maplibre-root" />;
}
