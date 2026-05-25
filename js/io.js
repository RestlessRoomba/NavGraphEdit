import { state, getActiveGraph } from './state.js';
import { outdoorMap, indoorMap } from './maps.js';
import { createNode, removeNodeFromMap } from './nodes.js';
import { createEdge, removeEdgeFromMap } from './edges.js';
import { updateVersionInput, hideInfoPanel } from './ui.js';
import { renderActiveGraph } from './render.js';

// Export
export function exportGraph() {
    const exportData = {
        metadata: {
            schemaVersion: state.schemaVersion,
            graphVersion: state.graphVersion,
            updatedAt: new Date().toISOString(),
            generator: "NavGraphEdit"
        },

        outdoor: serializeGraph(state.outdoor),

        indoor: {
            activeBuildingId: state.indoor.activeBuildingId,
            activeFloorId: state.indoor.activeFloorId,
            buildings: serializeIndoorBuildings()
        }
    };

    const dataString = JSON.stringify(exportData, null, 2); // Convert into string

    const blob = new Blob(  // Convert string into blob (binary large object)
        [dataString],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);  // Temp URL to blob
    const link = document.createElement('a');
    link.href = url;    // Link destination = temp URL
    link.download = `graph_network_v${state.graphVersion}.json`; // Default filename for download + Graph Version number
    document.body.appendChild(link);    // Append to document body
    link.click();   // Simulate user click
    link.remove();  // Remove temp link from document body
    URL.revokeObjectURL(url);   // Free storage
    state.dirty = false;
    console.log("Exported.");
};

// Import
export function importGraph(file) {
    if (!file) return;  // Safety

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);   // Parse file into JS-objects

            clearAllRenderedLayers();

            state.schemaVersion = importedData.metadata?.schemaVersion ?? 1;    // Get schemaVersion
            state.graphVersion = importedData.metadata?.graphVersion ?? 1;  // Get graphVersion
            updateVersionInput();

            if (importedData.outdoor || importedData.indoor) {
                importNewFormat(importedData);
            } else if (importedData.nodes && importedData.edges) {  // Support old format
                importLegacyOutdoorFormat(importedData);
            } else {
                throw new Error("Unknown graph JSON format.");
            }

            state.selectedObject = null;
            state.edgeStartNode = null;
            state.dirty = false;

            hideInfoPanel();
            renderActiveGraph();
            console.log("Loaded.");

        } catch(err) {

            console.error(err);
            alert("Error while loading JSON.");
        }
    };

    reader.readAsText(file);
}

// New Format (V2)
function importNewFormat(importedData) {
    state.outdoor = {
        nodes: [],
        edges: []
    };

    state.indoor = importedData.indoor ?? createDefaultIndoorState();

    if (importedData.outdoor) {
        deserializeGraphInto(
            importedData.outdoor,
            state.outdoor
        );
    }

    if (importedData.indoor?.buildings) {
        state.indoor.buildings = {}

        Object.entries(importedData.indoor.buildings).forEach(([buildingId, buildingData]) => { // Register Buildings in state
            state.indoor.buildings[buildingId] = {
                name: buildingData.name ?? buildingId,
                floors: {}
            };

            Object.entries(buildingData.floors ?? {}).forEach(([floorId, floorData]) => {   // Register Floors of each Building in state
                const floorGraph = {
                    floorplan: floorData.floorplan ?? null,
                    nodes: [],
                    edges: []
                };

                deserializeGraphInto(
                    floorData,
                    floorGraph
                );

                state.indoor.buildings[buildingId].floors[floorId] = floorGraph;
            });
        });

        state.indoor.activeBuildingId = importedData.indoor.activeBuildingId ?? Object.keys(state.indoor.buildings)[0];

        const activeBuilding = state.indoor.buildings[state.indoor.activeBuildingId];

        state.indoor.activeFloorId = importedData.indoor.activeFloorId ?? Object.keys(activeBuilding.floors)[0];
    }
}

// Old Outdoor-Only-Format (V1)
function importLegacyOutdoorFormat(importedData) {
    state.schemaVersion = 1;
    state.graphVersion = importedData.metadata?.graphVersion ?? 1;

    state.outdoor = {
        nodes: [],
        edges: []
    };

    deserializeGraphInto(
        importedData,
        state.outdoor
    );

    state.indoor = createDefaultIndoorState();
}

