export const state = {
    mode: "outdoor",

    schemaVersion: 2,
    graphVersion: 1,

    currentTool: "select",
    selectedObject: null,
    edgeStartNode: null,

    shiftPressed: false,
    ctrlPressed: false,
    lastTool: "select",

    loadedFileName: null,
    dirty: false,

    outdoor: {
        nodes: [],
        edges:[]
    },

    indoor: {
        activeBuildingId: "haus-1",
        activeFloorId: "EG",

        buildings: {
            "haus-1": {
                name: "Haus 1",
                floors: {
                    "EG": {
                        floorplan: {
                            imageRef: "floorplans/haus-1/eg.png",
                        },
                        nodes: [],
                        edges: []
                    }
                }
            }
        }
    }
};

export function getActiveGraph() {
    if (state.mode === "outdoor") {
        return state.outdoor;
    }

    const buildings = state.indoor.buildings[state.indoor.activeBuildingId];
    return buildings.floors[state.indoor.activeFloorId];
}
