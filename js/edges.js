import { state } from './state.js';
import { map } from './map.js';
import { generateUUID } from './utils.js';
import { selectEdge } from './ui.js';
import { calculateDistance } from './geometry.js';

// Edge creation
export function createEdge(
    nodeA,
    nodeB,
    id = null,
    wheelchairAccessible = true
    ) { 
    if (nodeA.id === nodeB.id) {    // Don't create edges from node to itself
        console.log("Can't connect a node to itself. Abort.")
        return;
    };

    const exists = state.edges.some(edge =>   // Boolean exists is true when (some returns true when edge is found)
    (edge.from === nodeA.id && edge.to === nodeB.id) || // edge already exists or
    (edge.from === nodeB.id && edge.to === nodeA.id)    // reversed edge already exists
    );

    if (exists) {   // Don't create edges that already exist
        console.log("Edge already exists. Abort");
        return;
    }

    const edge = {  // Create edge
        id: id ?? generateUUID(),
        type: "edge",

        from: nodeA.id,
        to: nodeB.id,

        wheelchairAccessible,

        weight: calculateDistance(nodeA, nodeB)
    };

    state.edges.push(edge);
    addEdgeToMap(nodeA, nodeB, edge);
    console.log(state.edges);
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
    const latlngs = [
        [nodeA.lat, nodeA.lng],
        [nodeB.lat, nodeB.lng]
    ];

    const line = L.polyline(latlngs, {
        color: 'blue'
    }).addTo(map);

    edge.line = line;

    line.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (state.currentTool === "select") {
            selectEdge(edge);
        }
    })
}

// Update edges dynamically upong node drag&drop
export function updateConnectedEdges(node) {
    state.edges.forEach(edge => {
        if (edge.from === node.id || edge.to === node.id) { // Find every edge that is connected to this node
            const nodeA = state.nodes.find(n => n.id === edge.from);  // For these edges, find both connected nodes
            const nodeB = state.nodes.find(n => n.id === edge.to);

            if (!nodeA || !nodeB) return;   // Safety

            const newLatLngs = [    // set new LatLngs
                [nodeA.lat, nodeA.lng],
                [nodeB.lat, nodeB.lng]
            ];

            edge.line.setLatLngs(newLatLngs);
            edge.weight = calculateDistance(nodeA, nodeB);
        }
    })
}
