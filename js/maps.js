import { state } from './state.js';

const MAX_NATIVE_ZOOM = 19;
const MAX_EDITOR_ZOOM = 23;

const osmLayer = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxNativeZoom: MAX_NATIVE_ZOOM,
        maxZoom: MAX_EDITOR_ZOOM
    }
);

const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        maxNativeZoom: MAX_NATIVE_ZOOM,
        maxZoom: MAX_EDITOR_ZOOM
    }
);

// Outdoor Map
export const outdoorMap = L.map('outdoor-map', {
    center: [50.98720771879944, 12.973063896924302],
    zoom: 19,
    maxZoom: MAX_EDITOR_ZOOM,
    layers: [osmLayer],
    preferCanvas: true
});

L.control.layers({
    "Map": osmLayer,
    "Satellite": satelliteLayer
}).addTo(outdoorMap);

// Indoor Map
export const indoorMap = L.map('indoor-map', {
    crs: L.CRS.Simple,
    minZoom: -3,
    maxZoom: 5,
    zoomSnap: 0.25,
    preferCanvas: true
});

// Get Active Map
export function getActiveMap() {
    return state.mode === "outdoor" ? outdoorMap : indoorMap;
}
