import { state } from './state.js';
import { indoorMap, outdoorMap } from './maps.js';
import { hideInfoPanel, updateBuildingSelect } from './ui.js';
import { loadFloorplanForActiveFloor } from './floorplans.js';
import { renderActiveGraph, clearActiveGraphLayers } from './render.js';

export function setMode(mode) {
    if (state.mode === mode) return;

    clearActiveGraphLayers();

    state.mode = mode;
    state.selectedObject = null;
    state.edgeStartNode = null;

    document.getElementById("outdoor-map").classList.toggle("hidden", mode !== "outdoor");
    document.getElementById("indoor-map").classList.toggle("hidden", mode !== "indoor");
    document.getElementById("building-select").classList.toggle("hidden", mode !== "indoor");
    document.getElementById("floor-controls").classList.toggle("hidden", mode !== "indoor");

    hideInfoPanel()

    if (mode === "outdoor") {
        outdoorMap.invalidateSize();
        renderActiveGraph();

    } else {
        updateBuildingSelect();

        loadFloorplanForActiveFloor().then(() => {
            indoorMap.invalidateSize();
            renderActiveGraph();
        }).catch(err => {
            console.error("Floorplan could not be loaded: ", err);
            indoorMap.invalidateSize();
            renderActiveGraph();
        });
    }
}
