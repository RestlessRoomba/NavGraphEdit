import { state } from './state.js';
import { map } from './map.js';
import { createNode } from './nodes.js';
import { createEdge } from './edges.js';

// Export
export function exportGraph() {
    const exportData = {    
        nodes: state.nodes.map(node => ({   // New array of nodes
            id: node.id,
            lat: node.lat,
            lng: node.lng
        })),

        edges: state.edges.map(edge => ({   // New array of edges
            id: edge.id,
            from: edge.from,
            to: edge.to,

            wheelchairAccessible: edge.wheelchairAccessible,

            weight: edge.weight
        }))
    };

    const dataString = JSON.stringify(exportData, null, 2); // Convert into string

    const blob = new Blob(  // Convert string into blob (binary large object)
        [dataString],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);  // Temp URL to blob
    const link = document.createElement('a');
    link.href = url;    // Link destination = temp URL
    link.download = "map_network.json"; // Default filename for download
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

            state.nodes.forEach(node => {   // Remove all markers
                if (node.marker) {
                    map.removeLayer(node.marker);
                }
            });

            state.edges.forEach(edge => {   // Remove all lines
                if (edge.line) {
                    map.removeLayer(edge.line);
                }
            });

            // Reset global data arrays
            state.nodes = [];
            state.edges = [];

            // Create all nodes
            if (importedData.nodes) {
                importedData.nodes.forEach(nodeData => {
                    createNode( {
                        lat: nodeData.lat,
                        lng: nodeData.lng
                    },
                    nodeData.id // Pass node-id into createNode()
                );
                });
            }

            // Create all edges
            if (importedData.edges) {
                importedData.edges.forEach(edgeData => {
                    // Find connections
                    const nodeA =
                        state.nodes.find(
                            n => n.id === edgeData.from
                        );

                    const nodeB =
                        state.nodes.find(
                            n => n.id === edgeData.to
                        );

                    if (nodeA && nodeB) {
                        createEdge(
                            nodeA,
                            nodeB,
                            edgeData.id,    // Pass edge-id into createEdge()
                            edgeData.wheelchairAccessible ?? true
                        );
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
