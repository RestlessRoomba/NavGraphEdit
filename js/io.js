import { state } from './state.js';
import { map } from './map.js';
import { createNode } from './nodes.js';
import { createEdge } from './edges.js';

// Export
export function exportGraph() {

    const exportData = {

        
        nodes: state.nodes.map(node => ({
            id: node.id,
            lat: node.lat,
            lng: node.lng
        })),

        edges: state.edges.map(edge => ({
            id: edge.id,
            from: edge.from,
            to: edge.to,

            wheelchairAccessible: edge.wheelchairAccessible ?? true
        }))
    };

    const dataString = JSON.stringify(exportData, null, 2);

    const blob = new Blob(
        [dataString],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = "map_network.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    console.log("Exported.");
};

// Import
export function importGraph(file) {
    if (!file) return;  // Safety

    const reader = new FileReader();

    reader.onload = function(e) {

        try {

            const importedData = JSON.parse(e.target.result);

            state.nodes.forEach(node => {

                if (node.marker) {
                    map.removeLayer(node.marker);
                }
            });

            state.edges.forEach(edge => {

                if (edge.line) {
                    map.removeLayer(edge.line);
                }
            });

            state.nodes = [];
            state.edges = [];

            if (importedData.nodes) {

                importedData.nodes.forEach(nodeData => {

                    createNode({
                        lat: nodeData.lat,
                        lng: nodeData.lng
                    });

                    const createdNode =
                        state.nodes[state.nodes.length - 1];

                    createdNode.id = nodeData.id;
                });
            }

            if (importedData.edges) {

                importedData.edges.forEach(edgeData => {

                    const nodeA =
                        state.nodes.find(
                            n => n.id === edgeData.from
                        );

                    const nodeB =
                        state.nodes.find(
                            n => n.id === edgeData.to
                        );

                    if (nodeA && nodeB) {

                        createEdge(nodeA, nodeB);

                        const createdEdge =
                            state.edges[state.edges.length - 1];

                        createdEdge.id = edgeData.id;

                        createdEdge.wheelchairAccessible =
                            edgeData.wheelchairAccessible ?? true;
                    }
                });
            }

            console.log("Loaded.");

        } catch(err) {

            console.error(err);

            alert("Error while loading JSON.");
        }
    };

    reader.readAsText(file);
};
