# CITYFLOW

Minimalist browser logistics strategy game. Build warehouses, draw delivery routes, assign vehicles, and keep a growing city supplied.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## How to play

1. Place a **warehouse** near a neighborhood.
2. Draw a **route** from the warehouse to demand.
3. Assign a **vehicle**.
4. Press **Play** and expand the network as new districts unlock.
5. Keep your balance and delivery success healthy — three bad days in a row ends the run.

Progress saves to `localStorage` via the **Save** button. Use **Continue** on the title screen to reload.

## Stack

React · TypeScript · Vite · Zustand · MapLibre GL (WebGL) · Leaflet fallback · OpenStreetMap · CSS

## Map

The playable city is **all of Istanbul** (39 districts) on a real OpenStreetMap basemap.

- **MapLibre + OpenFreeMap** when the browser supports WebGL2
- **Leaflet + OSM tiles** automatically if WebGL is unavailable
- District pins use real coordinates; routes use haversine distance (km)
