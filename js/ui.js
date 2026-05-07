import { state } from './state.js';
import { map } from './map.js';
import { exportGraph, importGraph } from './io.js';

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
        `;
    }
}

// Hide Info Panel
export function hideInfoPanel() {
    document.getElementById('info-panel').classList.add("hidden"); // hide
}

// Delete Button
document.getElementById('delete-btn').onclick = function () {
    if (!state.selectedObject) return;    // Safety, only for selected objects

    // If Node Selected
    if (state.selectedObject.type === "node") {
        if (state.selectedObject.marker) {
            map.removeLayer(state.selectedObject.marker); // Delete marker from map
        }

        // All connected Edges to the selected Node
        const edgesToRemove = state.edges.filter(e => e.from === state.selectedObject.id || e.to === state.selectedObject.id);

        // Delete connected Edges from map
        edgesToRemove.forEach(edge => {
            if (edge.line) {
                map.removeLayer(edge.line);
            }
        });

        // Delete Edges from List
        state.edges = state.edges.filter(e => e.from !== state.selectedObject.id && e.to !== state.selectedObject.id);

        // Delete Nodes from List
        state.nodes = state.nodes.filter(n => n.id !== state.selectedObject.id);

    // If Edge selected
    } else if (state.selectedObject.type === "edge") {
        if (state.selectedObject.line) {
            map.removeLayer(state.selectedObject.line);  // Delete Edge from map
        }

        // Delete Edge from List
        state.edges = state.edges.filter(e => e.id !== state.selectedObject.id);
    }

    state.selectedObject = null;   // Reset selectedObject
    state.edgeStartNode = null;   // Reset StartNode
    hideInfoPanel();
};

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