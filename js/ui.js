import { nodes, edges, selectedObject } from "./state";
import { map } from './map.js';

// Node selection
export function selectNode(node) {
    selectedObject = node;
    console.log("Selected node: ", node.id);
    showInfoPanel(node);
}

// Edge selection
export function selectEdge(edge) {
    selectedObject = edge;
    console.log("Selected Edge: ", edge.id);
    showInfoPanel(edge);
}

export function setMarkerEditMode(active) {    // activated by Shift-Key-Listener -> UI
    nodes.forEach(node => {
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
    if (!selectedObject) return;    // Safety, only for selected objects

    if (selectedObject.type === "node") {  // If Node selected 
        if (selectedObject.marker) {
            map.removeLayer(selectedObject.marker); // Delete marker from map
        }

        // All connected Edges to the selected Node
        const edgesToRemove = edges.filter(e => e.from === selectedObject.id || e.to === selectedObject.id);

        // Delete connected Edges from map
        edgesToRemove.forEach(edge => {
            if (edge.line) {
                map.removeLayer(edge.line);
            }
        });

        // Delete Edges from List
        edges = edges.filter(e => e.from !== selectedObject.id && e.to !== selectedObject.id);

        // Delete Nodes from List
        nodes = nodes.filter(n => n.id !== selectedObject.id);

    // If Edge selected
    } else if (selectedObject.type === "edge") {
        if (selectedObject.line) {
            map.removeLayer(selectedObject.line);  // Delete Edge from map
        }

        // Delete Edge from List
        edges = edges.filter(e => e.id !== selectedObject.id);
    }

    selectedObject = null;   // Reset selectedObject
    edgeStartNode = null;   // Reset StartNode
    hideInfoPanel();
};
