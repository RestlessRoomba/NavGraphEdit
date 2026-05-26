import { state } from './state.js';
import { indoorMap } from './maps.js';

let currentFloorplanLayer = null;

// Floorplan Loader
export async function loadFloorplanForActiveFloor() {
    const building = state.indoor.buildings[state.indoor.activeBuildingId];
    const floor = building.floors[state.indoor.activeFloorId];

    if (!floor.floorplan?.imageRef) return;

    if (!floor.floorplan.bounds) {
        const size = await getImageSize(floor.floorplan.imageRef);

        floor.floorplan.bounds = [
            [0, 0],
            [size.height, size.width]
        ];
    }

    if (currentFloorplanLayer) {
        indoorMap.removeLayer(currentFloorplanLayer);
    }

    currentFloorplanLayer = L.imageOverlay(
        floor.floorplan.imageRef,
        floor.floorplan.bounds
    ).addTo(indoorMap);

    indoorMap.fitBounds(floor.floorplan.bounds);
}

// Get Image Size
function getImageSize(imageRef) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = function () {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };

        img.onerror = function () {
            reject(new Error("Could not load floorplan image."));
        };

        img.src = imageRef;
    });
}

export function getActiveFloorplanBounds() {
    const building = state.indoor.buildings[state.indoor.activeBuildingId];

    if (!building) return null;

    const floor = building.floors[state.indoor.activeFloorId];

    if (!floor) return null;

    return floor.floorplan?.bounds ?? null;
}

// Check if Position is inside Image Bounds
export function isLatLngInsideActiveFloorplan(latlng) {
    const bounds = getActiveFloorplanBounds();

    if (!bounds) return false;

    const minY = bounds[0][0];
    const minX = bounds[0][1];

    const maxY = bounds[1][0];
    const maxX = bounds[1][1];

    const x = latlng.lng;
    const y = latlng.lat;

    return (
        x >= minX &&
        x <= maxX &&
        y >= minY &&
        y <= maxY
    );
}
