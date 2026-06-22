import { state, createDefaultIndoorState, mergeIndoorDefaults, findNodeLocation } from './state.js';
import { createNode } from './nodes.js';
import { createEdge } from './edges.js';
import { updateVersionInput, hideInfoPanel, renderPortalEdgesList, updatePortalEdgeBanner } from './ui.js';
import { renderActiveGraph, clearAllRenderedLayers } from './render.js';
import { loadFloorplanForActiveFloor } from './floorplans.js';
import { generateUUID } from './utils.js';

const CURRENT_SCHEMA_VERSION = 3    // Outdoor, Indoor, Portal Edges

// Export
export function exportGraph() {
    const exportData = {
        metadata: {
            schemaVersion: state.schemaVersion,
            graphVersion: state.graphVersion,
            updatedAt: new Date().toISOString(),
            generator: "NavGraphEdit"
        },

        portalEdges: state.portalEdges.map(edge => serializePortalEdge(edge)),

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

            state.graphVersion = importedData.metadata?.graphVersion ?? 1;  // Get graphVersion
            updateVersionInput();

            if (importedData.outdoor || importedData.indoor) {
                importNewFormat(importedData);
            } else if (importedData.nodes && importedData.edges) {  // Support old format
                importLegacyOutdoorFormat(importedData);
            } else {
                throw new Error("Unknown graph JSON format.");
            }

            state.schemaVersion = CURRENT_SCHEMA_VERSION;

            state.selectedObject = null;
            state.edgeStartNode = null;
            state.portalEdgeStartNode = null;

            updatePortalEdgeBanner();

            hideInfoPanel();
            renderPortalEdgesList();

            // Load active Floorplan (async)
            if (state.mode === "indoor") {
                loadFloorplanForActiveFloor().then(() => {
                    renderActiveGraph();
                    console.log("Loaded.");
                }).catch(err => {
                    console.error("Floorplan could not be loaded: ", err);
                    renderActiveGraph();
                    console.log("Loaded without floorplan.");
                });
            } else {
                renderActiveGraph();
                console.log("Loaded.");
            }

        } catch(err) {

            console.error(err);
            alert("Error while loading JSON.");
        }
    };

    reader.readAsText(file);
}

// New Format (V2 / V3)
function importNewFormat(importedData) {
    state.outdoor = {
        nodes: [],
        edges: []
    };

    if (importedData.outdoor) {
        deserializeGraphInto(
            importedData.outdoor,
            state.outdoor
        );
    }

    // Merge imported Indoor Data with existing Indoor Data
    const mergedIndoor = mergeIndoorDefaults(importedData.indoor);

    state.indoor = {
        activeBuildingId: mergedIndoor.activeBuildingId,
        activeFloorId: mergedIndoor.activeFloorId,
        buildings: {}
    };

    Object.entries(mergedIndoor.buildings ?? {}).forEach(([buildingId, buildingData]) => {

        state.indoor.buildings[buildingId] = {
            name: buildingData.name ?? buildingId,
            floors: {}
        };

        Object.entries(buildingData.floors ?? {}).forEach(([floorId, floorData]) => {

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

    // Safety: activeBuildingId is invalid
    if (!state.indoor.buildings[state.indoor.activeBuildingId]) {
        state.indoor.activeBuildingId = Object.keys(state.indoor.buildings)[0];
    }

    // Safety: activeFloorId is invalid
    const activeBuilding = state.indoor.buildings[state.indoor.activeBuildingId];

    if (activeBuilding && !activeBuilding.floors[state.indoor.activeFloorId]) {
        state.indoor.activeFloorId = Object.keys(activeBuilding.floors)[0];
    }

    // Portal Edges
    state.portalEdges = deserializePortalEdges(importedData.portalEdges ?? []);
}

// Old Outdoor-Only-Format (V1)
function importLegacyOutdoorFormat(importedData) {
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
    state.portalEdges = [];
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

// Portal Edges
function deserializePortalEdges(rawPortalEdges) {
    // Filter all invalid Portal Edges
    return rawPortalEdges.filter(raw => {
        const fromValid = raw.from?.nodeId && findNodeLocation(raw.from.nodeId) !== null;
        const toValid = raw.to?.nodeId && findNodeLocation(raw.to.nodeId) !== null;

        if (!fromValid || !toValid) {
            console.warn("Portal edge import skipped, referenced node not found: ", raw);
            return false;
        }

        return true;
    }).map(raw => {
        const fromLocation = findNodeLocation(raw.from.nodeId).location;
        const toLocation = findNodeLocation(raw.to.nodeId).location;

        return {
            id: raw.id ?? generateUUID(),
            type: "portalEdge",
            name: raw.name ?? "",
            weight: raw.weight ?? 0,
            wheelchairAccessible: raw.wheelchairAccessible ?? true,
            from: { nodeId: raw.from.nodeId, location: fromLocation },
            to: { nodeId: raw.to.nodeId, location: toLocation }
        };
    });
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

function serializePortalEdge(edge) {
    return {
        id: edge.id,
        name: edge.name ?? "",
        weight: edge.weight ?? 0,
        wheelchairAccessible: edge.wheelchairAccessible ?? true,
        from: edge.from,
        to: edge.to,
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
