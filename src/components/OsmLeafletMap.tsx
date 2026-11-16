import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGameStore } from '../store/gameStore';
import { LOCATION_COLORS } from '../data/constants';
import { ISTANBUL_CENTER, ISTANBUL_BOUNDS } from '../data/istanbul';
import { getNodePosition, pointAlongRoute } from '../game/routes';

function markerHtml(
  color: string,
  label: string,
  selected: boolean,
  badge?: number,
  dimmed?: boolean,
) {
  const border = selected ? '2.5px solid #1e293b' : '1.5px solid #e2e8f0';
  const opacity = dimmed ? '0.4' : '1';
  const badgeHtml =
    badge && badge > 0
      ? `<span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;border-radius:999px;min-width:16px;height:16px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:700;padding:0 3px">${badge > 99 ? '!' : badge}</span>`
      : '';
  return `<div style="opacity:${opacity};transform:translate(-50%,-50%);cursor:pointer;text-align:center">
    <div style="position:relative;width:26px;height:26px;margin:0 auto;border-radius:50%;background:${color};border:${border};box-shadow:0 2px 8px rgba(0,0,0,.12)">${badgeHtml}</div>
    <div style="margin-top:4px;font:600 11px/1.2 DM Sans,system-ui,sans-serif;color:#1e293b;text-shadow:0 0 4px #fff,0 0 4px #fff;white-space:nowrap">${label}</div>
  </div>`;
}

type Props = { onFitRef?: (fit: () => void) => void };

export function OsmLeafletMap({ onFitRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    routes: L.LayerGroup;
    nodes: L.LayerGroup;
    vehicles: L.LayerGroup;
  } | null>(null);

  const locations = useGameStore((s) => s.locations);
  const warehouses = useGameStore((s) => s.warehouses);
  const routes = useGameStore((s) => s.routes);
  const vehicles = useGameStore((s) => s.vehicles);
  const selectedId = useGameStore((s) => s.selectedId);
  const routeDraftFrom = useGameStore((s) => s.routeDraftFrom);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [ISTANBUL_CENTER.lat, ISTANBUL_CENTER.lng],
      zoom: 10,
      minZoom: 9,
      maxZoom: 16,
      maxBounds: L.latLngBounds(
        [ISTANBUL_BOUNDS[0][1], ISTANBUL_BOUNDS[0][0]],
        [ISTANBUL_BOUNDS[1][1], ISTANBUL_BOUNDS[1][0]],
      ),
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const routesLayer = L.layerGroup().addTo(map);
    const nodesLayer = L.layerGroup().addTo(map);
    const vehiclesLayer = L.layerGroup().addTo(map);
    layersRef.current = { routes: routesLayer, nodes: nodesLayer, vehicles: vehiclesLayer };
    mapRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const s = useGameStore.getState();
      if (s.tool === 'warehouse' || s.tool === 'distribution') {
        s.placeWarehouseAt(
          e.latlng.lng,
          e.latlng.lat,
          s.tool === 'warehouse' ? 'warehouse' : 'distribution',
        );
      }
    });

    const fit = () => {
      map.fitBounds([
        [ISTANBUL_BOUNDS[0][1], ISTANBUL_BOUNDS[0][0]],
        [ISTANBUL_BOUNDS[1][1], ISTANBUL_BOUNDS[1][0]],
      ]);
    };
    onFitRef?.(fit);
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, [onFitRef]);

  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.routes.clearLayers();
    layers.nodes.clearLayers();

    for (const route of routes) {
      const from = getNodePosition(route.fromId, warehouses, locations);
      const to = getNodePosition(route.toId, warehouses, locations);
      if (!from || !to) continue;
      const line = L.polyline(
        [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        {
          color: route.closed ? '#e74c3c' : selectedId === route.id ? '#1e293b' : '#64748b',
          weight: selectedId === route.id ? 4 : 3,
          opacity: 0.85,
        },
      );
      line.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        useGameStore.getState().handleRouteClick(route.id);
      });
      line.addTo(layers.routes);
    }

    for (const loc of locations) {
      const selected = selectedId === loc.id || routeDraftFrom === loc.id;
      const icon = L.divIcon({
        className: '',
        html: markerHtml(
          LOCATION_COLORS[loc.type],
          loc.unlocked ? loc.name : `Gün ${loc.unlockDay}`,
          selected,
          loc.unfulfilledOrders,
          !loc.unlocked,
        ),
        iconSize: [0, 0],
      });
      const m = L.marker([loc.position.lat, loc.position.lng], { icon });
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        useGameStore.getState().handleNodeClick(loc.id, 'location');
      });
      m.addTo(layers.nodes);
    }

    for (const w of warehouses) {
      const selected = selectedId === w.id || routeDraftFrom === w.id;
      const icon = L.divIcon({
        className: '',
        html: markerHtml(
          LOCATION_COLORS[w.type],
          `${w.name} (${w.stock}/${w.capacity})`,
          selected,
        ),
        iconSize: [0, 0],
      });
      const m = L.marker([w.position.lat, w.position.lng], { icon, zIndexOffset: 200 });
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        useGameStore.getState().handleNodeClick(w.id, 'warehouse');
      });
      m.addTo(layers.nodes);
    }
  }, [locations, warehouses, routes, selectedId, routeDraftFrom]);

  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.vehicles.clearLayers();
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
      L.circleMarker([pos.lat, pos.lng], {
        radius: 6,
        color: '#334155',
        weight: 2,
        fillColor: v.cargo > 0 ? '#5B8DEF' : '#94a3b8',
        fillOpacity: 1,
      }).addTo(layers.vehicles);
    }
  }, [vehicles, routes, warehouses, locations]);

  return <div ref={containerRef} className="leaflet-root" />;
}
