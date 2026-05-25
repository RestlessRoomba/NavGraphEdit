import { state, getActiveGraph } from './state.js';
import { getActiveMap } from './maps.js';
import { generateUUID } from './utils.js';
import { selectEdge } from './ui.js';
import { calculateDistance } from './geometry.js';
import { getMarkerPosition } from './nodes.js';

// Edge creation
export function createEdge(
    nodeA,
    nodeB,
    id = null,
    wheelchairAccessible = true,
    graph = getActiveGraph(),
    render = true
) { 
    if (nodeA.id === nodeB.id) {    // Don't create edges from node to itself
        console.log("Can't connect a node to itself. Abort.")
        return null;
    };

    const exists = graph.edges.some(edge =>   // Boolean exists is true when (some returns true when edge is found)
        (edge.from === nodeA.id && edge.to === nodeB.id) || // edge already exists or
        (edge.from === nodeB.id && edge.to === nodeA.id)    // reversed edge already exists
    );

    if (exists) {   // Don't create edges that already exist
        console.log("Edge already exists. Abort");
        return null;
    }

    const edge = {  // Create edge
        id: id ?? generateUUID(),
        type: "edge",

        from: nodeA.id,
        to: nodeB.id,

        wheelchairAccessible: wheelchairAccessible ?? true,

        weight: calculateDistance(nodeA, nodeB)
    };

    graph.edges.push(edge);

    if (render) {
        addEdgeToMap(nodeA, nodeB, edge);
    }

    state.dirty = true;

    return edge;
}

// Handle Edge Creation (2-Point-Logic)
export function handleEdgeCreation(node) {
    if (state.edgeStartNode === null) {   // Case of first node
        state.edgeStartNode = node;
        console.log("Edge Start: ", node.id);
    } else {    // Case of second node
        createEdge(state.edgeStartNode, node);
        state.edgeStartNode = null;
    }
}

// Add edge to map
export function addEdgeToMap(nodeA, nodeB, edge) {
    const map = getActiveMap();

    const latlngs = [
        getMarkerPosition(nodeA),
        getMarkerPosition(nodeB)
    ];

    const line = L.polyline(latlngs, {
        color: edge.wheelchairAccessible == true ? 'blue' : 'red'  // check for checkbox(If true - blue; else: red)
    }).addTo(map);

    edge.line = line;

    line.on('click', function(e) {
        L.DomEvent.stopPropagation(e);

        if (state.currentTool === "select") {
            selectEdge(edge);
        }
    });
}

// Remove Edge From Map
export function removeEdgeFromMap(edge) {
    const map = getActiveMap();

    if (edge.line) {
        map.removeLayer(edge.line);
        edge.line = null;
    }
}

// Update edges dynamically upong node drag&drop
export function updateConnectedEdges(node) {
    const graph = getActiveGraph();

    graph.edges.forEach(edge => {
        if (edge.from === node.id || edge.to === node.id) { // Find every edge that is connected to this node
            const nodeA = graph.nodes.find(n => n.id === edge.from);  // For these edges, find both connected nodes
            const nodeB = graph.nodes.find(n => n.id === edge.to);

            if (!nodeA || !nodeB) return;   // Safety

            const newLatLngs = [    // set new LatLngs
                getMarkerPosition(nodeA),
                getMarkerPosition(nodeB)
            ];

            edge.line.setLatLngs(newLatLngs);
            edge.weight = calculateDistance(nodeA, nodeB);
        }
    });
}
