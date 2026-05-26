// NEW BUILDINGS AND FLOORS MUST BE IMPLEMENTED HERE //
// Default Indoor State
export function createDefaultIndoorState() {
    return {
        activeBuildingId: "haus-1",
        activeFloorId: "+00",

        buildings: {
            "haus-1": {
                name: "Haus 1",
                floors: {
                    "-01": {
                        floorplan: {
                            imageRef: "floorplans/haus-1/-01.png"
                        },
                        nodes: [],
                        edges: []
                    },

                    "+00": {
                        floorplan: {
                            imageRef: "floorplans/haus-1/+00.png"
                        },
                        nodes: [],
                        edges: []
                    },

                    "+01": {
                        floorplan: {
                            imageRef: "floorplans/haus-1/+01.png"
                        },
                        nodes: [],
                        edges: []
                    },

                    "+02": {
                        floorplan: {
                            imageRef: "floorplans/haus-1/+02.png"
                        },
                        nodes: [],
                        edges: []
                    },
                },
            },

            "haus-2": {
                name: "Haus 2",
                floors: {
                    "+00": {
                        floorplan: {
                            imageRef: "floorplans/haus-2/+00.png"
                        },
                        nodes: [],
                        edges: []
                    },

                    "+01": {
                        floorplan: {
                            imageRef: "floorplans/haus-2/+01.png"
                        },
                        nodes: [],
                        edges: []
                    },
                }
            },
            
            "haus-8": {
                name: "Haus 8",
                floors: {
                    "-01": {
                        floorplan: {
                            imageRef: "floorplans/haus-8/-01.png"
                        },
                        nodes: [],
                        edges: []
                    },

                    "+00": {
                        floorplan: {
                            imageRef: "floorplans/haus-8/+00.png"
                        },
                        nodes: [],
                        edges: []
                    },

                    "+01": {
                        floorplan: {
                            imageRef: "floorplans/haus-8/+01.png"
                        },
                        nodes: [],
                        edges: []
                    },
                }
            },
        }
    };
}

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

    outdoor: {
        nodes: [],
        edges:[]
    },

    indoor: createDefaultIndoorState()
};

export function getActiveGraph() {
    if (state.mode === "outdoor") {
        return state.outdoor;
    }

    const building = state.indoor.buildings[state.indoor.activeBuildingId];

    if (!building) {
        throw new Error(`Active building not found: ${state.indoor.activeBuildingId}`);
    }

    const floor = building.floors[state.indoor.activeFloorId];

    if (!floor) {
        throw new Error(`Active floor not found: ${state.indoor.activeFloorId}`);
    }

    return floor;
}

// Merge Indoor Defaults with existing Data
export function mergeIndoorDefaults(importedIndoor) {
    const defaults = createDefaultIndoorState();

    if (!importedIndoor) {
        return defaults;
    }

    importedIndoor.buildings = importedIndoor.buildings ?? {};

    for (const [buildingId, defaultBuilding] of Object.entries(defaults.buildings)) {
        if (!importedIndoor.buildings[buildingId]) {
            importedIndoor.buildings[buildingId] = defaultBuilding;
            continue;
        }

        const importedBuilding = importedIndoor.buildings[buildingId];

        importedBuilding.name = importedBuilding.name ?? defaultBuilding.name;

        importedBuilding.floors = importedBuilding.floors ?? {};

        for (const [floorId, defaultFloor] of Object.entries(defaultBuilding.floors)) {
            if (!importedBuilding.floors[floorId]) {
                importedBuilding.floors[floorId] = defaultFloor;
                continue;
            }

            const importedFloor = importedBuilding.floors[floorId];

            // Merge via Object-Spread
            importedFloor.floorplan = {
                ...(defaultFloor.floorplan ?? {}),
                ...(importedFloor.floorplan ?? {})
            }

            // If existent, import Nodes and Edges, otherwise create empty
            importedFloor.nodes = importedFloor.nodes ?? [];

            importedFloor.edges = importedFloor.edges ?? [];
        }
    }

    // Import active Building and Floor if existent or set to default
    importedIndoor.activeBuildingId = importedIndoor.activeBuildingId ?? defaults.activeBuildingId;

    importedIndoor.activeFloorId = importedIndoor.activeFloorId ?? defaults.activeFloorId;

    return importedIndoor;
}
