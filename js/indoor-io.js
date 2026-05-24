import { indoorState } from './indoor-state.js';
import { map } from './indoor-map.js';
import { createNode } from './indoor-nodes.js';
import { createEdge } from './indoor-edges.js';

export function exportGraph() {
    const exportData = {
        mode: "indoor",
        building: indoorState.building,
        floor: indoorState.floor,
        bounds: indoorState.floorplanBounds,

        nodes: indoorState.nodes.map(node => ({
            id: node.id,
            x: node.x,
            y: node.y,
            tags: node.tags || [],
            building: node.building,
            floor: node.floor
        })),

        edges: indoorState.edges.map(edge => ({
            id: edge.id,
            from: edge.from,
            to: edge.to,
            wheelchairAccessible: edge.wheelchairAccessible,
            weight: edge.weight
        }))
    };

    const dataString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = "indoor_network.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

export function importGraph(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            indoorState.nodes.forEach(node => {
                if (node.marker) map.removeLayer(node.marker);
            });

            indoorState.edges.forEach(edge => {
                if (edge.line) map.removeLayer(edge.line);
            });

            indoorState.nodes = [];
            indoorState.edges = [];

            if (importedData.building) indoorState.building = importedData.building;
            if (importedData.floor) indoorState.floor = importedData.floor;
            if (importedData.bounds) indoorState.floorplanBounds = importedData.bounds;

            if (importedData.nodes) {
                importedData.nodes.forEach(nodeData => {
                    createNode(
                        {
                            lat: nodeData.y,
                            lng: nodeData.x,
                            tags: nodeData.tags || []
                        },
                        nodeData.id
                    );
                });
            }

            if (importedData.edges) {
                importedData.edges.forEach(edgeData => {
                    const nodeA = indoorState.nodes.find(n => n.id === edgeData.from);
                    const nodeB = indoorState.nodes.find(n => n.id === edgeData.to);

                    if (nodeA && nodeB) {
                        createEdge(
                            nodeA,
                            nodeB,
                            edgeData.id,
                            edgeData.wheelchairAccessible ?? true
                        );
                    }
                });
            }
        } catch (err) {
            console.error(err);
            alert("Error while loading indoor JSON.");
        }
    };

    reader.readAsText(file);
}