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
