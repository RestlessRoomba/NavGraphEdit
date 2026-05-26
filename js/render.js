import { addNodeToMap } from "./nodes.js";
import { addEdgeToMap } from "./edges.js";
import { state, getActiveGraph } from "./state.js";
import { outdoorMap, indoorMap } from "./maps.js";

export function renderActiveGraph() {
    const graph = getActiveGraph();

    clearGraphLayers(graph);

    graph.nodes.forEach(node => addNodeToMap(node));

    graph.edges.forEach(edge => {
        const nodeA = graph.nodes.find(n => n.id === edge.from);
        const nodeB = graph.nodes.find(n => n.id === edge.to);

        if (nodeA && nodeB) {
            addEdgeToMap(nodeA, nodeB, edge);
        }
    });
}

export function clearActiveGraphLayers() {
    clearGraphLayers(getActiveGraph());
}

export function clearAllRenderedLayers() {
    clearGraphLayers(state.outdoor);

    // Clear all Floors of all Buildings
    Object.values(state.indoor.buildings ?? {}).forEach(building => {
        Object.values(building.floors ?? {}).forEach(floor => {
            clearGraphLayers(floor);
        });
    });
}

export function clearGraphLayers(graph) {
    // Remove Nodes, try outdoor and indoor
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

    // Remove Edges, try outdoor and indoor
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
