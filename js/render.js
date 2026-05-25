import { addNodeToMap } from "./nodes.js";
import { addEdgeToMap } from "./edges.js";
import { getActiveGraph } from "./state.js";

export function renderActiveGraph() {
    const graph = getActiveGraph();

    graph.nodes.forEach(node => addNodeToMap(node));
    graph.edges.forEach(edge => {
        const nodeA = graph.nodes.find(n => n.id === edge.from);
        const nodeB = graph.nodes.find(n => n.id === edge.to);

        if (nodeA && nodeB) {
            addEdgeToMap(nodeA, nodeB, edge);
        }
    });
}
