import { state } from './state.js';
import { map } from './map.js';
import { exportGraph, importGraph } from './io.js';
import { createEdge } from './edges.js';
import { createNode } from './nodes.js';

// Node selection
export function selectNode(node) {
    state.selectedObject = node;
    console.log("Selected node: ", node.id);
    showInfoPanel(node);
}

// Edge selection
export function selectEdge(edge) {
    state.selectedObject = edge;
    console.log("Selected Edge: ", edge.id);
    showInfoPanel(edge);
}

export function setMarkerEditMode(active) {    // activated by Shift-Key-Listener -> UI
    state.nodes.forEach(node => {
        const el = node.marker.getElement();

        if (!el) return;    // in case of no markers

        if (active) {
            el.classList.add('transparent');
            el.classList.add('no-click');
        } else {
            el.classList.remove('transparent');
            el.classList.remove('no-click');
        }
    });
}

// Info Panel

// Show Info Panel
export function showInfoPanel(obj) {

    // Define objects via html reference
    const panel = document.getElementById("info-panel");
    const title = document.getElementById("info-title");
    const content = document.getElementById("info-content");

    panel.classList.remove("hidden");   // show

    if (obj.type === "node") {  // For Nodes
        title.textContent = "Node";

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>Lat: ${obj.lat}</div>
            <div>Lng: ${obj.lng}</div>
        `;
    }

    if (obj.type === "edge") {  // For Edges
        title.textContent = "Edge";

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>From: ${obj.from}</div>
            <div>To: ${obj.to}</div>

            <div>
                <label>
                    <input
                        type="checkbox"
                        id="wheelchair-checkbox"
                        ${obj.wheelchairAccessible !== false ? "checked" : ""}
                    >
                    Wheelchair accessible
                </label>
            </div>

            <div>
                <button id="split-edge-btn">Split Edge</button>
            </div>
        `;

        const checkbox = document.getElementById("wheelchair-checkbox");
        checkbox.addEventListener("change", function() {
            obj.wheelchairAccessible = this.checked;
            console.log("Wheelchair accessible: ", obj.wheelchairAccessible);
        });

        const splitButton = document.getElementById("split-edge-btn");
        splitButton.addEventListener("click", function() {
            splitEdge(obj);
        });
    }
}

// Hide Info Panel
export function hideInfoPanel() {
    document.getElementById('info-panel').classList.add("hidden"); // hide
}

// Delete Button
document.getElementById('delete-btn').onclick = function () {
    if (!state.selectedObject) return;    // Safety, only for selected objects

    if (state.selectedObject.type === "node") { // If Node Selected
        deleteNode(state.selectedObject);

    } else if (state.selectedObject.type === "edge") {  // If Edge selected
        deleteEdge(state.selectedObject);
    }

    state.selectedObject = null;   // Reset selectedObject
    state.edgeStartNode = null;   // Reset StartNode
    hideInfoPanel();
};

// Delete Node
export function deleteNode(node) {
    if (node.marker) {
            map.removeLayer(node.marker); // Delete marker from map
        }

        // All connected Edges to the selected Node
        const edgesToRemove = state.edges.filter(e => e.from === node.id || e.to === node.id);

        // Delete connected Edges from map
        edgesToRemove.forEach(edge => {
            deleteEdge(edge);
        });

        // Delete Nodes from List
        state.nodes = state.nodes.filter(n => n.id !== node.id);
}

// Delete Edge
export function deleteEdge(edge) {
    if (edge.line) {
            map.removeLayer(edge.line);  // Delete Edge from map
        }

        // Delete Edge from List
        state.edges = state.edges.filter(e => e.id !== edge.id);
}

// Split Edge
export function splitEdge(edge) {
    // Find connected nodes of old edge
    const nodeA = state.nodes.find(n => n.id === edge.from);
    const nodeB = state.nodes.find(n => n.id === edge.to);
    if (!nodeA || !nodeB) return;   // Safety

    // Calculate middle
    const middleLat = (nodeA.lat + nodeB.lat) / 2;
    const middleLng = (nodeA.lng + nodeB.lng) / 2;

    // Create new node
    const newNode = createNode({
        lat: middleLat,
        lng: middleLng
    });

    // Delete the old edge
    deleteEdge(edge);   

    // Create two new edges
    createEdge(
        nodeA,
        newNode,
        undefined,
        edge.wheelchairAccessible
    );

    createEdge(
        newNode,
        nodeB,
        undefined,
        edge.wheelchairAccessible
    );

    state.selectedObject = null;
    hideInfoPanel();
}

// Export-Button
document.getElementById('export-btn').onclick = exportGraph;

// Load-Button
document.getElementById('load-btn').onclick = function () {
    document.getElementById('import-input').click();
};

// Import-Input
document.getElementById('import-input').onchange = function(event) {
    importGraph(event.target.files[0]); // Process browser-event and give file to IO
    event.target.value = "";    // Reset input value
};