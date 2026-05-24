import { indoorState } from './indoor-state.js';
import { map } from './indoor-map.js';
import { generateUUID } from './utils.js';
import { selectEdge } from './indoor-ui.js';
import { calculateIndoorDistance } from './indoor-geometry.js';

export function createEdge(nodeA, nodeB, id = null, wheelchairAccessible = true) {
    if (nodeA.id === nodeB.id) return;

    const exists = indoorState.edges.some(edge =>
        (edge.from === nodeA.id && edge.to === nodeB.id) ||
        (edge.from === nodeB.id && edge.to === nodeA.id)
    );

    if (exists) return;

    const edge = {
        id: id ?? generateUUID(),
        type: "edge",
        from: nodeA.id,
        to: nodeB.id,
        wheelchairAccessible,
        weight: calculateIndoorDistance(nodeA, nodeB)
    };

    indoorState.edges.push(edge);
    addEdgeToMap(nodeA, nodeB, edge);
    return edge;
}

export function handleEdgeCreation(node) {
    if (indoorState.edgeStartNode === null) {
        indoorState.edgeStartNode = node;
    } else {
        createEdge(indoorState.edgeStartNode, node);
        indoorState.edgeStartNode = null;
    }
}

export function addEdgeToMap(nodeA, nodeB, edge) {
    const latlngs = [
        [nodeA.y, nodeA.x],
        [nodeB.y, nodeB.x]
    ];

    const line = L.polyline(latlngs, {
        color: edge.wheelchairAccessible ? 'blue' : 'red'
    }).addTo(map);

    edge.line = line;

    line.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (indoorState.currentTool === "select") {
            selectEdge(edge);
        }
    });
}

export function updateConnectedEdges(node) {
    indoorState.edges.forEach(edge => {
        if (edge.from === node.id || edge.to === node.id) {
            const nodeA = indoorState.nodes.find(n => n.id === edge.from);
            const nodeB = indoorState.nodes.find(n => n.id === edge.to);

            if (!nodeA || !nodeB) return;

            edge.line.setLatLngs([
                [nodeA.y, nodeA.x],
                [nodeB.y, nodeB.x]
            ]);

            edge.weight = calculateIndoorDistance(nodeA, nodeB);
        }
    });
}