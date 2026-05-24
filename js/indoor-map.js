import { indoorState } from './indoor-state.js';

export const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 5,
    zoomSnap: 0.25
});

const bounds = indoorState.floorplanBounds;
map.fitBounds(bounds);

export let floorplanOverlay = null;

export function setFloorplan(imageUrl) {
    if (floorplanOverlay) {
        map.removeLayer(floorplanOverlay);
    }

    floorplanOverlay = L.imageOverlay(imageUrl, indoorState.floorplanBounds).addTo(map);
    map.fitBounds(indoorState.floorplanBounds);
}