function deserializeGraphInto(data, graph) {
    graph.nodes = [];
    graph.edges = [];

    // Import Nodes
    if (data.nodes) {
        data.nodes.forEach(nodeData => {    
            if (nodeData.lat !== undefined && nodeData.lng !== undefined) {
                createNode(
                    {
                        lat: nodeData.lat,
                        lng: nodeData.lng
                    },
                    nodeData.id,
                    nodeData.tags ?? [],
                    graph,
                    false
                );
            } else {
                createNode(
                    {
                        x: nodeData.x,
                        y: nodeData.y
                    },
                    nodeData.id,
                    nodeData.tags ?? [],
                    graph,
                    false
                );
            }
        });
    }

    // Import Edges
    if (data.edges) {
        data.edges.forEach(edgeData => {
            const nodeA =
                graph.nodes.find(n => n.id === edgeData.from);

            const nodeB =
                graph.nodes.find(n => n.id === edgeData.to);

            if (!nodeA || !nodeB) {
                console.warn(
                    "Edge skipped because connected node was not found:",
                    edgeData
                );
                return;
            }

            createEdge(
                nodeA,
                nodeB,
                edgeData.id,
                edgeData.wheelchairAccessible ?? true,
                graph,
                false
            );
        });
    }
}

function serializeGraph(graph) {
    return {
        nodes: graph.nodes.map(node => serializeNode(node)),
        edges: graph.edges.map(edge => serializeEdge(edge))
    };
}

function serializeNode(node) {
    if (node.lat !== undefined && node.lng !== undefined) {
        return {
            id: node.id,
            lat: node.lat,
            lng: node.lng,
            tags: node.tags ?? []
        };
    }

    return {
        id: node.id,
        x: node.x,
        y: node.y,
        tags: node.tags ?? []
    };
}

function serializeEdge(edge) {
    return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        wheelchairAccessible: edge.wheelchairAccessible ?? true,
        weight: edge.weight
    };
}

function serializeIndoorBuildings() {
    const result = {};

    Object.entries(state.indoor.buildings)
        .forEach(([buildingId, buildingData]) => {
            result[buildingId] = {
                name: buildingData.name,
                floors: {}
            };

            Object.entries(buildingData.floors)
                .forEach(([floorId, floorData]) => {
                    result[buildingId].floors[floorId] = {
                        floorplan: floorData.floorplan ?? null,
                        nodes: floorData.nodes.map(node =>
                            serializeNode(node)
                        ),
                        edges: floorData.edges.map(edge =>
                            serializeEdge(edge)
                        )
                    };
                });
        });

    return result;
}

export function clearActiveGraphLayers() {
    const graph = getActiveGraph();

    graph.nodes.forEach(node => {
        removeNodeFromMap(node);
    });

    graph.edges.forEach(edge => {
        removeEdgeFromMap(edge);
    });
}

function clearAllRenderedLayers() {
    clearGraphLayers(state.outdoor);

    Object.values(state.indoor.buildings ?? {}).forEach(building => {
        Object.values(building.floors ?? {}).forEach(floor => {
            clearGraphLayers(floor);
        });
    });
}

function clearGraphLayers(graph) {
    graph.nodes?.forEach(node => {
        if (node.marker) {
            try {
                outdoorMap.removeLayer(node.marker);
            } catch (e) {}

            try {
                indoorMap.removeLayer(node.marker);
            } catch (e) {}

            node.marker = null;
        }
    });

    graph.edges?.forEach(edge => {
        if (edge.line) {
            try {
                outdoorMap.removeLayer(edge.line);
            } catch (e) {}

            try {
                indoorMap.removeLayer(edge.line);
            } catch (e) {}

            edge.line = null;
        }
    });
}

// Default Indoor State
function createDefaultIndoorState() {
    return {
        activeBuildingId: "haus-1",
        activeFloorId: "EG",
        buildings: {
            "haus-1": {
                name: "Haus 1",
                floors: {
                    "EG": {
                        floorplan: null,
                        nodes: [],
                        edges: []
                    }
                }
            }
        }
    };
}
