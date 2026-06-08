// NEW BUILDINGS AND FLOORS MUST BE IMPLEMENTED HERE //
// Default Indoor State
export function createDefaultIndoorState() {
    return {
        activeBuildingId: "haus-6",   // ← исправлено
        activeFloorId: "+00",

        buildings: {
            "haus-6": {
                name: "Haus 6",
                floors: {
                    "+00": {
                        floorplan: {
                            imageRef: "floorplans/haus-6/+00.png"
                        },
                        nodes: [],
                        edges: []
                    }
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
        edges: []
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

            importedFloor.floorplan = {
                ...(defaultFloor.floorplan ?? {}),
                ...(importedFloor.floorplan ?? {})
            };

            importedFloor.nodes = importedFloor.nodes ?? [];
            importedFloor.edges = importedFloor.edges ?? [];
        }
    }

    importedIndoor.activeBuildingId = importedIndoor.activeBuildingId ?? defaults.activeBuildingId;
    importedIndoor.activeFloorId = importedIndoor.activeFloorId ?? defaults.activeFloorId;

    return importedIndoor;
}